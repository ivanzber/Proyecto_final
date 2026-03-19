import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unity3DController } from './unity3d.controller';
import { Unity3DService } from './unity3d.service';
import { PointOfInterest, Area } from '../entities';

@Module({
    imports: [TypeOrmModule.forFeature([PointOfInterest, Area])],
    controllers: [Unity3DController],
    providers: [Unity3DService],
})
export class Unity3DModule { }
