import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Event, PointOfInterest, SubadminArea } from '../entities';

@Module({
    imports: [TypeOrmModule.forFeature([Event, PointOfInterest, SubadminArea])],
    controllers: [EventsController],
    providers: [EventsService],
})
export class EventsModule { }
