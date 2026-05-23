import api from './api';

export interface Event {
    id: number;
    title: string;
    description?: string;
    areaId?: number;
    area?: {
        id: number;
        name: string;
    };
    pointOfInterestId?: number;
    pointOfInterest?: {
        id: number;
        title: string;
    };
    eventDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    imageUrl?: string;
    category?: string;
    isPublished: boolean;
    createdBy: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateEventDto {
    title: string;
    description?: string;
    areaId?: number;
    pointOfInterestId?: number;
    eventDate: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    imageUrl?: string;
    category?: string;
    isPublished?: boolean;
}

export const eventsService = {
    async getAll(): Promise<Event[]> {
        const response = await api.get('/events');
        return response.data;
    },

    async getById(id: number): Promise<Event> {
        const response = await api.get(`/events/${id}`);
        return response.data;
    },

    async create(data: CreateEventDto): Promise<Event> {
        const response = await api.post('/events', data);
        return response.data;
    },

    async update(id: number, data: Partial<CreateEventDto>): Promise<Event> {
        const response = await api.patch(`/events/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/events/${id}`);
    },

    async getPublished(): Promise<Event[]> {
        const response = await api.get('/events/published');
        return response.data;
    },

    // ── Historial: trae todos (incluyendo pasados) y filtra los anteriores a hoy
    async getPast(): Promise<Event[]> {
        const response = await api.get<Event[]>('/events/admin/all');
        const now = new Date();
        return response.data
            .filter(e => new Date(e.eventDate) < now)
            .sort((a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime());
    },
};
