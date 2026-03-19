import api from './api';

export interface PointOfInterest {
    id: number;
    title: string;
    description?: string;
    areaId: number;
    area?: {
        id: number;
        name: string;
        code: string;
    };
    category?: string;
    coordinates: any;
    iconUrl?: string;
    images?: string[];
    additionalInfo?: any;
    isVisible: boolean;
    orderIndex: number;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreatePointDto {
    title: string;
    description?: string;
    areaId: number;
    category?: string;
    coordinates: any;
    iconUrl?: string;
    images?: string[];
    additionalInfo?: any;
    isVisible?: boolean;
    orderIndex?: number;
}

export const pointsService = {
    async getAll(): Promise<PointOfInterest[]> {
        const response = await api.get('/points');
        return response.data;
    },

    async getById(id: number): Promise<PointOfInterest> {
        const response = await api.get(`/points/${id}`);
        return response.data;
    },

    async create(data: CreatePointDto): Promise<PointOfInterest> {
        const response = await api.post('/points', data);
        return response.data;
    },

    async update(id: number, data: Partial<CreatePointDto>): Promise<PointOfInterest> {
        const response = await api.patch(`/points/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/points/${id}`);
    },

    async getByArea(areaId: number): Promise<PointOfInterest[]> {
        const response = await api.get(`/points/area/${areaId}`);
        return response.data;
    },
};
