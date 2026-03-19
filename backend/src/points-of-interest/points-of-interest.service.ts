import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { PointOfInterest, SubadminArea } from '../entities';

@Injectable()
export class PointsOfInterestService {
    constructor(
        @InjectRepository(PointOfInterest)
        private readonly pointRepository: Repository<PointOfInterest>,
        @InjectRepository(SubadminArea)
        private readonly subadminAreaRepository: Repository<SubadminArea>,
    ) { }

    async create(createDto: any, userId: number, userRole: string) {
        const point = this.pointRepository.create({
            ...createDto,
            createdBy: userId,
        });
        return this.pointRepository.save(point);
    }

    async findAll(params?: any) {
        const where: any = {};
        if (params?.areaId) where.areaId = params.areaId;
        if (params?.isVisible !== undefined) where.isVisible = params.isVisible;

        return this.pointRepository.find({
            where,
            relations: ['area'],
            order: { orderIndex: 'ASC', createdAt: 'DESC' },
        });
    }

    async findOne(id: number) {
        const point = await this.pointRepository.findOne({
            where: { id },
            relations: ['area', 'createdByUser'],
        });

        if (!point) {
            throw new NotFoundException('Punto de interés no encontrado');
        }

        return point;
    }

    async update(id: number, updateDto: any, userId: number, userRole: string) {
        const point = await this.findOne(id);

        //Verificar permisos de subadmin
        if (userRole === 'SUBADMIN') {
            const hasAccess = await this.checkSubadminAccess(userId, point.areaId);
            if (!hasAccess) {
                throw new ForbiddenException('No tiene permisos para editar este punto');
            }
        }

        await this.pointRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async remove(id: number, userId: number, userRole: string) {
        const point = await this.findOne(id);

        if (userRole === 'SUBADMIN') {
            const hasAccess = await this.checkSubadminAccess(userId, point.areaId);
            if (!hasAccess) {
                throw new ForbiddenException('No tiene permisos para eliminar este punto');
            }
        }

        await this.pointRepository.delete(id);
        return { message: 'Punto eliminado correctamente' };
    }

    private async checkSubadminAccess(userId: number, areaId: number): Promise<boolean> {
        const assignment = await this.subadminAreaRepository.findOne({
            where: { userId, areaId },
        });
        return !!assignment;
    }
}
