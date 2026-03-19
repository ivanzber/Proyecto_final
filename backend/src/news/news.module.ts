import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsController } from './news.controller';
import { NewsService } from './news.service';
import { News, SubadminArea } from '../entities';

@Module({
    imports: [TypeOrmModule.forFeature([News, SubadminArea])],
    controllers: [NewsController],
    providers: [NewsService],
})
export class NewsModule { }
