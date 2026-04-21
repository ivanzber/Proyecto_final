import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Event } from '../entities';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
    ) {}

    // ── Crear evento con validación de conflictos ─────────────────
    async create(createDto: any, userId: number) {
        // Validar conflicto de horario en el mismo POI o área
        if (createDto.eventDate && createDto.startTime && createDto.endTime) {
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

    // ── Validar conflicto de horario ──────────────────────────────
    private async checkConflict(
        eventDate: string,
        startTime: string,
        endTime: string,
        pointOfInterestId?: number,
        areaId?: number,
        excludeId?: number,
    ) {
        const existing = await this.eventRepository.find({
            where: [
                pointOfInterestId ? { eventDate: eventDate as any, pointOfInterestId, isPublished: true } : {},
                areaId            ? { eventDate: eventDate as any, areaId,            isPublished: true } : {},
            ].filter(w => Object.keys(w).length > 0),
        });

        const toMinutes = (t: string) => {
            const [h, m] = t.split(':').map(Number);
            return h * 60 + m;
        };

        const newStart = toMinutes(startTime);
        const newEnd   = toMinutes(endTime);

        for (const ev of existing) {
            if (excludeId && ev.id === excludeId) continue;
            if (!ev.startTime || !ev.endTime) continue;

            const exStart = toMinutes(ev.startTime);
            const exEnd   = toMinutes(ev.endTime);

            // Hay conflicto si los rangos se solapan
            const overlaps = newStart < exEnd && newEnd > exStart;
            if (overlaps) {
                throw new ConflictException(
                    `Ya existe un evento en ese horario: "${ev.title}" (${ev.startTime} — ${ev.endTime}). No se pueden cruzar eventos en el mismo lugar y fecha.`
                );
            }
        }
    }

    // ── Listar eventos — solo activos (no expirados) ──────────────
    async findAll(isPublished?: boolean, pointOfInterestId?: number, areaId?: number) {
        const now       = new Date();
        const today     = now.toISOString().split('T')[0];
        const nowTime   = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:00`;

        let query = this.eventRepository
            .createQueryBuilder('event')
            .leftJoinAndSelect('event.area', 'area')
            .leftJoinAndSelect('event.pointOfInterest', 'poi')
            .orderBy('event.eventDate', 'ASC')
            .addOrderBy('event.startTime', 'ASC');

        if (isPublished !== undefined) {
            query = query.andWhere('event.isPublished = :pub', { pub: isPublished });
        }

        if (pointOfInterestId) {
            query = query.andWhere('event.pointOfInterestId = :poiId', { poiId: pointOfInterestId });
        }

        if (areaId) {
            query = query.andWhere('event.areaId = :areaId', { areaId });
        }

        // Excluir eventos pasados automáticamente
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
        if (areaId)            where.areaId = areaId;

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

        // Validar conflicto al editar (excluir el propio evento)
        const date  = updateDto.eventDate  || existing.eventDate;
        const start = updateDto.startTime  || existing.startTime;
        const end   = updateDto.endTime    || existing.endTime;
        const poi   = updateDto.pointOfInterestId ?? existing.pointOfInterestId;
        const area  = updateDto.areaId            ?? existing.areaId;

        if (date && start && end) {
            await this.checkConflict(
                String(date), start, end, poi, area, id
            );
        }

        await this.eventRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.eventRepository.delete(id);
        return { message: 'Evento eliminado correctamente' };
    }
}