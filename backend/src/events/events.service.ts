import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities';

@Injectable()
export class EventsService {
    constructor(
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
    ) { }

    async create(createDto: any, userId: number) {
        const event = this.eventRepository.create({ ...createDto, createdBy: userId });
        return this.eventRepository.save(event);
    }

    async findAll(isPublished?: boolean) {
        const where: any = {};
        if (isPublished !== undefined) where.isPublished = isPublished;

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

        if (!event) {
            throw new NotFoundException('Evento no encontrado');
        }

        return event;
    }

    async update(id: number, updateDto: any) {
        await this.findOne(id);
        await this.eventRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.eventRepository.delete(id);
        return { message: 'Evento eliminado correctamente' };
    }
}
