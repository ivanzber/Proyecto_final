import React, { useEffect, useRef, useState, useCallback } from 'react';
import { unity3dService } from '@/services/unity3dService';
import './Unity3DPlaceholder.css';

// Window types are declared in unity3dService.ts

interface POIEvent {
    type: string;
    poiId: number;
    poiName: string;
}

const Unity3DPlaceholder: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [currentPOI, setCurrentPOI] = useState<POIEvent | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Detectar cambios de pantalla completa del navegador
    useEffect(() => {
        const onFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // Escuchar eventos desde Unity
    const handleUnityEvent = useCallback(async (event: CustomEvent) => {
        const data: POIEvent = event.detail;

        if (data.type === 'poi_reached') {
            setCurrentPOI(data);
            try {
                const points = await unity3dService.getPoints();
                const poi = points.find(p => p.id === data.poiId);
                if (poi) {
                    console.log('📍 POI activo:', poi);
                }
            } catch (err) {
                console.error('Error cargando datos del POI:', err);
            }
        }

        if (data.type === 'poi_left') {
            setCurrentPOI(null);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('unityToReact', handleUnityEvent as any);

        const script = document.createElement('script');
        script.src = '/unity-build/Build/webgl-build.loader.js';
        script.onerror = () => setError('No se encontró el build de Unity. Verifica que los archivos estén en /public/unity-build/Build/');

        script.onload = () => {
            if (!canvasRef.current) return;

            window.createUnityInstance(canvasRef.current, {
                dataUrl: '/unity-build/Build/webgl-build.data',
                frameworkUrl: '/unity-build/Build/webgl-build.framework.js',
                codeUrl: '/unity-build/Build/webgl-build.wasm',
            }, (p: number) => {
                setProgress(Math.round(p * 100));
            })
                .then((instance: any) => {
                    window.unityInstance = instance;
                    setLoading(false);
                    console.log('🎮 Unity WebGL cargado correctamente');

                    unity3dService.getWorldData().then(data => {
                        instance.SendMessage('WebGLBridge', 'ReceiveNewsData', JSON.stringify(data));
                    }).catch(() => { });
                })
                .catch((err: any) => {
                    setError('Error inicializando Unity: ' + err.message);
                });
        };

        document.body.appendChild(script);

        return () => {
            window.removeEventListener('unityToReact', handleUnityEvent as any);
            document.body.removeChild(script);
        };
    }, [handleUnityEvent]);

    return (
        /* Wrapper compacto: 560 px de alto por defecto, 100 % en fullscreen */
        <div
            ref={containerRef}
            className={`unity-viewer-wrapper${isFullscreen ? ' unity-fullscreen' : ''}`}
        >
            {/* ── Canvas ── */}
            <canvas
                ref={canvasRef}
                id="unity-canvas"
                className="unity-canvas"
            />

            {/* ── Barra superior con controles ── */}
            <div className="unity-topbar">
                <span className="unity-topbar-title">🎮 Campus Virtual UDEC</span>
                <button
                    className="unity-fullscreen-btn"
                    onClick={toggleFullscreen}
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                    {isFullscreen ? '⛶' : '⛶'}
                    <span>{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
                </button>
            </div>

            {/* ── Pantalla de carga ── */}
            {loading && !error && (
                <div className="unity-overlay unity-loading">
                    <div className="unity-spinner" />
                    <h2>Cargando Campus Virtual…</h2>
                    <div className="unity-progress-track">
                        <div
                            className="unity-progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="unity-progress-label">{progress}%</p>
                    <p className="unity-hint">
                        Click para activar · WASD moverse · Shift correr · ESC liberar
                    </p>
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div className="unity-overlay unity-error">
                    <div style={{ fontSize: 48 }}>🎮</div>
                    <h2>Build de Unity no encontrado</h2>
                    <p>
                        Genera el build WebGL en Unity y copia los archivos a:<br />
                        <code>frontend/public/unity-build/</code>
                    </p>
                    <p className="unity-error-detail">{error}</p>
                </div>
            )}

            {/* ── Panel POI ── */}
            {currentPOI && (
                <div className="unity-poi-panel">
                    <span>📍</span>
                    <strong>{currentPOI.poiName}</strong>
                    <p>Estás explorando esta área del campus</p>
                </div>
            )}

            {/* ── HUD controles (solo cuando cargado) ── */}
            {!loading && !error && (
                <div className="unity-hud">
                    🖱️ Click&nbsp;·&nbsp;WASD mover&nbsp;·&nbsp;Shift correr&nbsp;·&nbsp;ESC liberar
                </div>
            )}
        </div>
    );
};

export default Unity3DPlaceholder;