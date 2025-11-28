import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PointsOfInterestController } from './points-of-interest.controller';
import { PointsOfInterestService } from './points-of-interest.service';
import { PointOfInterest, Area, SubadminArea } from '../entities';

@Module({
    imports: [TypeOrmModule.forFeature([PointOfInterest, Area, SubadminArea])],
    controllers: [PointsOfInterestController],
    providers: [PointsOfInterestService],
    exports: [PointsOfInterestService],
})
export class PointsOfInterestModule { }
