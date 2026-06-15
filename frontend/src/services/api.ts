import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url;
        console.error(`[API ERROR] ${url}`, error.response?.data);
        
        if (error.response?.status === 401) {

            const currentPath = window.location.pathname;
            const isAdminPanel = currentPath.startsWith('/admin') || currentPath.startsWith('/subadmin');
            if (!isAdminPanel) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        

        if (error.response?.data?.message) {
            error.message = `[${url}] ${error.response.data.message}`;
        }
        
        return Promise.reject(error);
    }
);

export default api;
