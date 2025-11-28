import api from './api';

/**
 * ============================================
 * SERVICIO PARA COMUNICACIÓN CON UNITY 3D WEBGL
 * ============================================
 * 
 * Este servicio maneja la comunicación entre React y
 * el modelo 3D de Unity WebGL.
 * 
 * IMPORTANTE: El módulo 3D aún no está integrado.
 * Este servicio está preparado para recibir el build
 * de Unity WebGL cuando esté disponible.
 */

export interface Point3D {
    id: number;
    title: string;
    description: string;
    category: string;
    coordinates: { x: number; y: number; z: number };
    areaCode: string;
    iconUrl?: string;
}

export interface Area3D {
    id: number;
    name: string;
    code: string;
    coordinates: { x: number; y: number; z: number };
    parentAreaId?: number;
}

export interface WorldData {
    points: Point3D[];
    areas: Area3D[];
    metadata: {
        totalPoints: number;
        totalAreas: number;
        lastUpdate: string;
    };
}

export const unity3dService = {
    /**
     * Obtiene todos los puntos para renderizar en Unity
     */
    async getPoints(): Promise<Point3D[]> {
        const { data } = await api.get('/3d/points');
        return data;
    },

    /**
     * Obtiene todas las áreas para el mapa 3D
     */
    async getAreas(): Promise<Area3D[]> {
        const { data } = await api.get('/3d/areas');
        return data;
    },

    /**
     * Obtiene datos completos del mundo 3D
     */
    async getWorldData(): Promise<WorldData> {
        const { data } = await api.get('/3d/world');
        return data;
    },

    /**
     * Envía un comando al modelo Unity
     * NOTA: Implementar cuando Unity esté integrado
     */
    sendToUnity(message: any) {
        if (window.unityInstance) {
            // @ts-ignore
            window.unityInstance.SendMessage('GameController', 'ReceiveMessage', JSON.stringify(message));
        } else {
            console.warn('Unity WebGL no está cargado aún');
        }
    },

    /**
     * Recibe eventos desde Unity
     * NOTA: Unity debe llamar a esta función via window
     */
    onUnityEvent(callback: (event: any) => void) {
        // @ts-ignore
        window.onUnityMessage = callback;
    },
};

// Extender tipo Window para Unity
declare global {
    interface Window {
        unityInstance?: any;
        onUnityMessage?: (event: any) => void;
    }
}
