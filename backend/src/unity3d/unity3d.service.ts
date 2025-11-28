import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PointOfInterest, Area } from '../entities';

/**
 * ============================================
 * SERVICIO PARA INTEGRACIÓN CON UNITY 3D WEBGL
 * ============================================
 * 
 * Este servicio proporciona los endpoints necesarios
 * para la comunicación entre el modelo 3D de Unity
 * y el backend del sistema.
 * 
 * El módulo 3D consumirá estos endpoints para:
 * - Obtener puntos de interés con coordenadas 3D
 * - Sincronizar áreas y ubicaciones
 * - Registrar interacciones del usuario
 */
@Injectable()
export class Unity3DService {
    constructor(
        @InjectRepository(PointOfInterest)
        private readonly pointRepository: Repository<PointOfInterest>,
        @InjectRepository(Area)
        private readonly areaRepository: Repository<Area>,
    ) { }

    /**
     * Obtiene todos los puntos de interés con sus coordenadas 3D
     * para renderizar en Unity
     */
    async getPointsForUnity() {
        const points = await this.pointRepository.find({
            where: { isVisible: true },
            relations: ['area'],
            order: { orderIndex: 'ASC' },
        });

        return points.map(point => ({
            id: point.id,
            title: point.title,
            description: point.description,
            category: point.category,
            coordinates: point.coordinates,
            areaCode: point.area.code,
            iconUrl: point.iconUrl,
        }));
    }

    /**
     * Obtiene todas las áreas con coordenadas para el mapa 3D
     */
    async getAreasForUnity() {
        const areas = await this.areaRepository.find({
            where: { isActive: true },
            order: { name: 'ASC' },
        });

        return areas.map(area => ({
            id: area.id,
            name: area.name,
            code: area.code,
            coordinates: area.coordinates,
            parentAreaId: area.parentAreaId,
        }));
    }

    /**
     * Obtiene datos completos para inicializar el mundo 3D
     */
    async getWorldData() {
        const [points, areas] = await Promise.all([
            this.getPointsForUnity(),
            this.getAreasForUnity(),
        ]);

        return {
            points,
            areas,
            metadata: {
                totalPoints: points.length,
                totalAreas: areas.length,
                lastUpdate: new Date().toISOString(),
            },
        };
    }
}
