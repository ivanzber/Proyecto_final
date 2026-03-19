import api from './api';

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    roleId: number;
    role?: {
        id: number;
        name: string;
        description: string;
    };
    isActive: boolean;
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateUserDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: number;
}

export interface UpdateUserDto {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    roleId?: number;
    isActive?: boolean;
}

export const usersService = {
    async getAll(): Promise<User[]> {
        const response = await api.get('/users');
        return response.data;
    },

    async getById(id: number): Promise<User> {
        const response = await api.get(`/users/${id}`);
        return response.data;
    },

    async create(data: CreateUserDto): Promise<User> {
        const response = await api.post('/users', data);
        return response.data;
    },

    async update(id: number, data: UpdateUserDto): Promise<User> {
        const response = await api.patch(`/users/${id}`, data);
        return response.data;
    },

    async delete(id: number): Promise<void> {
        await api.delete(`/users/${id}`);
    },

    async assignAreas(userId: number, areaIds: number[]): Promise<User> {
        const response = await api.post(`/users/${userId}/assign-areas`, { areaIds });
        return response.data;
    },

    async getAssignedAreas(userId: number): Promise<any[]> {
        const response = await api.get(`/users/${userId}/assigned-areas`);
        return response.data;
    },
};
