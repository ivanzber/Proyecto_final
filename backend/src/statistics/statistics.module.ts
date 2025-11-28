import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatisticsController } from './statistics.controller';
import { StatisticsService } from './statistics.service';
import { Statistic, PointOfInterest } from '../entities';

@Module({
    imports: [TypeOrmModule.forFeature([Statistic, PointOfInterest])],
    controllers: [StatisticsController],
    providers: [StatisticsService],
    exports: [StatisticsService],
})
export class StatisticsModule { }
