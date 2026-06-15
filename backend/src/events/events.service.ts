import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities';
import { PointOfInterest } from '../entities/point-of-interest.entity';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,

        @InjectRepository(PointOfInterest)
        private readonly poiRepository: Repository<PointOfInterest>,
    ) { }

    // ── Crear evento con validación de conflictos ─────────────────
    async create(createDto: any, userId: number) {
        if (createDto.startTime && createDto.endTime) {
            const [sh, sm] = createDto.startTime.split(':').map(Number);
            const [eh, em] = createDto.endTime.split(':').map(Number);
            if (eh * 60 + em <= sh * 60 + sm) {
                throw new ConflictException('La hora de finalización debe ser posterior a la hora de inicio.');
            }
        }

        if (createDto.eventDate) {
            await this.checkConflict(
                createDto.eventDate,
                createDto.startTime,
                createDto.endTime,
                createDto.pointOfInterestId,
                createDto.areaId,
            );
        }
        const event = this.eventRepository.create({ ...createDto, createdBy: userId });
        return this.eventRepository.save(event);
    }

    // ── Resolver el areaId de un POI ──────────────────────────────
    private async resolvePoiAreaId(pointOfInterestId: number): Promise<number | undefined> {
        const poi = await this.poiRepository.findOne({ where: { id: pointOfInterestId } });
        return poi?.areaId;
    }

    // ── Validar conflicto cruzando POI ↔ Área (ambas direcciones) ─
    private async checkConflict(
        eventDate: string,
        startTime?: string,
        endTime?: string,
        pointOfInterestId?: number,
        areaId?: number,
        excludeId?: number,
    ) {
        if (!pointOfInterestId && !areaId) return;

        // Determinar el areaId efectivo:
        // Si viene un POI, resolvemos su área para el cruce inverso.
        let effectiveAreaId = areaId;
        if (pointOfInterestId) {
            const poiAreaId = await this.resolvePoiAreaId(pointOfInterestId);
            // Usamos el área del POI si no se pasó areaId directamente
            if (!effectiveAreaId) effectiveAreaId = poiAreaId;
        }

        // QueryBuilder con JOIN a pointOfInterest para cruzar en ambas direcciones:
        // 1. Mismo POI exacto
        // 2. Mismo areaId directo en el evento
        // 3. El evento tiene un POI que pertenece al mismo área (poi.areaId = effectiveAreaId)
        let query = this.eventRepository
            .createQueryBuilder('event')
            .leftJoin('event.pointOfInterest', 'poi')
            .where('event.eventDate = :eventDate', { eventDate });

        if (pointOfInterestId && effectiveAreaId) {
            query = query.andWhere(
                '(event.pointOfInterestId = :poiId OR event.areaId = :areaId OR poi.areaId = :areaId)',
                { poiId: pointOfInterestId, areaId: effectiveAreaId }
            );
        } else if (pointOfInterestId) {
            query = query.andWhere(
                '(event.pointOfInterestId = :poiId)',
                { poiId: pointOfInterestId }
            );
        } else if (effectiveAreaId) {
            // Evento de área: buscar también en eventos que tengan un POI de esa área
            query = query.andWhere(
                '(event.areaId = :areaId OR poi.areaId = :areaId)',
                { areaId: effectiveAreaId }
            );
        }

        const existing = await query.getMany();

        const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        for (const ev of existing) {
            if (excludeId && ev.id === excludeId) continue;

            // Si alguno no tiene horario, conflicto directo de lugar y fecha
            if (!startTime || !endTime || !ev.startTime || !ev.endTime) {
                throw new ConflictException(
                    `Ya existe un evento "${ev.title}" en ese lugar y fecha. ` +
                    `Agrega un horario específico o elige otro lugar/fecha.`
                );
            }

            const newStart = toMinutes(startTime);
            const newEnd = toMinutes(endTime);
            const exStart = toMinutes(ev.startTime);
            const exEnd = toMinutes(ev.endTime);

            const overlaps = newStart < exEnd && newEnd > exStart;
            if (overlaps) {
                throw new ConflictException(
                    `Conflicto de horario con "${ev.title}" ` +
                    `(${ev.startTime} — ${ev.endTime}). ` +
                    `Los eventos no pueden cruzarse en el mismo lugar y fecha.`
                );
            }
        }
    }

    // ── Listar eventos activos (no expirados) ─────────────────────
    // poiAreaId: si se pasa, también incluye eventos del área del POI
    async findAll(
        isPublished?: boolean,
        pointOfInterestId?: number,
        areaId?: number,
        poiAreaId?: number,
    ) {
        const bogotaTime = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Bogota"}));
        const yyyy = bogotaTime.getFullYear();
        const mm = String(bogotaTime.getMonth() + 1).padStart(2, '0');
        const dd = String(bogotaTime.getDate()).padStart(2, '0');
        const today = `${yyyy}-${mm}-${dd}`;
        const nowTime = `${String(bogotaTime.getHours()).padStart(2, '0')}:${String(bogotaTime.getMinutes()).padStart(2, '0')}:00`;

        let query = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.area', 'area')
            .leftJoinAndSelect('event.pointOfInterest', 'poi')
            .orderBy('event.eventDate', 'ASC')
            .addOrderBy('event.startTime', 'ASC');

        if (isPublished !== undefined) {
            query = query.andWhere('event.isPublished = :pub', { pub: isPublished });
        }

        // Si viene pointOfInterestId y/o poiAreaId, buscamos por ambos (OR)
        if (pointOfInterestId && poiAreaId) {
            query = query.andWhere(
                '(event.pointOfInterestId = :poiId OR event.areaId = :poiAreaId)',
                { poiId: pointOfInterestId, poiAreaId }
            );
        } else if (pointOfInterestId) {
            query = query.andWhere('event.pointOfInterestId = :poiId', { poiId: pointOfInterestId });
        } else if (areaId) {
            query = query.andWhere('event.areaId = :areaId', { areaId });
        }

        query = query.andWhere(
            '(event.eventDate > :today OR (event.eventDate = :today AND (event.endTime IS NULL OR event.endTime > :nowTime)))',
            { today, nowTime }
        );

        return query.getMany();
    }

    // ── Listar TODOS (admin — incluyendo pasados) ─────────────────
    async findAllAdmin(pointOfInterestId?: number, areaId?: number) {
        const where: any = {};
        if (pointOfInterestId) where.pointOfInterestId = pointOfInterestId;
        if (areaId) where.areaId = areaId;

        return this.eventRepository.find({
            where,
            relations: ['area', 'pointOfInterest'],
            order: { eventDate: 'DESC' },
        });
    }

    async findOne(id: number) {
        const event = await this.eventRepository.findOne({
            where: { id },
            relations: ['area', 'pointOfInterest', 'createdByUser'],
        });
        if (!event) throw new NotFoundException('Evento no encontrado');
        return event;
    }

    async update(id: number, updateDto: any) {
        const existing = await this.findOne(id);

        const date = updateDto.eventDate || existing.eventDate;
        const start = updateDto.startTime || existing.startTime;
        const end = updateDto.endTime || existing.endTime;
        const poi = updateDto.pointOfInterestId ?? existing.pointOfInterestId;
        const area = updateDto.areaId ?? existing.areaId;

        if (start && end) {
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            if (eh * 60 + em <= sh * 60 + sm) {
                throw new ConflictException('La hora de finalización debe ser posterior a la hora de inicio.');
            }
        }

        if (date) {
            await this.checkConflict(String(date), start, end, poi, area, id);
        }

        await this.eventRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.eventRepository.delete(id);
        return { message: 'Evento eliminado correctamente' };
    }

    // ── Resolver areaId de un POI (público para el controlador) ───
    async getPoiAreaId(poiId: number): Promise<number | undefined> {
        return this.resolvePoiAreaId(poiId);
    }
}