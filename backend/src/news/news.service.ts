import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { News } from '../entities';

@Injectable()
export class NewsService {
    constructor(
        @InjectRepository(News)
        private readonly newsRepository: Repository<News>,
    ) { }

    async create(createDto: any, userId: number) {
        const news = this.newsRepository.create({ ...createDto, createdBy: userId });
        return this.newsRepository.save(news);
    }

    async findAll(isPublished?: boolean, isFeatured?: boolean) {
        const where: any = {};
        if (isPublished !== undefined) where.isPublished = isPublished;
        if (isFeatured !== undefined) where.isFeatured = isFeatured;

        return this.newsRepository.find({
            where,
            relations: ['area'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: number) {
        const news = await this.newsRepository.findOne({
            where: { id },
            relations: ['area', 'createdByUser'],
        });

        if (!news) {
            throw new NotFoundException('Noticia no encontrada');
        }

        return news;
    }

    async update(id: number, updateDto: any) {
        await this.findOne(id);
        await this.newsRepository.update(id, updateDto);
        return this.findOne(id);
    }

    async remove(id: number) {
        await this.findOne(id);
        await this.newsRepository.delete(id);
        return { message: 'Noticia eliminada correctamente' };
    }
}
