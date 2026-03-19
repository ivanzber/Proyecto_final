import api from './api';

export interface DashboardStats {
    totalUsers: number;
    totalAreas: number;
    totalPoints: number;
    totalEvents: number;
    totalNews: number;
    activeUsers: number;
    publishedEvents: number;
    publishedNews: number;
}

export interface AreaVisit {
    areaId: number;
    areaName: string;
    visitCount: number;
    percentage: number;
}

export interface VisitsByDate {
    date: string;
    visits: number;
}

export interface PopularPoint {
    pointId: number;
    pointTitle: string;
    clickCount: number;
}

export const statisticsService = {
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await api.get('/statistics/dashboard');
        return response.data;
    },

    async getMostVisitedAreas(limit: number = 10): Promise<AreaVisit[]> {
        const response = await api.get(`/statistics/areas/most-visited?limit=${limit}`);
        return response.data;
    },

    async getVisitsByDate(days: number = 30): Promise<VisitsByDate[]> {
        const response = await api.get(`/statistics/visits-by-date?days=${days}`);
        return response.data;
    },

    async getPopularPoints(limit: number = 10): Promise<PopularPoint[]> {
        const response = await api.get(`/statistics/points/popular?limit=${limit}`);
        return response.data;
    },

    async trackEvent(eventType: string, entityType?: string, entityId?: number, metadata?: any): Promise<void> {
        await api.post('/statistics/track', {
            eventType,
            entityType,
            entityId,
            metadata,
        });
    },
};
