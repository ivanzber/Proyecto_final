import api from './api';

export interface Area {
    id: number;
    name: string;
    code: string;
    description?: string;
    parentAreaId?: number;
    coordinates?: any;
    metadata?: any;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateAreaDto {
    name: string;
    code: string;
    description?: string;
    parentAreaId?: number;
    coordinates?: any;
    metadata?: any;
    isActive?: boolean;
}

export const areasService = {
    async getAll(): Promise<Area[]> {
        const response = await api.get('/areas');
        return response.data;
    },

    async getById(id: number): Promise<Area> {
        const response = await api.get(`/areas/${id}`);
        return response.data;
    },

    async create(data: CreateAreaDto): Promise<Area> {
        const response = await api.post('/areas', data);
        return response.data;
    },

    async update(id: number, data: Partial<CreateAreaDto>): Promise<Area> {
        const response = await api.patch(`/areas/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/areas/${id}`);
    },
};
