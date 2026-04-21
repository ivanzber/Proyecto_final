import React, { useEffect, useRef, useState, useCallback } from 'react';
import { unity3dService } from '@/services/unity3dService';
import api from '@/services/api';
import './Unity3DPlaceholder.css';

interface POIEvent {
    type: string;
    poiId: number;
    poiName: string;
}

interface AreaInfo {
    id: number;
    name: string;
    code: string;
}

interface Evento {
    id: number;
    title: string;
    description: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    location: string;
    category: string;
}

interface Noticia {
    id: number;
    title: string;
    content: string;
    createdAt?: string;
}

const categoryConfig: Record<string, { color: string; icon: string }> = {
    DEPORTIVO: { color: '#66bb6a', icon: '⚽' },
    ACADEMICO: { color: '#42a5f5', icon: '📚' },
    CULTURAL:  { color: '#ab47bc', icon: '🎭' },
    SOCIAL:    { color: '#ffa726', icon: '🤝' },
    OTRO:      { color: '#78909c', icon: '📌' },
};

const Unity3DPlaceholder: React.FC = () => {
    const canvasRef    = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const sessionId    = useRef(`session_${Date.now()}_${Math.random().toString(36).slice(2)}`);

    const [loading,      setLoading]      = useState(true);
    const [progress,     setProgress]     = useState(0);
    const [error,        setError]        = useState<string | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [cursorFree,   setCursorFree]   = useState(false);

    const [currentPOI,      setCurrentPOI]      = useState<POIEvent | null>(null);
    const [areaInfo,        setAreaInfo]         = useState<AreaInfo | null>(null);
    const [eventos,         setEventos]          = useState<Evento[]>([]);
    const [noticias,        setNoticias]         = useState<Noticia[]>([]);
    const [tab,             setTab]              = useState<'eventos' | 'noticias'>('eventos');
    const [expandedEventId, setExpandedEventId]  = useState<number | null>(null);
    const [expandedNewsId,  setExpandedNewsId]   = useState<number | null>(null);

    // ── Fullscreen ────────────────────────────────────────────────
    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
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

    // ── Tecla Q libera cursor ─────────────────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'q' || e.key === 'Q') {
                document.exitPointerLock();
                setCursorFree(true);
            }
            if (e.key === 'Escape') setCursorFree(false);
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, []);

    const handleCanvasClick = () => { if (cursorFree) setCursorFree(false); };

    // ── Helpers ───────────────────────────────────────────────────
    const formatFecha = (dateStr: string): string => {
        if (!dateStr) return 'Fecha por definir';
        return new Date(dateStr + 'T00:00:00').toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
    };

    const formatHora = (time: string): string => {
        if (!time) return '';
        const [h, m] = time.split(':');
        const hour   = parseInt(h);
        const ampm   = hour >= 12 ? 'PM' : 'AM';
        const h12    = hour % 12 || 12;
        return `${h12}:${m} ${ampm}`;
    };

    // ── Tracking de visita al POI ─────────────────────────────────
    const trackPOIVisit = useCallback(async (poiId: number, poiName: string) => {
        try {
            await api.post('/statistics/track', {
                eventType:  'poi_visit',
                entityType: 'point_of_interest',
                entityId:   poiId,
                sessionId:  sessionId.current,
                metadata:   { poiName },
            });
        } catch { /* no crítico */ }
    }, []);

    // ── Tracking de visualización de contenido ────────────────────
    const trackView = useCallback(async (entityType: 'event' | 'news', entityId: number) => {
        try {
            await api.post('/statistics/view', {
                entityType,
                entityId,
                sessionId: sessionId.current,
            });
        } catch { /* no crítico */ }
    }, []);

    // ── Ver más / Ver menos ───────────────────────────────────────
    const handleVerMasEvento = (id: number) => {
        const isOpening = expandedEventId !== id;
        setExpandedEventId(isOpening ? id : null);
        if (isOpening) trackView('event', id);
    };

    const handleVerMasNoticia = (id: number) => {
        const isOpening = expandedNewsId !== id;
        setExpandedNewsId(isOpening ? id : null);
        if (isOpening) trackView('news', id);
    };

    // ── Eventos desde Unity ───────────────────────────────────────
    const handleUnityEvent = useCallback(async (event: CustomEvent) => {
        const data: POIEvent = event.detail;

        if (data.type === 'poi_reached') {
            setCurrentPOI(data);
            setAreaInfo(null);
            setEventos([]);
            setNoticias([]);
            setTab('eventos');
            setExpandedEventId(null);
            setExpandedNewsId(null);

            try {
                const points = await unity3dService.getPoints();

                // Buscar por ID exacto, luego por nombre como fallback
                let poi = points.find(p => p.id === data.poiId);
                if (!poi) {
                    poi = points.find(p =>
                        p.title.toLowerCase().trim() ===
                        data.poiName.toLowerCase().trim()
                    );
                    if (poi) console.log(`🔄 POI por nombre: ${poi.title} (id: ${poi.id})`);
                }

                if (!poi) {
                    console.warn('⚠️ POI no encontrado en BD:', data);
                    return;
                }

                const realPoiId = poi.id;
                trackPOIVisit(realPoiId, poi.title);

                // Cargar eventos activos (el backend filtra los expirados)
                const eventosRes = await api.get(`/events?pointOfInterestId=${realPoiId}`);
                setEventos(eventosRes.data || []);

                // Cargar área y noticias
                if (poi.areaCode) {
                    const areasRes = await api.get('/areas');
                    const area: AreaInfo = areasRes.data.find(
                        (a: AreaInfo) => a.code === poi!.areaCode
                    );
                    if (area) {
                        setAreaInfo(area);
                        const noticiasRes = await api.get(
                            `/news?areaId=${area.id}&published=true`
                        );
                        setNoticias(noticiasRes.data || []);
                    }
                }

            } catch (err) {
                console.error('Error cargando datos del POI:', err);
            }
        }

        if (data.type === 'poi_left') {
            setCurrentPOI(null);
            setAreaInfo(null);
            setEventos([]);
            setNoticias([]);
            setExpandedEventId(null);
            setExpandedNewsId(null);
        }
    }, [trackPOIVisit]);

    // ── Cargar Unity ──────────────────────────────────────────────
    useEffect(() => {
        window.addEventListener('unityToReact', handleUnityEvent as any);

        const script   = document.createElement('script');
        script.src     = '/unity-build/Build/webgl-build.loader.js';
        script.onerror = () =>
            setError('No se encontró el build de Unity. Verifica los archivos en /public/unity-build/Build/');

        script.onload = () => {
            if (!canvasRef.current) return;
            window.createUnityInstance(canvasRef.current, {
                dataUrl:      '/unity-build/Build/webgl-build.data',
                frameworkUrl: '/unity-build/Build/webgl-build.framework.js',
                codeUrl:      '/unity-build/Build/webgl-build.wasm',
            }, (p: number) => setProgress(Math.round(p * 100)))
            .then((instance: any) => {
                window.unityInstance = instance;
                setLoading(false);
                console.log('🎮 Unity WebGL cargado');
                unity3dService.getWorldData()
                    .then(w => instance.SendMessage('WebGLBridge', 'ReceiveNewsData', JSON.stringify(w)))
                    .catch(() => {});
            })
            .catch((err: any) => setError('Error inicializando Unity: ' + err.message));
        };

        document.body.appendChild(script);
        return () => {
            window.removeEventListener('unityToReact', handleUnityEvent as any);
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, [handleUnityEvent]);

    // ── Render ────────────────────────────────────────────────────
    return (
        <div
            ref={containerRef}
            className={`unity-viewer-wrapper${isFullscreen ? ' unity-fullscreen' : ''}`}
        >
            {/* Canvas */}
            <canvas
                ref={canvasRef}
                id="unity-canvas"
                className="unity-canvas"
                onClick={handleCanvasClick}
            />

            {/* Topbar */}
            <div className="unity-topbar">
                <span className="unity-topbar-title">🎮 Campus Virtual UDEC</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cursorFree && (
                        <span className="unity-cursor-badge">
                            🖱️ Cursor libre — clic en el canvas para volver
                        </span>
                    )}
                    <button
                        className="unity-fullscreen-btn"
                        onClick={toggleFullscreen}
                        title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                    >
                        <span>{isFullscreen ? 'Salir' : 'Pantalla completa'}</span>
                    </button>
                </div>
            </div>

            {/* Carga */}
            {loading && !error && (
                <div className="unity-overlay unity-loading">
                    <div className="unity-spinner" />
                    <h2>Cargando Campus Virtual…</h2>
                    <div className="unity-progress-track">
                        <div className="unity-progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="unity-progress-label">{progress}%</p>
                    <p className="unity-hint">
                        Click para activar · WASD moverse · Shift correr · Q liberar cursor · ESC salir
                    </p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="unity-overlay unity-error">
                    <div style={{ fontSize: 48 }}>🎮</div>
                    <h2>Build de Unity no encontrado</h2>
                    <p>Copia los archivos del build a:<br />
                        <code>frontend/public/unity-build/</code>
                    </p>
                    <p className="unity-error-detail">{error}</p>
                </div>
            )}

            {/* Panel POI */}
            {currentPOI && (
                <div className="unity-poi-panel">

                    {/* Header */}
                    <div className="unity-poi-header">
                        <div className="unity-poi-pin">📍</div>
                        <div className="unity-poi-header-text">
                            <strong className="unity-poi-name">{currentPOI.poiName}</strong>
                            {areaInfo && (
                                <span className="unity-poi-area">📍 {areaInfo.name}</span>
                            )}
                        </div>
                    </div>

                    {/* Hint Q */}
                    {!cursorFree && (
                        <div className="unity-poi-hint">
                            Presiona <kbd>Q</kbd> para liberar el cursor e interactuar
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="unity-poi-tabs">
                        <button
                            className={`unity-poi-tab${tab === 'eventos' ? ' active' : ''}`}
                            onClick={() => setTab('eventos')}
                        >
                            📅 Eventos
                            <span className="unity-tab-badge">{eventos.length}</span>
                        </button>
                        <button
                            className={`unity-poi-tab${tab === 'noticias' ? ' active' : ''}`}
                            onClick={() => setTab('noticias')}
                        >
                            📰 Noticias
                            <span className="unity-tab-badge">{noticias.length}</span>
                        </button>
                    </div>

                    {/* ── Tab Eventos ─────────────────────────────── */}
                    {tab === 'eventos' && (
                        <div className="unity-poi-content">
                            {eventos.length === 0 ? (
                                <div className="unity-empty-state">
                                    <span>📭</span>
                                    <p>Sin eventos activos en esta área</p>
                                </div>
                            ) : (
                                eventos.map(e => {
                                    const cfg      = categoryConfig[e.category] || categoryConfig.OTRO;
                                    const expanded = expandedEventId === e.id;
                                    const fecha    = formatFecha(e.eventDate);
                                    const hIni     = formatHora(e.startTime);
                                    const hFin     = formatHora(e.endTime);

                                    return (
                                        <div key={e.id} className={`unity-event-card${expanded ? ' unity-event-card--expanded' : ''}`}>
                                            {/* Badge */}
                                            <div className="unity-event-card-top">
                                                <span
                                                    className="unity-event-badge"
                                                    style={{ background: cfg.color }}
                                                >
                                                    {cfg.icon} {e.category}
                                                </span>
                                            </div>

                                            {/* Título */}
                                            <div className="unity-event-title">{e.title}</div>

                                            {/* Descripción colapsable */}
                                            {e.description && (
                                                <div className="unity-event-desc">
                                                    {expanded
                                                        ? e.description
                                                        : e.description.slice(0, 60) +
                                                          (e.description.length > 60 ? '...' : '')}
                                                </div>
                                            )}

                                            {/* Metadatos — solo expandido */}
                                            {expanded && (
                                                <div className="unity-event-meta">
                                                    <div className="unity-event-meta-row">
                                                        <span className="unity-meta-icon">📅</span>
                                                        <span style={{ textTransform: 'capitalize' }}>{fecha}</span>
                                                    </div>
                                                    {hIni && (
                                                        <div className="unity-event-meta-row">
                                                            <span className="unity-meta-icon">🕐</span>
                                                            <span>{hIni}{hFin && ` — ${hFin}`}</span>
                                                        </div>
                                                    )}
                                                    {e.location && (
                                                        <div className="unity-event-meta-row">
                                                            <span className="unity-meta-icon">📌</span>
                                                            <span>{e.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Botón Ver más */}
                                            <button
                                                className="unity-ver-mas-btn"
                                                onClick={() => handleVerMasEvento(e.id)}
                                            >
                                                {expanded ? '▲ Ver menos' : '▼ Ver más'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ── Tab Noticias ─────────────────────────────── */}
                    {tab === 'noticias' && (
                        <div className="unity-poi-content">
                            {noticias.length === 0 ? (
                                <div className="unity-empty-state">
                                    <span>📭</span>
                                    <p>Sin noticias publicadas en esta área</p>
                                </div>
                            ) : (
                                noticias.map(n => {
                                    const expanded = expandedNewsId === n.id;
                                    return (
                                        <div key={n.id} className={`unity-news-card${expanded ? ' unity-news-card--expanded' : ''}`}>
                                            <div className="unity-news-title">{n.title}</div>
                                            <div className="unity-news-content">
                                                {expanded
                                                    ? n.content
                                                    : (n.content?.slice(0, 80) +
                                                       ((n.content?.length ?? 0) > 80 ? '...' : ''))}
                                            </div>
                                            {expanded && n.createdAt && (
                                                <div className="unity-news-date">
                                                    🗓️ {new Date(n.createdAt).toLocaleDateString('es-CO', {
                                                        year: 'numeric', month: 'long', day: 'numeric'
                                                    })}
                                                </div>
                                            )}
                                            <button
                                                className="unity-ver-mas-btn unity-ver-mas-btn--noticia"
                                                onClick={() => handleVerMasNoticia(n.id)}
                                            >
                                                {expanded ? '▲ Ver menos' : '▼ Ver más'}
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                </div>
            )}

            {/* HUD */}
            {!loading && !error && (
                <div className="unity-hud">
                    🖱️ Click activar · WASD mover · Shift correr ·{' '}
                    <kbd className="unity-kbd">Q</kbd> liberar cursor · ESC salir
                </div>
            )}
        </div>
    );
};

export default Unity3DPlaceholder;