import api from './api';

export interface News {
    id: number;
    title: string;
    summary?: string;
    content: string;
    areaId?: number;
    area?: {
        id: number;
        name: string;
    };
    featuredImage?: string;
    category?: string;
    isPublished: boolean;
    isFeatured: boolean;
    publishDate?: string;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNewsDto {
    title: string;
    summary?: string;
    content: string;
    areaId?: number;
    featuredImage?: string;
    category?: string;
    isPublished?: boolean;
    isFeatured?: boolean;
    publishDate?: string;
}

export const newsService = {
    async getAll(): Promise<News[]> {
        const response = await api.get('/news');
        return response.data;
    },

    async getById(id: number): Promise<News> {
        const response = await api.get(`/news/${id}`);
        return response.data;
    },

    async create(data: CreateNewsDto): Promise<News> {
        const response = await api.post('/news', data);
        return response.data;
    },

    async update(id: number, data: Partial<CreateNewsDto>): Promise<News> {
        const response = await api.patch(`/news/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/news/${id}`);
    },

    async getPublished(): Promise<News[]> {
        const response = await api.get('/news/published');
        return response.data;
    },

    async getFeatured(): Promise<News[]> {
        const response = await api.get('/news/featured');
        return response.data;
    },
};
