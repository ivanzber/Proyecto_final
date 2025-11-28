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
            uniqueSessions: parseInt(uniqueSessions.count),
            topPoints,
        };
    }

    async getRecentActivity(limit = 50) {
        return this.statisticRepository.find({
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
}
