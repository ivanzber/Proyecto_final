import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Area } from '../entities';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';

@Injectable()
export class AreasService {
    constructor(
        @InjectRepository(Area)
        private readonly areaRepository: Repository<Area>,
    ) { }

    async create(createAreaDto: CreateAreaDto) {
        const area = this.areaRepository.create(createAreaDto);
        return this.areaRepository.save(area);
    }

    async findAll() {
        return this.areaRepository.find({
            relations: ['parentArea', 'childAreas'],
            order: { name: 'ASC' },
        });
    }

    async findOne(id: number) {
        const area = await this.areaRepository.findOne({
            where: { id },
            relations: ['parentArea', 'childAreas', 'pointsOfInterest'],
        });

        if (!area) {
            throw new NotFoundException('Área no encontrada');
        }

        return area;
    }

    async update(id: number, updateAreaDto: UpdateAreaDto) {
        await this.findOne(id);
        await this.areaRepository.update(id, updateAreaDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.areaRepository.delete(id);
        return { message: 'Área eliminada correctamente' };
    }
}
