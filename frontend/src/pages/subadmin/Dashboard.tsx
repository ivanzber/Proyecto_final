import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import { usersService } from '@/services/usersService';
import { eventsService, Event, CreateEventDto } from '@/services/eventsService';
import { newsService, News, CreateNewsDto } from '@/services/newsService';
import { pointsService, PointOfInterest } from '@/services/pointsService';
import logoUdec from '@/assets/images/logo_2.png';
import '../admin/Dashboard.css';

// ── Tipos locales ─────────────────────────────────────────────────────────────
interface Area { id: number; name: string; code: string; description?: string; }

// ══════════════════════════════════════════════════════════════════════════════
// HOOK: áreas asignadas al subadmin actual
// ══════════════════════════════════════════════════════════════════════════════
const useMyAreas = (userId?: number) => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const data = await usersService.getAssignedAreas(userId);
            const normalized = data.map((item: any) => item.area || item);
            setAreas(normalized);
        } catch {
            setAreas([]);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => { load(); }, [load]);
    return { areas, loading, reload: load };
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS para el modal de historial
// ══════════════════════════════════════════════════════════════════════════════
const CATEGORY_COLORS: Record<string, string> = {
    ACADEMICO:     '#1a7f37',
    CULTURAL:      '#6639ba',
    DEPORTIVO:     '#0969da',
    INSTITUCIONAL: '#bc4c00',
    OTRO:          '#57606a',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7)   return `hace ${days} días`;
    if (days < 30)  return `hace ${Math.floor(days / 7)} sem.`;
    if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
    return `hace ${Math.floor(days / 365)} años`;
}

