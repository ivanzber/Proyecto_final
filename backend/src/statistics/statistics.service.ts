import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Statistic, PointOfInterest, Area, Event } from '../entities';

@Injectable()
export class StatisticsService {
    constructor(
        @InjectRepository(Statistic)
        private readonly statisticRepository: Repository<Statistic>,
        @InjectRepository(PointOfInterest)
        private readonly pointRepository: Repository<PointOfInterest>,
        @InjectRepository(Area)
        private readonly areaRepository: Repository<Area>,
        @InjectRepository(Event)
        private readonly eventRepository: Repository<Event>,
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
            where: { eventType: 'point_click' },
        });

        const uniqueSessions = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('COUNT(DISTINCT stat.sessionId)', 'count')
            .getRawOne();

        const topPoints = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('stat.entityId', 'pointId')
            .addSelect('COUNT(*)', 'clicks')
            .where('stat.eventType = :type', { type: 'point_click' })
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

    async getMostVisitedAreas(limit: number = 10) {
        // Try to get real visit data from statistics table
        const rawData = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('stat.entityId', 'areaId')
            .addSelect('COUNT(*)', 'visitCount')
            .where('stat.entityType = :entity', { entity: 'area' })
            .groupBy('stat.entityId')
            .orderBy('visitCount', 'DESC')
            .limit(limit)
            .getRawMany();

        if (rawData.length > 0) {
            // Enrich with area names
            const totalVisits = rawData.reduce((sum: number, r: any) => sum + parseInt(r.visitCount), 0);
            const result = [];
            for (const row of rawData) {
                const area = await this.areaRepository.findOne({ where: { id: row.areaId } });
                result.push({
                    areaId: row.areaId,
                    areaName: area?.name || `Área ${row.areaId}`,
                    visitCount: parseInt(row.visitCount),
                    percentage: totalVisits > 0 ? Math.round((parseInt(row.visitCount) / totalVisits) * 100) : 0,
                });
            }
            return result;
        }

        // If no tracking data, return areas with 0 visits
        const areas = await this.areaRepository.find({ take: limit, order: { id: 'ASC' } });
        return areas.map(area => ({
            areaId: area.id,
            areaName: area.name,
            visitCount: 0,
            percentage: 0,
        }));
    }

    async getVisitsByDate(days: number = 30) {
        const sinceDate = new Date();
        sinceDate.setDate(sinceDate.getDate() - days);

        const rawData = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('DATE(stat.created_at)', 'date')
            .addSelect('COUNT(*)', 'visits')
            .where('stat.created_at >= :since', { since: sinceDate.toISOString().split('T')[0] })
            .groupBy('DATE(stat.created_at)')
            .orderBy('date', 'ASC')
            .getRawMany();

        if (rawData.length > 0) {
            return rawData.map((r: any) => ({
                date: r.date,
                visits: parseInt(r.visits),
            }));
        }

        // If no tracking data, return last N days with 0 visits
        const result = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            result.push({
                date: d.toISOString().split('T')[0],
                visits: 0,
            });
        }
        // Only return last 7 entries to keep charts clean
        return result.slice(-7);
    }

    async getPopularPoints(limit: number = 10) {
        // Try real data first
        const rawData = await this.statisticRepository
            .createQueryBuilder('stat')
            .select('stat.entityId', 'pointId')
            .addSelect('COUNT(*)', 'clickCount')
            .where('stat.eventType = :type', { type: 'point_click' })
            .andWhere('stat.entityType = :entity', { entity: 'point_of_interest' })
            .groupBy('stat.entityId')
            .orderBy('clickCount', 'DESC')
            .limit(limit)
            .getRawMany();

        if (rawData.length > 0) {
            const result = [];
            for (const row of rawData) {
                const point = await this.pointRepository.findOne({ where: { id: row.pointId } });
                result.push({
                    pointId: row.pointId,
                    pointTitle: point?.title || `Punto ${row.pointId}`,
                    clickCount: parseInt(row.clickCount),
                });
            }
            return result;
        }

        // If no tracking data, return points with 0 clicks
        const points = await this.pointRepository.find({ take: limit, order: { id: 'ASC' } });
        return points.map(p => ({
            pointId: p.id,
            pointTitle: p.title,
            clickCount: 0,
        }));
    }

    async getRecentActivity(limit = 50) {
        return this.statisticRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
}
