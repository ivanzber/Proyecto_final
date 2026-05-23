import { create } from 'zustand';
import { User, authService } from '@/services/authService';

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (user: User, token: string) => void;
    setToken: (token: string) => void;
    clearAuth: () => void;
    checkAuth: () => void;
    fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    setAuth: (user, token) => {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true });
    },

    setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token, isAuthenticated: true });
    },

    clearAuth: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false });
    },

    checkAuth: () => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');

        if (token && userStr) {
            const user = JSON.parse(userStr);
            set({ user, token, isAuthenticated: true });
        } else {
            set({ user: null, token: null, isAuthenticated: false });
        }
    },

    /**
     * Obtiene el perfil del usuario autenticado desde el backend.
     * Se llama después del login, cuando ya tenemos el token pero no los datos del usuario.
     */
    fetchProfile: async () => {
        try {
            const user = await authService.getProfile();
            localStorage.setItem('user', JSON.stringify(user));
            set({ user });
        } catch {
            // Si falla obtener el perfil, limpiar la autenticación
            localStorage.removeItem('user');
            localStorage.removeItem('token');
            set({ user: null, token: null, isAuthenticated: false });
        }
    },
}));