// ══════════════════════════════════════════════════════════════════════════════
// MODAL HISTORIAL — filtrado por áreas del subadmin
// ══════════════════════════════════════════════════════════════════════════════
const HistorialModal: React.FC<{
    areaIds: number[];
    areaName: string;
    onClose: () => void;
}> = ({ areaIds, areaName, onClose }) => {
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [loading, setLoading]       = useState(true);
    const [search, setSearch]         = useState('');
    const [catFilter, setCatFilter]   = useState('');
    const [dateFrom, setDateFrom]     = useState('');
    const [dateTo, setDateTo]         = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                // getPast() llama a /events/admin/all y filtra < hoy, ordenado DESC
                const past = await eventsService.getPast();
                // Filtrar solo los que pertenecen a las áreas del subadmin
                const mine = past.filter(e =>
                    areaIds.includes((e as any).areaId) ||
                    areaIds.includes((e as any).pointOfInterest?.areaId)
                );
                setPastEvents(mine);
            } catch {
                alert('Error al cargar el historial');
            } finally {
                setLoading(false);
            }
        })();
    }, [areaIds]);

    const filtered = pastEvents.filter(e => {
        const matchSearch =
            e.title.toLowerCase().includes(search.toLowerCase()) ||
            (e.location  || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.category  || '').toLowerCase().includes(search.toLowerCase());
        const matchCat  = !catFilter || e.category === catFilter;
        const evDate    = new Date(e.eventDate);
        const matchFrom = !dateFrom || evDate >= new Date(dateFrom);
        const matchTo   = !dateTo   || evDate <= new Date(dateTo);
        return matchSearch && matchCat && matchFrom && matchTo;
    });

    // Agrupar por mes-año
    const grouped = filtered.reduce<Record<string, Event[]>>((acc, ev) => {
        const key = new Date(ev.eventDate).toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long',
        });
        (acc[key] = acc[key] || []).push(ev);
        return acc;
    }, {});

    const hasFilters = !!(search || catFilter || dateFrom || dateTo);
    const clearFilters = () => { setSearch(''); setCatFilter(''); setDateFrom(''); setDateTo(''); };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={e => e.stopPropagation()}
                style={{
                    maxWidth: 780, width: '95%', maxHeight: '88vh',
                    display: 'flex', flexDirection: 'column',
                }}
            >
                {/* Header */}
                <div className="modal-header" style={{ flexShrink: 0 }}>
                    <div>
                        <h2 style={{ margin: 0 }}>🕐 Historial de Eventos</h2>
                        <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#888' }}>
                            {pastEvents.length} eventos pasados · área: <strong>{areaName}</strong>
                        </p>
                    </div>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                {/* Filtros */}
                <div style={{
                    padding: '12px 24px', borderBottom: '1px solid #e0e0e0',
                    flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: 8,
                }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar evento..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            flex: '1 1 180px', padding: '7px 12px',
                            border: '1px solid #ddd', borderRadius: 6,
                            fontSize: '0.85rem', outline: 'none',
                        }}
                    />
                    <select
                        value={catFilter}
                        onChange={e => setCatFilter(e.target.value)}
                        style={{
                            flex: '0 1 155px', padding: '7px 10px',
                            border: '1px solid #ddd', borderRadius: 6,
                            fontSize: '0.85rem', background: '#fff',
                        }}
                    >
                        <option value="">Todas las categorías</option>
                        <option value="ACADEMICO">Académico</option>
                        <option value="CULTURAL">Cultural</option>
                        <option value="DEPORTIVO">Deportivo</option>
                        <option value="INSTITUCIONAL">Institucional</option>
                        <option value="OTRO">Otro</option>
                    </select>
                    <input
                        type="date" value={dateFrom} title="Desde"
                        onChange={e => setDateFrom(e.target.value)}
                        style={{
                            flex: '0 1 140px', padding: '7px 10px',
                            border: '1px solid #ddd', borderRadius: 6, fontSize: '0.85rem',
                        }}
                    />
                    <input
                        type="date" value={dateTo} title="Hasta"
                        onChange={e => setDateTo(e.target.value)}
                        style={{
                            flex: '0 1 140px', padding: '7px 10px',
                            border: '1px solid #ddd', borderRadius: 6, fontSize: '0.85rem',
                        }}
                    />
                    {hasFilters && (
                        <button
                            onClick={clearFilters}
                            style={{
                                padding: '7px 12px', background: 'transparent',
                                border: '1px solid #ddd', borderRadius: 6,
                                color: '#888', cursor: 'pointer', fontSize: '0.8rem',
                            }}
                        >
                            ✕ Limpiar
                        </button>
                    )}
                </div>

                {/* Cuerpo scrolleable */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#aaa' }}>
                            Cargando historial...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div style={{ fontSize: '2.5rem' }}>🗓️</div>
                            <p style={{ color: '#aaa', marginTop: 8 }}>
                                {hasFilters
                                    ? 'Sin resultados para los filtros aplicados'
                                    : 'No hay eventos pasados en esta área aún'}
                            </p>
                            {hasFilters && (
                                <button
                                    onClick={clearFilters}
                                    style={{
                                        marginTop: 8, background: 'none', border: 'none',
                                        color: '#2e7d32', cursor: 'pointer', fontSize: '0.85rem',
                                    }}
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        Object.entries(grouped).map(([month, evs]) => (
                            <div key={month} style={{ marginBottom: 24 }}>
                                {/* Separador de mes */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <span style={{
                                        fontSize: '0.72rem', fontWeight: 700, color: '#888',
                                        textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                                    }}>
                                        {month}
                                    </span>
                                    <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                                    <span style={{
                                        fontSize: '0.72rem', color: '#888',
                                        background: '#f5f5f5', border: '1px solid #e0e0e0',
                                        borderRadius: 10, padding: '1px 8px',
                                    }}>
                                        {evs.length}
                                    </span>
                                </div>

                                {/* Cards del mes */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    {evs.map(ev => {
                                        const isOpen = expandedId === ev.id;
                                        const color  = CATEGORY_COLORS[ev.category || ''] || '#57606a';
                                        const evDate = new Date(ev.eventDate);

                                        return (
                                            <div
                                                key={ev.id}
                                                style={{
                                                    border: '1px solid #e0e0e0', borderRadius: 8,
                                                    background: isOpen ? '#f9fbe7' : '#fff',
                                                    overflow: 'hidden', transition: 'background 0.15s',
                                                }}
                                            >
                                                <button
                                                    onClick={() => setExpandedId(isOpen ? null : ev.id)}
                                                    style={{
                                                        width: '100%', textAlign: 'left',
                                                        background: 'none', border: 'none',
                                                        cursor: 'pointer', padding: '10px 14px',
                                                        display: 'flex', alignItems: 'center', gap: 14,
                                                    }}
                                                >
                                                    {/* Día */}
                                                    <div style={{
                                                        flexShrink: 0, width: 44, textAlign: 'center',
                                                        borderRight: `2px solid ${color}`, paddingRight: 12,
                                                    }}>
                                                        <div style={{ fontSize: '0.65rem', color: '#aaa', textTransform: 'uppercase' }}>
                                                            {evDate.toLocaleDateString('es-CO', { month: 'short' })}
                                                        </div>
                                                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#333', lineHeight: 1.1 }}>
                                                            {evDate.getDate()}
                                                        </div>
                                                    </div>

                                                    {/* Info */}
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                                            <span style={{
                                                                fontWeight: 600, color: '#333', fontSize: '0.9rem',
                                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                            }}>
                                                                {ev.title}
                                                            </span>
                                                            {ev.category && (
                                                                <span style={{
                                                                    fontSize: '0.7rem', padding: '1px 8px', borderRadius: 10,
                                                                    flexShrink: 0, background: color + '18', color,
                                                                    border: `1px solid ${color}33`, fontWeight: 600,
                                                                }}>
                                                                    {ev.category}
                                                                </span>
                                                            )}
                                                            {!ev.isPublished && (
                                                                <span style={{
                                                                    fontSize: '0.7rem', padding: '1px 8px', borderRadius: 10,
                                                                    flexShrink: 0, background: '#f5f5f5', color: '#aaa',
                                                                    border: '1px solid #e0e0e0',
                                                                }}>
                                                                    Borrador
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex', gap: 12, marginTop: 3,
                                                            fontSize: '0.75rem', color: '#aaa', flexWrap: 'wrap',
                                                        }}>
                                                            {ev.location && <span>📍 {ev.location}</span>}
                                                            {ev.area?.name && <span>🏢 {ev.area.name}</span>}
                                                            {ev.startTime && (
                                                                <span>⏰ {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>
                                                            )}
                                                            <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>
                                                                {timeAgo(ev.eventDate)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Chevron */}
                                                    <span style={{
                                                        color: '#aaa', flexShrink: 0, fontSize: '0.8rem',
                                                        display: 'inline-block',
                                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                        transition: 'transform 0.2s',
                                                    }}>
                                                        ▾
                                                    </span>
                                                </button>

                                                {/* Detalle expandido */}
                                                {isOpen && (
                                                    <div style={{
                                                        padding: '12px 16px 14px 72px',
                                                        borderTop: '1px solid #e0e0e0',
                                                        background: '#f9fbe7',
                                                    }}>
                                                        <div style={{
                                                            display: 'grid',
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                                                            gap: '10px 20px', fontSize: '0.82rem',
                                                        }}>
                                                            <div>
                                                                <p style={{ color: '#aaa', margin: '0 0 2px', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                                    Fecha completa
                                                                </p>
                                                                <p style={{ color: '#333', margin: 0 }}>
                                                                    {evDate.toLocaleDateString('es-CO', {
                                                                        weekday: 'long', year: 'numeric',
                                                                        month: 'long', day: 'numeric',
                                                                    })}
                                                                </p>
                                                            </div>
                                                            {ev.pointOfInterest && (
                                                                <div>
                                                                    <p style={{ color: '#aaa', margin: '0 0 2px', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                                        Punto de Interés
                                                                    </p>
                                                                    <p style={{ color: '#333', margin: 0 }}>
                                                                        {ev.pointOfInterest.title}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {ev.description && (
                                                                <div style={{ gridColumn: '1 / -1' }}>
                                                                    <p style={{ color: '#aaa', margin: '0 0 2px', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                                        Descripción
                                                                    </p>
                                                                    <p style={{ color: '#555', margin: 0, lineHeight: 1.5 }}>
                                                                        {ev.description}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '12px 24px', borderTop: '1px solid #e0e0e0',
                    flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                        {filtered.length !== pastEvents.length
                            ? `${filtered.length} de ${pastEvents.length} eventos`
                            : `${pastEvents.length} eventos en total`}
                    </span>
                    <button className="btn btn-secondary" onClick={onClose}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA: Inicio del subadmin
// ══════════════════════════════════════════════════════════════════════════════
const SubadminHome: React.FC<{ userId?: number }> = ({ userId }) => {
    const { areas, loading } = useMyAreas(userId);
    const [counts, setCounts] = useState({ events: 0, news: 0, points: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        if (!areas.length) return;
        const loadCounts = async () => {
            try {
                const [evs, nws, pts] = await Promise.all([
                    eventsService.getAll(),
                    newsService.getAll(),
                    pointsService.getAll(),
                ]);
                const areaIds = areas.map(a => a.id);
                setCounts({
                    events: evs.filter((e: any) =>
                        areaIds.includes(e.areaId) ||
                        areaIds.includes(e.pointOfInterest?.areaId)
                    ).length,
                    news: nws.filter((n: any) => areaIds.includes(n.areaId)).length,
                    points: pts.filter((p: any) => areaIds.includes(p.areaId)).length,
                });
            } catch { }
        };
        loadCounts();
    }, [areas]);

    if (loading) return (
        <div className="dashboard-content">
            <div className="loading-spinner">Cargando...</div>
        </div>
    );

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1>Panel de Subadministrador</h1>
                    <p style={{ color: '#888', margin: 0, fontSize: 14 }}>
                        Gestiona el contenido de tus áreas asignadas
                    </p>
                </div>
            </div>

            {areas.length === 0 ? (
                <div style={{
                    background: '#fff8e1', border: '1px solid #ffe082',
                    borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 24,
                }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
                    <h3 style={{ color: '#f57f17', margin: '0 0 8px' }}>Sin áreas asignadas</h3>
                    <p style={{ color: '#888', margin: 0 }}>
                        El administrador aún no te ha asignado ningún área.
                    </p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ color: '#2e7d32', marginBottom: 12 }}>
                            🏛️ Mis Áreas ({areas.length})
                        </h3>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {areas.map(a => (
                                <div key={a.id} style={{
                                    background: '#f1f8f1', border: '1px solid #a5d6a7',
                                    borderRadius: 8, padding: '10px 16px',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}>
                                    <span>📍</span>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</div>
                                        <div style={{ fontSize: 11, color: '#666' }}>{a.code}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="stats-grid">
                        {/* Eventos → /subadmin/areas (tab eventos) */}
                        <div
                            className="stat-card"
                            onClick={() => navigate('/subadmin/areas')}
                            title="Ir a Mis Áreas → Eventos"
                            style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(67,233,123,0.25)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                            }}
                        >
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#43e97b,#38f9d7)' }}>📅</div>
                            <div className="stat-info">
                                <h3>Eventos</h3>
                                <p className="stat-number">{counts.events}</p>
                                <span className="stat-label">en mis áreas →</span>
                            </div>
                        </div>

                        {/* Noticias → /subadmin/areas (tab noticias) */}
                        <div
                            className="stat-card"
                            onClick={() => navigate('/subadmin/areas')}
                            title="Ir a Mis Áreas → Noticias"
                            style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(250,112,154,0.25)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                            }}
                        >
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#fa709a,#fee140)' }}>📰</div>
                            <div className="stat-info">
                                <h3>Noticias</h3>
                                <p className="stat-number">{counts.news}</p>
                                <span className="stat-label">en mis áreas →</span>
                            </div>
                        </div>

                        {/* Puntos de Interés → /subadmin/points */}
                        <div
                            className="stat-card"
                            onClick={() => navigate('/subadmin/points')}
                            title="Ir a Mis Puntos de Interés"
                            style={{ cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s' }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 20px rgba(79,172,254,0.25)';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                                (e.currentTarget as HTMLDivElement).style.boxShadow = '';
                            }}
                        >
                            <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#4facfe,#00f2fe)' }}>📍</div>
                            <div className="stat-info">
                                <h3>Puntos de Interés</h3>
                                <p className="stat-number">{counts.points}</p>
                                <span className="stat-label">en mis áreas →</span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA: Mis Áreas — con gestión de Eventos, Noticias e Historial
// ══════════════════════════════════════════════════════════════════════════════
const MyAreasPage: React.FC<{ userId?: number }> = ({ userId }) => {
    const { areas, loading } = useMyAreas(userId);

    const [selectedArea, setSelectedArea]   = useState<Area | null>(null);
    const [tab, setTab]                     = useState<'eventos' | 'noticias'>('eventos');
    const [eventos, setEventos]             = useState<Event[]>([]);
    const [noticias, setNoticias]           = useState<News[]>([]);
    const [areaPoints, setAreaPoints]       = useState<PointOfInterest[]>([]);
    const [loadingData, setLoadingData]     = useState(false);
    const [showModal, setShowModal]         = useState(false);
    const [editingItem, setEditingItem]     = useState<any>(null);
    const [saving, setSaving]               = useState(false);
    const [showHistorial, setShowHistorial] = useState(false); // ← NUEVO

    // Formulario evento
    const [eventForm, setEventForm] = useState<CreateEventDto>({
        title: '', description: '', eventDate: '', startTime: '',
        endTime: '', location: '', category: 'DEPORTIVO', isPublished: true,
    });

    // Formulario noticia
    const [newsForm, setNewsForm] = useState<CreateNewsDto>({
        title: '', content: '', summary: '', category: '', isPublished: true,
    });

    // Seleccionar primera área al cargar
    useEffect(() => {
        if (areas.length > 0 && !selectedArea) setSelectedArea(areas[0]);
    }, [areas]);

    // Cargar POIs de las áreas asignadas
    useEffect(() => {
        if (!areas.length) return;
        const loadPoints = async () => {
            try {
                const all = await pointsService.getAll();
                const areaIds = areas.map(a => a.id);
                setAreaPoints(all.filter((p: any) => areaIds.includes(p.areaId)));
            } catch {
                setAreaPoints([]);
            }
        };
        loadPoints();
    }, [areas]);

    // Cargar contenido del área seleccionada
    useEffect(() => {
        if (selectedArea) loadAreaContent(selectedArea.id);
    }, [selectedArea, tab]);

    const loadAreaContent = async (areaId: number) => {
        try {
            setLoadingData(true);
            if (tab === 'eventos') {
                const all = await eventsService.getAll();
                setEventos(all.filter((e: any) =>
                    e.areaId === areaId ||
                    e.pointOfInterest?.areaId === areaId
                ));
            } else {
                const all = await newsService.getAll();
                setNoticias(all.filter((n: any) => n.areaId === areaId));
            }
        } catch { } finally { setLoadingData(false); }
    };

    const openCreateEvento = () => {
        setEditingItem(null);
        setEventForm({
            title: '', description: '', eventDate: '', startTime: '',
            endTime: '', location: '', category: 'DEPORTIVO', isPublished: true,
            areaId: selectedArea?.id, pointOfInterestId: undefined,
        });
        setShowModal(true);
    };

    const openEditEvento = (e: Event) => {
        setEditingItem(e);
        setEventForm({
            title: e.title, description: e.description || '',
            eventDate: e.eventDate, startTime: e.startTime || '',
            endTime: e.endTime || '', location: e.location || '',
            category: e.category || 'DEPORTIVO', isPublished: e.isPublished,
            areaId: selectedArea?.id,
            pointOfInterestId: (e as any).pointOfInterestId || undefined,
        });
        setShowModal(true);
    };

    const openCreateNoticia = () => {
        setEditingItem(null);
        setNewsForm({
            title: '', content: '', summary: '',
            category: '', isPublished: true, areaId: selectedArea?.id,
        });
        setShowModal(true);
    };

    const openEditNoticia = (n: News) => {
        setEditingItem(n);
        setNewsForm({
            title: n.title, content: n.content, summary: n.summary || '',
            category: n.category || '', isPublished: n.isPublished,
            areaId: selectedArea?.id,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (tab === 'eventos') {
                if (editingItem) {
                    await eventsService.update(editingItem.id, eventForm);
                } else {
                    await eventsService.create(eventForm);
                }
            } else {
                if (editingItem) {
                    await newsService.update(editingItem.id, newsForm);
                } else {
                    await newsService.create(newsForm);
                }
            }
            setShowModal(false);
            if (selectedArea) loadAreaContent(selectedArea.id);
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al guardar');
        } finally { setSaving(false); }
    };

    const handleDeleteEvento = async (id: number) => {
        if (!confirm('¿Eliminar este evento?')) return;
        await eventsService.delete(id);
        if (selectedArea) loadAreaContent(selectedArea.id);
    };

    const handleDeleteNoticia = async (id: number) => {
        if (!confirm('¿Eliminar esta noticia?')) return;
        await newsService.delete(id);
        if (selectedArea) loadAreaContent(selectedArea.id);
    };

    if (loading) return (
        <div className="dashboard-content">
            <div className="loading-spinner">Cargando...</div>
        </div>
    );

    if (areas.length === 0) return (
        <div className="dashboard-content">
            <h1>Mis Áreas</h1>
            <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
                <div style={{ fontSize: 40 }}>📭</div>
                <p>No tienes áreas asignadas aún.</p>
            </div>
        </div>
    );

    return (
        <div className="dashboard-content">
            <h1>Mis Áreas</h1>

            {/* Selector de área */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {areas.map(a => (
                    <button key={a.id} onClick={() => setSelectedArea(a)} style={{
                        padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${selectedArea?.id === a.id ? '#2e7d32' : '#e0e0e0'}`,
                        background: selectedArea?.id === a.id ? '#e8f5e9' : '#fff',
                        color: selectedArea?.id === a.id ? '#2e7d32' : '#555',
                        fontWeight: selectedArea?.id === a.id ? 700 : 400,
                        fontSize: 14,
                    }}>
                        📍 {a.name}
                    </button>
                ))}
            </div>

            {selectedArea && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>

                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
                        {(['eventos', 'noticias'] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)} style={{
                                flex: 1, padding: '14px 0', border: 'none', cursor: 'pointer',
                                background: tab === t ? '#fff' : '#f9f9f9',
                                color: tab === t ? '#2e7d32' : '#888',
                                fontWeight: tab === t ? 700 : 400, fontSize: 14,
                                borderBottom: tab === t ? '3px solid #2e7d32' : '3px solid transparent',
                            }}>
                                {t === 'eventos' ? '📅 Eventos' : '📰 Noticias'}
                            </button>
                        ))}
                    </div>

                    <div style={{ padding: 20 }}>
                        {/* Header con botones */}
                        <div style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', marginBottom: 16,
                        }}>
                            <span style={{ color: '#888', fontSize: 13 }}>
                                {tab === 'eventos'
                                    ? `${eventos.length} evento(s) próximos en ${selectedArea.name}`
                                    : `${noticias.length} noticia(s) en ${selectedArea.name}`}
                            </span>

                            <div style={{ display: 'flex', gap: 8 }}>
                                {/* ← BOTÓN HISTORIAL — solo visible en tab eventos */}
                                {tab === 'eventos' && (
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowHistorial(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                    >
                                        🕐 Historial
                                    </button>
                                )}
                                <button
                                    className="btn btn-primary"
                                    onClick={tab === 'eventos' ? openCreateEvento : openCreateNoticia}
                                >
                                    + {tab === 'eventos' ? 'Nuevo Evento' : 'Nueva Noticia'}
                                </button>
                            </div>
                        </div>

                        {loadingData ? (
                            <div className="loading-spinner">Cargando...</div>
                        ) : tab === 'eventos' ? (
                            eventos.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
                                    <div style={{ fontSize: 36 }}>📭</div>
                                    <p>Sin eventos próximos en esta área</p>
                                    <p style={{ fontSize: 13 }}>
                                        Usa el botón <strong>🕐 Historial</strong> para ver eventos pasados
                                    </p>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Fecha</th>
                                            <th>Punto de Interés</th>
                                            <th>Horario</th>
                                            <th>Lugar</th>
                                            <th>Categoría</th>
                                            <th>Estado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {eventos.map(e => (
                                            <tr key={e.id}>
                                                <td style={{ fontWeight: 500 }}>{e.title}</td>
                                                <td>
                                                    {e.eventDate
                                                        ? new Date(e.eventDate + 'T00:00:00').toLocaleDateString('es-CO')
                                                        : '—'}
                                                </td>
                                                <td style={{ color: '#555', fontSize: 13 }}>
                                                    {(e as any).pointOfInterest?.title
                                                        ? `📍 ${(e as any).pointOfInterest.title}`
                                                        : '—'}
                                                </td>
                                                <td style={{ fontSize: 12, color: '#666' }}>
                                                    {e.startTime && e.endTime
                                                        ? `${e.startTime} — ${e.endTime}`
                                                        : e.startTime || '—'}
                                                </td>
                                                <td style={{ color: '#666' }}>{e.location || '—'}</td>
                                                <td>
                                                    <span style={{
                                                        background: '#e8f5e9', color: '#2e7d32',
                                                        padding: '2px 8px', borderRadius: 10,
                                                        fontSize: 11, fontWeight: 600,
                                                    }}>{e.category || '—'}</span>
                                                </td>
                                                <td>
                                                    <span style={{
                                                        background: e.isPublished ? '#e8f5e9' : '#f5f5f5',
                                                        color: e.isPublished ? '#2e7d32' : '#999',
                                                        padding: '2px 8px', borderRadius: 10, fontSize: 11,
                                                        border: `1px solid ${e.isPublished ? '#a5d6a7' : '#ddd'}`,
                                                    }}>
                                                        {e.isPublished ? '✅ Publicado' : '⏸ Borrador'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn btn-sm btn-secondary"
                                                            onClick={() => openEditEvento(e)}>✏️</button>
                                                        <button className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteEvento(e.id)}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        ) : (
                            noticias.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
                                    <div style={{ fontSize: 36 }}>📭</div>
                                    <p>Sin noticias en esta área</p>
                                </div>
                            ) : (
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Título</th>
                                            <th>Resumen</th>
                                            <th>Categoría</th>
                                            <th>Estado</th>
                                            <th>Creado</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {noticias.map(n => (
                                            <tr key={n.id}>
                                                <td style={{ fontWeight: 500 }}>{n.title}</td>
                                                <td style={{ color: '#666', fontSize: 13 }}>
                                                    {n.summary || n.content?.slice(0, 60)}...
                                                </td>
                                                <td style={{ color: '#666' }}>{n.category || '—'}</td>
                                                <td>
                                                    <span style={{
                                                        background: n.isPublished ? '#e8f5e9' : '#f5f5f5',
                                                        color: n.isPublished ? '#2e7d32' : '#999',
                                                        padding: '2px 8px', borderRadius: 10, fontSize: 11,
                                                        border: `1px solid ${n.isPublished ? '#a5d6a7' : '#ddd'}`,
                                                    }}>
                                                        {n.isPublished ? '✅ Publicado' : '⏸ Borrador'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#888', fontSize: 12 }}>
                                                    {new Date(n.createdAt).toLocaleDateString('es-CO')}
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button className="btn btn-sm btn-secondary"
                                                            onClick={() => openEditNoticia(n)}>✏️</button>
                                                        <button className="btn btn-sm btn-danger"
                                                            onClick={() => handleDeleteNoticia(n.id)}>🗑️</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Modal Evento */}
            {showModal && tab === 'eventos' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Título *</label>
                                <input className="form-control" value={eventForm.title}
                                    onChange={e => setEventForm({ ...eventForm, title: e.target.value })}
                                    placeholder="Título del evento" />
                            </div>
                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea className="form-control" rows={3}
                                    value={eventForm.description}
                                    onChange={e => setEventForm({ ...eventForm, description: e.target.value })}
                                    placeholder="Descripción del evento..." />
                            </div>
                            <div className="form-group">
                                <label>Punto de Interés</label>
                                <select
                                    className="form-control"
                                    value={eventForm.pointOfInterestId || ''}
                                    onChange={e => setEventForm({
                                        ...eventForm,
                                        pointOfInterestId: e.target.value ? Number(e.target.value) : undefined,
                                    })}
                                >
                                    <option value="">Sin punto de interés</option>
                                    {areaPoints.map(pt => (
                                        <option key={pt.id} value={pt.id}>📍 {pt.title}</option>
                                    ))}
                                </select>
                                {areaPoints.length === 0 && (
                                    <small style={{ color: '#aaa', fontSize: 12 }}>
                                        No hay puntos de interés en tus áreas asignadas
                                    </small>
                                )}
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="form-group">
                                    <label>Fecha *</label>
                                    <input type="date" className="form-control"
                                        value={eventForm.eventDate}
                                        onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Categoría</label>
                                    <select className="form-control" value={eventForm.category}
                                        onChange={e => setEventForm({ ...eventForm, category: e.target.value })}>
                                        <option value="DEPORTIVO">⚽ Deportivo</option>
                                        <option value="ACADEMICO">📚 Académico</option>
                                        <option value="CULTURAL">🎭 Cultural</option>
                                        <option value="SOCIAL">🤝 Social</option>
                                        <option value="OTRO">📌 Otro</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Hora inicio</label>
                                    <input type="time" className="form-control"
                                        value={eventForm.startTime}
                                        onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Hora fin</label>
                                    <input type="time" className="form-control"
                                        value={eventForm.endTime}
                                        onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Lugar</label>
                                <input className="form-control" value={eventForm.location}
                                    onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                                    placeholder="Ej: Canchas de fútbol" />
                            </div>
                            <div className="form-group">
                                <label>
                                    <input type="checkbox" checked={eventForm.isPublished}
                                        onChange={e => setEventForm({ ...eventForm, isPublished: e.target.checked })}
                                        style={{ marginRight: 8 }} />
                                    Publicar inmediatamente
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear Evento'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Noticia */}
            {showModal && tab === 'noticias' && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingItem ? 'Editar Noticia' : 'Nueva Noticia'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Título *</label>
                                <input className="form-control" value={newsForm.title}
                                    onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                                    placeholder="Título de la noticia" />
                            </div>
                            <div className="form-group">
                                <label>Resumen</label>
                                <input className="form-control" value={newsForm.summary}
                                    onChange={e => setNewsForm({ ...newsForm, summary: e.target.value })}
                                    placeholder="Resumen breve..." />
                            </div>
                            <div className="form-group">
                                <label>Contenido *</label>
                                <textarea className="form-control" rows={5}
                                    value={newsForm.content}
                                    onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                                    placeholder="Contenido completo de la noticia..." />
                            </div>
                            <div className="form-group">
                                <label>Categoría</label>
                                <input className="form-control" value={newsForm.category}
                                    onChange={e => setNewsForm({ ...newsForm, category: e.target.value })}
                                    placeholder="Ej: Deportes, Académico..." />
                            </div>
                            <div className="form-group">
                                <label>
                                    <input type="checkbox" checked={newsForm.isPublished}
                                        onChange={e => setNewsForm({ ...newsForm, isPublished: e.target.checked })}
                                        style={{ marginRight: 8 }} />
                                    Publicar inmediatamente
                                </label>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                                {saving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear Noticia'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ← MODAL HISTORIAL */}
            {showHistorial && selectedArea && (
                <HistorialModal
                    areaIds={areas.map(a => a.id)}
                    areaName={selectedArea.name}
                    onClose={() => setShowHistorial(false)}
                />
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA: Mis Puntos de Interés
// ══════════════════════════════════════════════════════════════════════════════
const MyPointsPage: React.FC<{ userId?: number }> = ({ userId }) => {
    const { areas, loading: loadingAreas } = useMyAreas(userId);
    const [points, setPoints] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!areas.length) return;
        const loadPoints = async () => {
            setLoading(true);
            try {
                const all = await pointsService.getAll();
                const areaIds = areas.map(a => a.id);
                setPoints(all.filter((p: PointOfInterest) => areaIds.includes(p.areaId)));
            } catch { } finally { setLoading(false); }
        };
        loadPoints();
    }, [areas]);

    if (loadingAreas || loading) return (
        <div className="dashboard-content">
            <div className="loading-spinner">Cargando...</div>
        </div>
    );

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <h1>Mis Puntos de Interés</h1>
                <span style={{ color: '#888', fontSize: 14 }}>
                    {points.length} punto(s) en tus áreas asignadas
                </span>
            </div>

            {points.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
                    <div style={{ fontSize: 40 }}>📭</div>
                    <p>No hay puntos de interés en tus áreas asignadas.</p>
                </div>
            ) : (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Área</th>
                                <th>Categoría</th>
                                <th>Visible</th>
                                <th>Orden</th>
                            </tr>
                        </thead>
                        <tbody>
                            {points.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                                    <td style={{ color: '#666' }}>{p.area?.name || '—'}</td>
                                    <td>
                                        <span style={{
                                            background: '#e3f2fd', color: '#1565c0',
                                            padding: '2px 8px', borderRadius: 10,
                                            fontSize: 11, fontWeight: 600,
                                        }}>{p.category || '—'}</span>
                                    </td>
                                    <td>
                                        <span style={{
                                            background: p.isVisible ? '#e8f5e9' : '#f5f5f5',
                                            color: p.isVisible ? '#2e7d32' : '#999',
                                            padding: '2px 8px', borderRadius: 10, fontSize: 11,
                                            border: `1px solid ${p.isVisible ? '#a5d6a7' : '#ddd'}`,
                                        }}>
                                            {p.isVisible ? '✅ Visible' : '⏸ Oculto'}
                                        </span>
                                    </td>
                                    <td style={{ color: '#888' }}>{p.orderIndex}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// ══════════════════════════════════════════════════════════════════════════════
// LAYOUT PRINCIPAL DEL SUBADMIN
// ══════════════════════════════════════════════════════════════════════════════
const SubadminDashboard: React.FC = () => {
    const { user, clearAuth } = useAuthStore();

    const handleLogout = () => {
        authService.logout();
        clearAuth();
    };

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={logoUdec} alt="Logo UDEC" className="logo" />
                    <h2>Campus Virtual</h2>
                    <p className="user-info">{user?.email}</p>
                    <span className="user-role">SUBADMIN</span>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/subadmin" end
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📊</span>
                        <span>Inicio</span>
                    </NavLink>
                    <NavLink to="/subadmin/areas"
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">🏛️</span>
                        <span>Mis Áreas</span>
                    </NavLink>
                    <NavLink to="/subadmin/points"
                        className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📍</span>
                        <span>Mis Puntos</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-secondary btn-block"
                        onClick={() => window.location.href = '/'}>
                        ← Volver al Tour
                    </button>
                    <button className="btn btn-outline btn-block" onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <Routes>
                    <Route index element={<SubadminHome userId={user?.id} />} />
                    <Route path="areas" element={<MyAreasPage userId={user?.id} />} />
                    <Route path="points" element={<MyPointsPage userId={user?.id} />} />
                    <Route path="*" element={<Navigate to="/subadmin" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default SubadminDashboard;
