import api from './api';

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
    async getPoints(): Promise<Point3D[]> {
        const { data } = await api.get('/3d/points');
        return data;
    },

    async getAreas(): Promise<Area3D[]> {
        const { data } = await api.get('/3d/areas');
        return data;
    },

    async getWorldData(): Promise<WorldData> {
        const { data } = await api.get('/3d/world');
        return data;
    },

    sendToUnity(message: any) {
        if (window.unityInstance) {
            window.unityInstance.SendMessage(
                'WebGLBridge',
                'ReceiveNewsData',
                JSON.stringify(message)
            );
        } else {
            console.warn('Unity WebGL no está cargado aún');
        }
    },

    onUnityEvent(callback: (event: any) => void) {
        window.onUnityMessage = callback;
    },
};

// ← Sin createUnityInstance aquí
declare global {
    interface Window {
        unityInstance?: any;
        onUnityMessage?: (event: any) => void;
    }
}