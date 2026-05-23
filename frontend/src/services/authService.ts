import CryptoJS from 'crypto-js';
import api from './api';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
}

export interface AuthResponse {
    accessToken: string;
}

const ENCRYPTION_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

/**
 * Cifra las credenciales con AES-256-CBC antes de enviarlas al backend.
 * Formato: Base64(IV + encrypted_data)
 */
function encryptCredentials(credentials: LoginCredentials): string {
    // Convertir la clave hex a WordArray
    const key = CryptoJS.enc.Hex.parse(ENCRYPTION_KEY);

    // Generar IV aleatorio de 16 bytes
    const iv = CryptoJS.lib.WordArray.random(16);

    // Cifrar las credenciales
    const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(credentials),
        key,
        {
            iv: iv,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        }
    );

    // Concatenar IV + datos cifrados y convertir a Base64
    const ivBytes = iv;
    const encryptedBytes = encrypted.ciphertext;
    const combined = CryptoJS.lib.WordArray.create()
        .concat(ivBytes)
        .concat(encryptedBytes);

    return CryptoJS.enc.Base64.stringify(combined);
}

export const authService = {
    /**
     * Login con credenciales cifradas.
     * Las credenciales se cifran con AES-256-CBC antes de enviarse.
     * El backend solo devuelve el accessToken (sin datos del usuario).
     */
    async login(credentials: LoginCredentials): Promise<AuthResponse> {
        const encryptedPayload = encryptCredentials(credentials);

        const { data } = await api.post('/auth/login', {
            payload: encryptedPayload,
        });

        if (data.accessToken) {
            localStorage.setItem('token', data.accessToken);
        }

        return data;
    },

    /**
     * Obtiene el perfil del usuario autenticado desde el backend.
     * Se llama después del login para obtener datos del usuario.
     */
    async getProfile(): Promise<User> {
        const { data } = await api.get('/auth/profile');
        return data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    isAuthenticated(): boolean {
        return !!localStorage.getItem('token');
    },

    hasRole(role: string): boolean {
        const user = this.getCurrentUser();
        return user?.role === role;
    },
};
