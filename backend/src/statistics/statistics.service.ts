import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statistic, PointOfInterest } from '../entities';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(Statistic)
        private readonly statisticRepository: Repository<Statistic>,
        @InjectRepository(PointOfInterest)
        private readonly pointRepository: Repository<PointOfInterest>,
    ) { }

    async track(trackDto: any) {
        const stat = this.statisticRepository.create(trackDto);
        return this.statisticRepository.save(stat);
    }

    async getDashboard() {
        const totalViews = await this.statisticRepository.count({
            where: { eventType: 'page_view' },
        });
        const pointClicks = await this.statisticRepository.count({
            where: { eventType: 'poi_visit' },
        });
        const uniqueSessions = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('COUNT(DISTINCT stat.sessionId)', 'count')
            .getRawOne();

        const topPoints = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('stat.entityId', 'pointId')
            .addSelect('COUNT(*)', 'clicks')
            .where('stat.eventType = :type', { type: 'poi_visit' })
            .andWhere('stat.entityType = :entity', { entity: 'point_of_interest' })
            .groupBy('stat.entityId')
            .orderBy('clicks', 'DESC')
            .limit(5)
            .getRawMany();

        return {
            totalViews,
            pointClicks,
            uniqueSessions: parseInt(uniqueSessions?.count || '0'),
            topPoints,
        };
    }

    // ── Zonas más visitadas ──────────────────────────────────────
    async getMostVisitedAreas(limit = 8) {
        const raw = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('stat.entityId', 'pointId')
            .addSelect('COUNT(*)', 'visitCount')
            .where('stat.eventType = :type', { type: 'poi_visit' })
            .andWhere('stat.entityType = :entity', { entity: 'point_of_interest' })
            .groupBy('stat.entityId')
            .orderBy('visitCount', 'DESC')
            .limit(limit)
            .getRawMany();

        // Enriquecer con nombre del POI
        const enriched = await Promise.all(
            raw.map(async (row) => {
                const poi = await this.pointRepository.findOne({
                    where: { id: row.pointId },
                    relations: ['area'],
                });
                return {
                    areaId: poi?.id || row.pointId,
                    areaName: poi?.title || `POI #${row.pointId}`,
                    visitCount: parseInt(row.visitCount),
                    percentage: 0,
                };
            })
        );

        // Calcular porcentajes
        const total = enriched.reduce((sum, r) => sum + r.visitCount, 0);
        return enriched.map(r => ({
            ...r,
            percentage: total > 0 ? Math.round((r.visitCount / total) * 100) : 0,
        }));
    }

    // ── Visitas por día ──────────────────────────────────────────
    async getVisitsByDate(days = 7) {
        const raw = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('DATE(stat.createdAt)', 'date')
            .addSelect('COUNT(*)', 'visits')
            .where('stat.createdAt >= DATE_SUB(NOW(), INTERVAL :days DAY)', { days })
            .groupBy('DATE(stat.createdAt)')
            .orderBy('date', 'ASC')
            .getRawMany();

        return raw.map(r => ({
            // ← Convertir a string ISO para evitar NaN en el frontend
            date: r.date instanceof Date
                ? r.date.toISOString().split('T')[0]
                : String(r.date),
            visits: parseInt(r.visits),
        }));
    }

    // ── Usuarios activos en el recorrido ─────────────────────────
    async getActiveUsers() {
        const raw = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('COUNT(DISTINCT stat.sessionId)', 'count')
            .where('stat.createdAt >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)')
            .getRawOne();

        return { activeNow: parseInt(raw?.count || '0') };
    }

    async getRecentActivity(limit = 50) {
        return this.statisticRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
async getViewsSummary() {
    const eventViews = await this.statisticRepository
        .createQueryBuilder('stat')
        .select('stat.entityId', 'entityId')
        .addSelect('COUNT(DISTINCT stat.sessionId)', 'views')
        .where('stat.eventType = :type', { type: 'content_view' })
        .andWhere('stat.entityType = :entity', { entity: 'event' })
        .groupBy('stat.entityId')
        .orderBy('views', 'DESC')
        .limit(20)
        .getRawMany();

    const newsViews = await this.statisticRepository
        .createQueryBuilder('stat')
        .select('stat.entityId', 'entityId')
        .addSelect('COUNT(DISTINCT stat.sessionId)', 'views')
        .where('stat.eventType = :type', { type: 'content_view' })
        .andWhere('stat.entityType = :entity', { entity: 'news' })
        .groupBy('stat.entityId')
        .orderBy('views', 'DESC')
        .limit(20)
        .getRawMany();

    return {
        events: eventViews.map(r => ({
            entityId: parseInt(r.entityId),
            views:    parseInt(r.views),
        })),
        news: newsViews.map(r => ({
            entityId: parseInt(r.entityId),
            views:    parseInt(r.views),
        })),
    };
}
}
