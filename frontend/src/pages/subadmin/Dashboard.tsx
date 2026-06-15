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

interface Area { id: number; name: string; code: string; description?: string; }

// ── Hook: áreas asignadas ─────────────────────────────────────────────────────
const useMyAreas = (userId?: number) => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const load = useCallback(async () => {
        if (!userId) return;
        try {
            setLoading(true);
            const data = await usersService.getAssignedAreas(userId);
            setAreas(data.map((item: any) => item.area || item));
        } catch { setAreas([]); } finally { setLoading(false); }
    }, [userId]);
    useEffect(() => { load(); }, [load]);
    return { areas, loading, reload: load };
};

// ── Hook: Escape ──────────────────────────────────────────────────────────────
function useEscapeKey(handler: () => void) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handler(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [handler]);
}

// ── Modal de error con estilo (compatible todos los navegadores) ───────────────
const ErrorModal: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
    useEscapeKey(onClose);
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
            <button type="button" aria-label="Cerrar" onClick={onClose} style={{
                position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'default',
            }} />
            <div role="alertdialog" aria-modal="true" style={{
                position: 'relative', zIndex: 1, background: '#fff',
                borderRadius: '12px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                width: '100%', maxWidth: '460px', overflow: 'hidden',
            }}>
                <div style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    padding: '20px 24px', display: 'flex', alignItems: 'center', gap: '12px',
                }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
                        Conflicto de Evento
                    </h2>
                </div>
                <div style={{ padding: '24px' }}>
                    <p style={{ margin: '0 0 16px', color: '#374151', fontSize: '15px', lineHeight: '1.6', fontFamily: 'Arial, sans-serif' }}>
                        {message}
                    </p>
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '12px 16px', marginBottom: '20px' }}>
                        <p style={{ margin: 0, color: '#dc2626', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
                            💡 El evento <strong>no fue guardado</strong>. Cambia la fecha, horario o lugar para evitar el conflicto.
                        </p>
                    </div>
                    <button type="button" onClick={onClose} style={{
                        width: '100%', padding: '12px',
                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                        color: '#fff', border: 'none', borderRadius: '8px',
                        fontSize: '15px', fontWeight: 700, cursor: 'pointer', fontFamily: 'Arial, sans-serif',
                    }}>Entendido</button>
                </div>
            </div>
        </div>
    );
};

// ── Modal base accesible ──────────────────────────────────────────────────────
const Modal: React.FC<{
    id: string; title: string; onClose: () => void;
    children: React.ReactNode; footer: React.ReactNode; wide?: boolean;
}> = ({ id, title, onClose, children, footer, wide }) => {
    useEscapeKey(onClose);
    return (
        <div className="modal-overlay">
            <button type="button" aria-label="Cerrar modal" onClick={onClose} style={{
                position: 'fixed', inset: 0, background: 'transparent', border: 'none',
                cursor: 'default', width: '100%', height: '100%',
            }} />
            <div role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}
                className="modal-content" tabIndex={-1}
                style={{ position: 'relative', zIndex: 1, ...(wide ? { maxWidth: 780, width: '95%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' } : {}) }}>
                <div className="modal-header" style={{ flexShrink: 0 }}>
                    <h2 id={`${id}-title`} style={{ margin: 0 }}>{title}</h2>
                    <button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
                </div>
                <div className="modal-body">{children}</div>
                <div className="modal-footer" style={{ flexShrink: 0 }}>{footer}</div>
            </div>
        </div>
    );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, string> = {
    ACADEMICO: '#1a7f37', CULTURAL: '#6639ba',
    DEPORTIVO: '#0969da', INSTITUCIONAL: '#bc4c00', OTRO: '#57606a',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days === 0) return 'hoy';
    if (days === 1) return 'ayer';
    if (days < 7) return `hace ${days} días`;
    if (days < 30) return `hace ${Math.floor(days / 7)} sem.`;
    if (days < 365) return `hace ${Math.floor(days / 30)} meses`;
    return `hace ${Math.floor(days / 365)} años`;
}

/**
 * Devuelve true si el evento ya ocurrió (fecha + hora en el pasado).
 * Si no hay hora de fin/inicio, usa 23:59 para no bloquear eventos de todo el día.
 */
function isEventInPast(eventDate: string, startTime?: string): boolean {
    if (!eventDate) return false;
    // Extraer solo HH:mm, ignorando segundos si vienen en startTime
    const timeStr = startTime && startTime.length >= 5 ? startTime.substring(0, 5) : '23:59';
    const eventDateTime = new Date(`${eventDate.split('T')[0]}T${timeStr}:00`);
    return eventDateTime < new Date();
}

// ── Modal Historial ───────────────────────────────────────────────────────────
const HistorialModal: React.FC<{ areaIds: number[]; areaName: string; onClose: () => void }> = ({ areaIds, areaName, onClose }) => {
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEscapeKey(onClose);

    useEffect(() => {
        (async () => {
            try {
                const past = await eventsService.getPast();
                setPastEvents(past.filter(e =>
                    areaIds.includes((e as any).areaId) ||
                    areaIds.includes((e as any).pointOfInterest?.areaId)
                ));
            } catch { /* silencioso */ } finally { setLoading(false); }
        })();
    }, [areaIds]);

    const filtered = pastEvents.filter(e => {
        const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
            (e.location || '').toLowerCase().includes(search.toLowerCase()) ||
            (e.category || '').toLowerCase().includes(search.toLowerCase());
        const matchCat = !catFilter || e.category === catFilter;
        const evDate = new Date(String(e.eventDate).split('T')[0] + 'T12:00:00');
        const matchFrom = !dateFrom || evDate >= new Date(dateFrom + 'T00:00:00');
        const matchTo = !dateTo || evDate <= new Date(dateTo + 'T23:59:59');
        return matchSearch && matchCat && matchFrom && matchTo;
    });

    const grouped = filtered.reduce<Record<string, Event[]>>((acc, ev) => {
        const evDate = new Date(String(ev.eventDate).split('T')[0] + 'T12:00:00');
        const key = evDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' });
        (acc[key] = acc[key] || []).push(ev);
        return acc;
    }, {});

    const hasFilters = !!(search || catFilter || dateFrom || dateTo);
    const clearFilters = () => { setSearch(''); setCatFilter(''); setDateFrom(''); setDateTo(''); };

    const inputStyle: React.CSSProperties = {
        padding: '7px 12px', border: '1px solid #d1d5db', borderRadius: '8px',
        fontSize: '14px', fontFamily: 'Arial, sans-serif', background: '#fff', color: '#111',
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        }}>
            <button type="button" aria-label="Cerrar historial" onClick={onClose} style={{
                position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'default',
            }} />
            <div role="dialog" aria-modal="true" aria-labelledby="historial-title" tabIndex={-1} style={{
                position: 'relative', zIndex: 1,
                maxWidth: 780, width: '95%', maxHeight: '88vh',
                display: 'flex', flexDirection: 'column',
                background: '#fff', borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    background: 'linear-gradient(135deg, #374151, #4b5563)', flexShrink: 0,
                }}>
                    <div>
                        <h2 id="historial-title" style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
                            🕐 Historial de Eventos
                        </h2>
                        <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
                            {pastEvents.length} eventos pasados · área: <strong>{areaName}</strong>
                        </p>
                    </div>
                    <button type="button" onClick={onClose} style={{
                        background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%',
                        width: '32px', height: '32px', cursor: 'pointer', color: '#fff', fontSize: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>×</button>
                </div>

                {/* Filtros */}
                <div style={{
                    padding: '12px 24px', borderBottom: '1px solid #e5e7eb',
                    flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: '8px', background: '#f9fafb',
                }}>
                    <input type="text" placeholder="🔍 Buscar evento..." value={search}
                        onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, flex: '1 1 180px' }} />
                    <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
                        style={{ ...inputStyle, flex: '0 1 155px' }}>
                        <option value="">Todas las categorías</option>
                        <option value="ACADEMICO">Académico</option>
                        <option value="CULTURAL">Cultural</option>
                        <option value="DEPORTIVO">Deportivo</option>
                        <option value="INSTITUCIONAL">Institucional</option>
                        <option value="OTRO">Otro</option>
                    </select>
                    <input type="date" value={dateFrom} title="Desde"
                        onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, flex: '0 1 140px' }} />
                    <input type="date" value={dateTo} title="Hasta"
                        onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, flex: '0 1 140px' }} />
                    {hasFilters && (
                        <button type="button" onClick={clearFilters} style={{
                            ...inputStyle, background: '#fff3f3', color: '#dc2626',
                            border: '1px solid #fecaca', cursor: 'pointer', fontWeight: 600,
                        }}>✕ Limpiar</button>
                    )}
                </div>

                {/* Cuerpo */}
                <div style={{ overflowY: 'auto', flex: 1, padding: '16px 24px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '48px 0', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                            Cargando historial...
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '48px 0' }}>
                            <div style={{ fontSize: '2.5rem' }}>🗓️</div>
                            <p style={{ color: '#6b7280', marginTop: 8, fontFamily: 'Arial, sans-serif' }}>
                                {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay eventos pasados en esta área aún'}
                            </p>
                            {hasFilters && (
                                <button type="button" onClick={clearFilters} style={{
                                    marginTop: 8, background: 'none', border: 'none',
                                    color: '#2e7d32', cursor: 'pointer', fontSize: '14px', fontFamily: 'Arial, sans-serif',
                                }}>Limpiar filtros</button>
                            )}
                        </div>
                    ) : (
                        Object.entries(grouped).map(([month, evs]) => (
                            <div key={month} style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>
                                        {month}
                                    </span>
                                    <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                                    <span style={{ fontSize: '11px', color: '#6b7280', background: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1px 8px', fontFamily: 'Arial, sans-serif' }}>
                                        {evs.length}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {evs.map(ev => {
                                        const isOpen = expandedId === ev.id;
                                        const color = CATEGORY_COLORS[ev.category || ''] || '#57606a';
                                        const evDate = new Date(String(ev.eventDate).split('T')[0] + 'T12:00:00');
                                        return (
                                            <div key={ev.id} style={{
                                                border: '1px solid #e5e7eb', borderRadius: '8px',
                                                background: isOpen ? '#f0fdf4' : '#fff',
                                                overflow: 'hidden', transition: 'background 0.15s',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                                            }}>
                                                <button type="button" onClick={() => setExpandedId(isOpen ? null : ev.id)} style={{
                                                    width: '100%', textAlign: 'left', background: 'none', border: 'none',
                                                    cursor: 'pointer', padding: '12px 16px',
                                                    display: 'flex', alignItems: 'center', gap: '14px',
                                                }}>
                                                    <div style={{ flexShrink: 0, width: '48px', textAlign: 'center', borderRight: `3px solid ${color}`, paddingRight: '12px' }}>
                                                        <div style={{ fontSize: '11px', color: '#6b7280', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>
                                                            {evDate.toLocaleDateString('es-CO', { month: 'short' })}
                                                        </div>
                                                        <div style={{ fontSize: '22px', fontWeight: 700, color: '#111', lineHeight: 1.1, fontFamily: 'Arial, sans-serif' }}>
                                                            {evDate.getDate()}
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                                            <span style={{ fontWeight: 700, color: '#111', fontSize: '14px', fontFamily: 'Arial, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {ev.title}
                                                            </span>
                                                            {ev.category && (
                                                                <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '10px', background: color + '20', color, border: `1px solid ${color}40`, fontWeight: 700, fontFamily: 'Arial, sans-serif', flexShrink: 0 }}>
                                                                    {ev.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap', fontFamily: 'Arial, sans-serif' }}>
                                                            {ev.location && <span>📍 {ev.location}</span>}
                                                            {ev.area?.name && <span>🏢 {ev.area.name}</span>}
                                                            {ev.startTime && <span>⏰ {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>}
                                                            <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>{timeAgo(String(ev.eventDate))}</span>
                                                        </div>
                                                    </div>
                                                    <span style={{ color: '#6b7280', flexShrink: 0, fontSize: '14px', display: 'inline-block', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
                                                </button>
                                                {isOpen && (
                                                    <div style={{ padding: '12px 16px 16px 76px', borderTop: '1px solid #e5e7eb', background: '#f0fdf4' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px 20px', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
                                                            <div>
                                                                <p style={{ color: '#6b7280', margin: '0 0 2px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Fecha</p>
                                                                <p style={{ color: '#111', margin: 0 }}>{evDate.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                            </div>
                                                            {ev.pointOfInterest && (
                                                                <div>
                                                                    <p style={{ color: '#6b7280', margin: '0 0 2px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Punto de Interés</p>
                                                                    <p style={{ color: '#111', margin: 0 }}>{ev.pointOfInterest.title}</p>
                                                                </div>
                                                            )}
                                                            {ev.description && (
                                                                <div style={{ gridColumn: '1 / -1' }}>
                                                                    <p style={{ color: '#6b7280', margin: '0 0 2px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>Descripción</p>
                                                                    <p style={{ color: '#374151', margin: 0, lineHeight: 1.5 }}>{ev.description}</p>
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
                <div style={{ padding: '14px 24px', borderTop: '1px solid #e5e7eb', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
                    <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                        {filtered.length !== pastEvents.length ? `${filtered.length} de ${pastEvents.length} eventos` : `${pastEvents.length} eventos en total`}
                    </span>
                    <button type="button" onClick={onClose} style={{ padding: '9px 20px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', cursor: 'pointer', fontSize: '14px', fontFamily: 'Arial, sans-serif', fontWeight: 600 }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

// ── SubadminHome ──────────────────────────────────────────────────────────────
const SubadminHome: React.FC<{ userId?: number }> = ({ userId }) => {
    const { areas, loading } = useMyAreas(userId);
    const [counts, setCounts] = useState({ events: 0, news: 0, points: 0 });
    const navigate = useNavigate();

    useEffect(() => {
        if (!areas.length) return;
        const loadCounts = async () => {
            try {
                const [evs, nws, pts] = await Promise.all([
                    eventsService.getAll(), newsService.getAll(), pointsService.getAll(),
                ]);
                const areaIds = areas.map(a => a.id);
                setCounts({
                    events: evs.filter((e: any) => areaIds.includes(e.areaId) || areaIds.includes(e.pointOfInterest?.areaId)).length,
                    news: nws.filter((n: any) => areaIds.includes(n.areaId)).length,
                    points: pts.filter((p: any) => areaIds.includes(p.areaId)).length,
                });
            } catch { }
        };
        loadCounts();
    }, [areas]);

    if (loading) return <div className="dashboard-content"><div className="loading-spinner">Cargando...</div></div>;

    const statCards = [
        { icon: '📅', label: 'Eventos', num: counts.events, sub: 'en mis áreas', path: '/subadmin/areas', grad: '#43e97b,#38f9d7', shadow: 'rgba(67,233,123,0.25)' },
        { icon: '📰', label: 'Noticias', num: counts.news, sub: 'en mis áreas', path: '/subadmin/areas', grad: '#fa709a,#fee140', shadow: 'rgba(250,112,154,0.25)' },
        { icon: '📍', label: 'Puntos de Interés', num: counts.points, sub: 'en mis áreas', path: '/subadmin/points', grad: '#4facfe,#00f2fe', shadow: 'rgba(79,172,254,0.25)' },
    ];

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <div>
                    <h1>Panel de Subadministrador</h1>
                    <p style={{ color: '#888', margin: 0, fontSize: 14 }}>Gestiona el contenido de tus áreas asignadas</p>
                </div>
            </div>
            {areas.length === 0 ? (
                <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: 24, textAlign: 'center', marginBottom: 24 }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>⚠️</div>
                    <h3 style={{ color: '#f57f17', margin: '0 0 8px' }}>Sin áreas asignadas</h3>
                    <p style={{ color: '#888', margin: 0 }}>El administrador aún no te ha asignado ningún área.</p>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 24 }}>
                        <h3 style={{ color: '#2e7d32', marginBottom: 12 }}>🏛️ Mis Áreas ({areas.length})</h3>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {areas.map(a => (
                                <div key={a.id} style={{ background: '#f1f8f1', border: '1px solid #a5d6a7', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
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
                        {statCards.map(c => (
                            <button key={c.label} type="button" className="stat-card"
                                onClick={() => navigate(c.path)}
                                onKeyDown={e => e.key === 'Enter' && navigate(c.path)}
                                title={`Ir a ${c.label}`}
                                style={{ cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none', width: '100%', transition: 'transform 0.15s, box-shadow 0.15s' }}
                                onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(-3px)'; el.style.boxShadow = `0 6px 20px ${c.shadow}`; }}
                                onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.transform = 'translateY(0)'; el.style.boxShadow = ''; }}
                            >
                                <div className="stat-icon" style={{ background: `linear-gradient(135deg,${c.grad})` }}>{c.icon}</div>
                                <div className="stat-info">
                                    <h3>{c.label}</h3>
                                    <p className="stat-number">{c.num}</p>
                                    <span className="stat-label">{c.sub} →</span>
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

// ── MyAreasPage ───────────────────────────────────────────────────────────────
const MyAreasPage: React.FC<{ userId?: number }> = ({ userId }) => {
    const { areas, loading } = useMyAreas(userId);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);
    const [tab, setTab] = useState<'eventos' | 'noticias'>('eventos');
    const [eventos, setEventos] = useState<Event[]>([]);
    const [noticias, setNoticias] = useState<News[]>([]);
    const [areaPoints, setAreaPoints] = useState<PointOfInterest[]>([]);
    const [loadingData, setLoadingData] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const [showHistorial, setShowHistorial] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null); // ✅ NUEVO

    const [eventForm, setEventForm] = useState<CreateEventDto>({
        title: '', description: '', eventDate: '', startTime: '',
        endTime: '', location: '', category: '', isPublished: true,
    });
    const [newsForm, setNewsForm] = useState<CreateNewsDto>({
        title: '', content: '', summary: '', category: '', isPublished: true,
    });

    useEffect(() => { if (areas.length > 0 && !selectedArea) setSelectedArea(areas[0]); }, [areas]);

    // ── Tick cada 30 s → re-render → isEventInPast usa la hora actual ──────────
    useEffect(() => {
        const timer = setInterval(() => setEventos(prev => [...prev]), 30_000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!areas.length) return;
        (async () => {
            try {
                const all = await pointsService.getAll();
                const areaIds = areas.map(a => a.id);
                setAreaPoints(all.filter((p: any) => areaIds.includes(p.areaId)));
            } catch { setAreaPoints([]); }
        })();
    }, [areas]);

    useEffect(() => { if (selectedArea) loadAreaContent(selectedArea.id); }, [selectedArea, tab]);

    const loadAreaContent = async (areaId: number) => {
        try {
            setLoadingData(true);
            if (tab === 'eventos') {
                // ✅ FIX: usar getAllAdmin para ver TODOS los eventos incluyendo conflictivos
                const all = await eventsService.getAllAdmin();
                // ── Solo mostrar eventos FUTUROS (los pasados van al Historial) ──────
                setEventos(all.filter((e: any) =>
                    (e.areaId === areaId || e.pointOfInterest?.areaId === areaId) &&
                    !isEventInPast(
                        String(e.eventDate).split('T')[0],
                        e.endTime || e.startTime
                    )
                ));
            } else {
                const all = await newsService.getAll();
                setNoticias(all.filter((n: any) => n.areaId === areaId));
            }
        } catch { } finally { setLoadingData(false); }
    };

    const openCreateEvento = () => {
        setEditingItem(null);
        setEventForm({ title: '', description: '', eventDate: '', startTime: '', endTime: '', location: '', category: '', isPublished: true, areaId: selectedArea?.id, pointOfInterestId: areaPoints[0]?.id || undefined });
        setShowModal(true);
    };

    const openEditEvento = (e: Event) => {
        setEditingItem(e);
        setEventForm({ title: e.title, description: e.description || '', eventDate: e.eventDate, startTime: e.startTime || '', endTime: e.endTime || '', location: e.location || '', category: e.category || 'DEPORTIVO', isPublished: e.isPublished, areaId: selectedArea?.id, pointOfInterestId: (e as any).pointOfInterestId || undefined });
        setShowModal(true);
    };

    const openCreateNoticia = () => {
        setEditingItem(null);
        setNewsForm({ title: '', content: '', summary: '', category: '', isPublished: true, areaId: selectedArea?.id });
        setShowModal(true);
    };

    const openEditNoticia = (n: News) => {
        setEditingItem(n);
        setNewsForm({ title: n.title, content: n.content, summary: n.summary || '', category: n.category || '', isPublished: n.isPublished, areaId: selectedArea?.id });
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            if (tab === 'eventos') {
                // ── Validación: campos obligatorios (excepto ubicación) ────────────
                const missing: string[] = [];
                if (!eventForm.title?.trim()) missing.push('Título');
                if (!eventForm.description?.trim()) missing.push('Descripción');
                if (!eventForm.eventDate) missing.push('Fecha del evento');
                if (!eventForm.startTime) missing.push('Hora de inicio');
                if (!eventForm.endTime) missing.push('Hora de fin');
                if (!eventForm.category) missing.push('Categoría');

                if (missing.length > 0) {
                    setSaving(false);
                    setShowModal(false);
                    setErrorMsg(
                        `Los siguientes campos son obligatorios:\n\n• ${missing.join('\n• ')}\n\nPor favor compótalos antes de guardar.`
                    );
                    return;
                }

                if (eventForm.startTime && eventForm.endTime) {
                    const [sh, sm] = eventForm.startTime.split(':').map(Number);
                    const [eh, em] = eventForm.endTime.split(':').map(Number);
                    if (eh * 60 + em <= sh * 60 + sm) {
                        setSaving(false);
                        setShowModal(false);
                        setErrorMsg('La hora de finalización debe ser posterior a la hora de inicio.');
                        return;
                    }
                }

                // ── Validación: no crear eventos en el pasado ──────────────
                if (!editingItem) {
                    const dateStr = typeof eventForm.eventDate === 'string'
                        ? eventForm.eventDate
                        : String(eventForm.eventDate);
                    if (dateStr && isEventInPast(dateStr, eventForm.startTime)) {
                        const timeLabel = eventForm.startTime
                            ? `a las ${eventForm.startTime}`
                            : '(fin del día)';
                        setSaving(false);
                        setShowModal(false);
                        setErrorMsg(
                            `No es posible crear un evento en una fecha u hora que ya pasó.\n\n` +
                            `Fecha seleccionada: ${dateStr} ${timeLabel}.\n\n` +
                            `Por favor elige una fecha y hora futuras.`
                        );
                        return;
                    }
                }
                editingItem ? await eventsService.update(editingItem.id, eventForm) : await eventsService.create(eventForm);
            } else {
                editingItem ? await newsService.update(editingItem.id, newsForm) : await newsService.create(newsForm);
            }
            setShowModal(false);
            if (selectedArea) loadAreaContent(selectedArea.id);
        } catch (err: any) {
            // ✅ FIX: mostrar ErrorModal en lugar de alert()
            const msg = err?.response?.data?.message;
            setShowModal(false);
            setErrorMsg(msg || 'Error al guardar. Intenta de nuevo.');
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

    if (loading) return <div className="dashboard-content"><div className="loading-spinner">Cargando...</div></div>;
    if (areas.length === 0) return (
        <div className="dashboard-content">
            <h1>Mis Áreas</h1>
            <div style={{ textAlign: 'center', color: '#aaa', padding: 40 }}>
                <div style={{ fontSize: 40 }}>📭</div>
                <p>No tienes áreas asignadas aún.</p>
            </div>
        </div>
    );

    const modalFooter = (
        <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Guardando...' : editingItem ? 'Actualizar' : tab === 'eventos' ? 'Crear Evento' : 'Crear Noticia'}
            </button>
        </>
    );

    return (
        <div className="dashboard-content">
            <h1>Mis Áreas</h1>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
                {areas.map(a => (
                    <button key={a.id} type="button" onClick={() => setSelectedArea(a)} style={{
                        padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${selectedArea?.id === a.id ? '#2e7d32' : '#e0e0e0'}`,
                        background: selectedArea?.id === a.id ? '#e8f5e9' : '#fff',
                        color: selectedArea?.id === a.id ? '#2e7d32' : '#555',
                        fontWeight: selectedArea?.id === a.id ? 700 : 400, fontSize: 14,
                    }}>📍 {a.name}</button>
                ))}
            </div>

            {selectedArea && (
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 12, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', borderBottom: '1px solid #e0e0e0' }}>
                        {(['eventos', 'noticias'] as const).map(t => (
                            <button key={t} type="button" onClick={() => setTab(t)} style={{
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <span style={{ color: '#888', fontSize: 13 }}>
                                {tab === 'eventos' ? `${eventos.length} evento(s) en ${selectedArea.name}` : `${noticias.length} noticia(s) en ${selectedArea.name}`}
                            </span>
                            <div style={{ display: 'flex', gap: 8 }}>
                                {tab === 'eventos' && (
                                    <button type="button" className="btn btn-secondary"
                                        onClick={() => setShowHistorial(true)}
                                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        🕐 Historial
                                    </button>
                                )}
                                <button type="button" className="btn btn-primary"
                                    onClick={tab === 'eventos' ? openCreateEvento : openCreateNoticia}>
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
                                    <p>Sin eventos en esta área</p>
                                    <p style={{ fontSize: 13 }}>Usa el botón <strong>🕐 Historial</strong> para ver eventos pasados</p>
                                </div>
                            ) : (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>ID</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>Título</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>📅 Fecha Evento</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>🕐 Horario</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>📝 Creado</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>Área / POI</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>Categoría</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>Estado</th>
                                                <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 700, fontSize: '13px', color: '#374151', fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {eventos.map((ev, i) => {
                                                const tdStyle: React.CSSProperties = {
                                                    padding: '12px 14px', fontSize: '13px',
                                                    color: '#374151', fontFamily: 'Arial, sans-serif',
                                                    verticalAlign: 'middle',
                                                };
                                                const evDateStr = String(ev.eventDate).includes('T') ? ev.eventDate : ev.eventDate + 'T00:00:00';
                                                const formattedDate = ev.eventDate
                                                    ? new Date(evDateStr).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : '—';
                                                const formattedCreated = (ev as any).createdAt
                                                    ? new Date((ev as any).createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                                                    : '—';
                                                return (
                                                    <tr key={ev.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                                        <td style={{ ...tdStyle, color: '#9ca3af' }}>#{ev.id}</td>
                                                        <td style={{ ...tdStyle, fontWeight: 700, color: '#111' }}>{ev.title}</td>
                                                        <td style={tdStyle}>{formattedDate}</td>
                                                        <td style={{ ...tdStyle, color: '#6b7280' }}>
                                                            {ev.startTime
                                                                ? `${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ''}`
                                                                : '—'}
                                                        </td>
                                                        <td style={{ ...tdStyle, color: '#6b7280' }}>{formattedCreated}</td>
                                                        <td style={tdStyle}>
                                                            {(ev as any).area?.name
                                                                ? <span>🏢 {(ev as any).area.name}</span>
                                                                : (ev as any).pointOfInterest?.title
                                                                    ? <span>📍 {(ev as any).pointOfInterest.title}</span>
                                                                    : <span style={{ color: '#9ca3af' }}>—</span>}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            {ev.category ? (
                                                                <span style={{
                                                                    background: (CATEGORY_COLORS[ev.category] || '#57606a') + '20',
                                                                    color: CATEGORY_COLORS[ev.category] || '#374151',
                                                                    padding: '3px 10px', borderRadius: '10px',
                                                                    fontSize: '12px', fontWeight: 700,
                                                                    border: `1px solid ${(CATEGORY_COLORS[ev.category] || '#57606a')}40`,
                                                                    fontFamily: 'Arial, sans-serif',
                                                                }}>{ev.category}</span>
                                                            ) : <span style={{ color: '#9ca3af' }}>—</span>}
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <span style={{
                                                                background: ev.isPublished ? '#dcfce7' : '#f3f4f6',
                                                                color: ev.isPublished ? '#16a34a' : '#6b7280',
                                                                padding: '3px 10px', borderRadius: '10px', fontSize: '12px',
                                                                fontWeight: 700, border: `1px solid ${ev.isPublished ? '#86efac' : '#e5e7eb'}`,
                                                                fontFamily: 'Arial, sans-serif',
                                                            }}>
                                                                {ev.isPublished ? '✅ Publicado' : '⏸ Borrador'}
                                                            </span>
                                                        </td>
                                                        <td style={tdStyle}>
                                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                                <button type="button"
                                                                    onClick={() => openEditEvento(ev)}
                                                                    title="Editar"
                                                                    style={{
                                                                        padding: '6px 10px', borderRadius: '6px', border: 'none',
                                                                        background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
                                                                        color: '#fff', cursor: 'pointer', fontSize: '13px',
                                                                    }}>✏️</button>
                                                                <button type="button"
                                                                    onClick={() => handleDeleteEvento(ev.id)}
                                                                    title="Eliminar"
                                                                    style={{
                                                                        padding: '6px 10px', borderRadius: '6px', border: 'none',
                                                                        background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                                                                        color: '#fff', cursor: 'pointer', fontSize: '13px',
                                                                    }}>🗑️</button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
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
                                        <tr><th>Título</th><th>Resumen</th><th>Categoría</th><th>Estado</th><th>Creado</th><th>Acciones</th></tr>
                                    </thead>
                                    <tbody>
                                        {noticias.map(n => (
                                            <tr key={n.id}>
                                                <td style={{ fontWeight: 500 }}>{n.title}</td>
                                                <td style={{ color: '#666', fontSize: 13 }}>{n.summary || n.content?.slice(0, 60)}...</td>
                                                <td style={{ color: '#666' }}>{n.category || '—'}</td>
                                                <td>
                                                    <span style={{ background: n.isPublished ? '#e8f5e9' : '#f5f5f5', color: n.isPublished ? '#2e7d32' : '#999', padding: '2px 8px', borderRadius: 10, fontSize: 11, border: `1px solid ${n.isPublished ? '#a5d6a7' : '#ddd'}` }}>
                                                        {n.isPublished ? '✅ Publicado' : '⏸ Borrador'}
                                                    </span>
                                                </td>
                                                <td style={{ color: '#888', fontSize: 12 }}>{new Date(n.createdAt).toLocaleDateString('es-CO')}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEditNoticia(n)}>✏️</button>
                                                        <button type="button" className="btn btn-sm btn-danger" onClick={() => handleDeleteNoticia(n.id)}>🗑️</button>
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
            {showModal && tab === 'eventos' && (() => {
                const inputStyle: React.CSSProperties = {
                    width: '100%', padding: '9px 12px',
                    border: '1px solid #d1d5db', borderRadius: '8px',
                    fontSize: '14px', fontFamily: 'Arial, sans-serif',
                    outline: 'none', boxSizing: 'border-box',
                    background: '#fff', color: '#111',
                };
                const labelStyle: React.CSSProperties = {
                    display: 'block', marginBottom: '5px',
                    fontWeight: 600, fontSize: '13px',
                    color: '#374151', fontFamily: 'Arial, sans-serif',
                };
                const groupStyle: React.CSSProperties = { marginBottom: '14px' };
                return (
                    <div style={{
                        position: 'fixed', inset: 0, zIndex: 1000,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '16px',
                    }}>
                        <button type="button" aria-label="Cerrar modal" onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', inset: 0, background: 'transparent', border: 'none', cursor: 'default' }} />
                        <div role="dialog" aria-modal="true" style={{
                            position: 'relative', zIndex: 1,
                            background: '#fff', borderRadius: '12px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            width: '100%', maxWidth: '520px',
                            maxHeight: '90vh', display: 'flex', flexDirection: 'column',
                            overflow: 'hidden',
                        }}>
                            {/* Header */}
                            <div style={{
                                padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
                                flexShrink: 0,
                            }}>
                                <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
                                    {editingItem ? '✏️ Editar Evento' : '📅 Nuevo Evento'}
                                </h2>
                                <button type="button" onClick={() => setShowModal(false)} style={{
                                    background: 'rgba(255,255,255,0.2)', border: 'none',
                                    borderRadius: '50%', width: '32px', height: '32px',
                                    cursor: 'pointer', color: '#fff', fontSize: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>×</button>
                            </div>

                            {/* Body con scroll */}
                            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
                                <div style={groupStyle}>
                                    <label style={labelStyle} htmlFor="ev-title">Título *</label>
                                    <input id="ev-title" type="text" style={inputStyle} required
                                        value={eventForm.title} placeholder="Nombre del evento"
                                        onChange={e => setEventForm({ ...eventForm, title: e.target.value })} />
                                </div>

                                <div style={groupStyle}>
                                    <label style={labelStyle} htmlFor="ev-desc">
                                        Descripción <span style={{ color: '#dc2626' }}>*</span>
                                    </label>
                                    <textarea id="ev-desc" rows={3} style={{
                                        ...inputStyle, resize: 'vertical',
                                        borderColor: !eventForm.description?.trim() ? '#fca5a5' : '#d1d5db',
                                    }}
                                        value={eventForm.description} placeholder="Descripción del evento..."
                                        onChange={e => setEventForm({ ...eventForm, description: e.target.value })} />
                                    {!eventForm.description?.trim() && (
                                        <small style={{ color: '#dc2626', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                                            ⚠️ La descripción es obligatoria
                                        </small>
                                    )}
                                </div>

                                <div style={groupStyle}>
                                    <label style={labelStyle} htmlFor="ev-poi">Punto de Interés</label>
                                    <select id="ev-poi" style={inputStyle}
                                        value={eventForm.pointOfInterestId || ''}
                                        onChange={e => setEventForm({ ...eventForm, pointOfInterestId: e.target.value ? Number(e.target.value) : undefined })}>
                                        {areaPoints.map(pt => <option key={pt.id} value={pt.id}>📍 {pt.title}</option>)}
                                    </select>
                                    {areaPoints.length === 0 && (
                                        <small style={{ color: '#aaa', fontSize: 12, fontFamily: 'Arial, sans-serif' }}>
                                            No hay puntos de interés en tus áreas asignadas
                                        </small>
                                    )}
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={groupStyle}>
                                        <label style={labelStyle} htmlFor="ev-date">Fecha *</label>
                                        <input id="ev-date" type="date" style={inputStyle} required
                                            value={eventForm.eventDate}
                                            onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })} />
                                    </div>
                                    <div style={groupStyle}>
                                        <label style={labelStyle} htmlFor="ev-cat">
                                            Categoría <span style={{ color: '#dc2626' }}>*</span>
                                        </label>
                                        <select id="ev-cat" style={{
                                            ...inputStyle,
                                            borderColor: !eventForm.category ? '#fca5a5' : '#d1d5db',
                                        }}
                                            required
                                            value={eventForm.category}
                                            onChange={e => setEventForm({ ...eventForm, category: e.target.value })}>
                                            <option value="" disabled>— Selecciona una categoría —</option>
                                            <option value="ACADEMICO">Académico</option>
                                            <option value="CULTURAL">Cultural</option>
                                            <option value="DEPORTIVO">Deportivo</option>
                                            <option value="INSTITUCIONAL">Institucional</option>
                                            <option value="OTRO">Otro</option>
                                        </select>
                                        {!eventForm.category && (
                                            <small style={{ color: '#dc2626', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                                                ⚠️ La categoría es obligatoria
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div style={groupStyle}>
                                        <label style={labelStyle} htmlFor="ev-start">
                                            Hora inicio <span style={{ color: '#dc2626' }}>*</span>
                                        </label>
                                        <input id="ev-start" type="time" style={{
                                            ...inputStyle,
                                            borderColor: !eventForm.startTime ? '#fca5a5' : '#d1d5db',
                                        }}
                                            required
                                            value={eventForm.startTime}
                                            onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })} />
                                        {!eventForm.startTime && (
                                            <small style={{ color: '#dc2626', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                                                ⚠️ Obligatoria
                                            </small>
                                        )}
                                    </div>
                                    <div style={groupStyle}>
                                        <label style={labelStyle} htmlFor="ev-end">
                                            Hora fin <span style={{ color: '#dc2626' }}>*</span>
                                        </label>
                                        <input id="ev-end" type="time" style={{
                                            ...inputStyle,
                                            borderColor: !eventForm.endTime ? '#fca5a5' : '#d1d5db',
                                        }}
                                            required
                                            value={eventForm.endTime}
                                            onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })} />
                                        {!eventForm.endTime && (
                                            <small style={{ color: '#dc2626', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                                                ⚠️ Obligatoria
                                            </small>
                                        )}
                                    </div>
                                </div>

                                <div style={groupStyle}>
                                    <label style={labelStyle} htmlFor="ev-loc">Ubicación</label>
                                    <input id="ev-loc" type="text" style={inputStyle}
                                        value={eventForm.location} placeholder="Ej: Auditorio Principal"
                                        onChange={e => setEventForm({ ...eventForm, location: e.target.value })} />
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                    <input id="ev-pub" type="checkbox" checked={eventForm.isPublished}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        onChange={e => setEventForm({ ...eventForm, isPublished: e.target.checked })} />
                                    <label htmlFor="ev-pub" style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>
                                        Publicar evento
                                    </label>
                                </div>
                            </div>

                            {/* Footer */}
                            <div style={{
                                padding: '16px 24px', borderTop: '1px solid #e5e7eb',
                                display: 'flex', justifyContent: 'flex-end', gap: '10px',
                                background: '#f9fafb', flexShrink: 0,
                            }}>
                                <button type="button" onClick={() => setShowModal(false)} style={{
                                    padding: '10px 20px', borderRadius: '8px',
                                    border: '1px solid #d1d5db', background: '#fff',
                                    color: '#374151', cursor: 'pointer', fontSize: '14px',
                                    fontFamily: 'Arial, sans-serif', fontWeight: 600,
                                }}>Cancelar</button>
                                <button type="button" onClick={handleSave} disabled={saving} style={{
                                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                                    background: saving ? '#86efac' : 'linear-gradient(135deg, #2e7d32, #388e3c)',
                                    color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                                    fontSize: '14px', fontFamily: 'Arial, sans-serif', fontWeight: 700,
                                }}>
                                    {saving ? 'Guardando...' : editingItem ? 'Actualizar' : 'Crear Evento'}
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* Modal Noticia */}
            {showModal && tab === 'noticias' && (
                <Modal id="modal-noticia" title={editingItem ? 'Editar Noticia' : 'Nueva Noticia'} onClose={() => setShowModal(false)} footer={modalFooter}>
                    <div className="form-group">
                        <label htmlFor="ns-title">Título *</label>
                        <input id="ns-title" className="form-control" value={newsForm.title} onChange={e => setNewsForm({ ...newsForm, title: e.target.value })} placeholder="Título de la noticia" />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ns-summary">Resumen</label>
                        <input id="ns-summary" className="form-control" value={newsForm.summary} onChange={e => setNewsForm({ ...newsForm, summary: e.target.value })} placeholder="Resumen breve..." />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ns-content">Contenido *</label>
                        <textarea id="ns-content" className="form-control" rows={5} value={newsForm.content} onChange={e => setNewsForm({ ...newsForm, content: e.target.value })} placeholder="Contenido completo de la noticia..." />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ns-cat">Categoría</label>
                        <input id="ns-cat" className="form-control" value={newsForm.category} onChange={e => setNewsForm({ ...newsForm, category: e.target.value })} placeholder="Ej: Deportes, Académico..." />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ns-pub" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input id="ns-pub" type="checkbox" checked={newsForm.isPublished} onChange={e => setNewsForm({ ...newsForm, isPublished: e.target.checked })} />{' '}
                            Publicar inmediatamente
                        </label>
                    </div>
                </Modal>
            )}

            {/* Modal Historial */}
            {showHistorial && selectedArea && (
                <HistorialModal areaIds={areas.map(a => a.id)} areaName={selectedArea.name} onClose={() => setShowHistorial(false)} />
            )}

            {/* ✅ Modal de error con estilo */}
            {errorMsg && <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />}
        </div>
    );
};

// ── MyPointsPage ──────────────────────────────────────────────────────────────
const MyPointsPage: React.FC<{ userId?: number }> = ({ userId }) => {
    const { areas, loading: loadingAreas } = useMyAreas(userId);
    const [points, setPoints] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!areas.length) return;
        (async () => {
            setLoading(true);
            try {
                const all = await pointsService.getAll();
                const areaIds = areas.map(a => a.id);
                setPoints(all.filter((p: PointOfInterest) => areaIds.includes(p.areaId)));
            } catch { } finally { setLoading(false); }
        })();
    }, [areas]);

    if (loadingAreas || loading) return <div className="dashboard-content"><div className="loading-spinner">Cargando...</div></div>;

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <h1>Mis Puntos de Interés</h1>
                <span style={{ color: '#888', fontSize: 14 }}>{points.length} punto(s) en tus áreas asignadas</span>
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
                            <tr><th>Título</th><th>Área</th><th>Categoría</th><th>Visible</th><th>Orden</th></tr>
                        </thead>
                        <tbody>
                            {points.map(p => (
                                <tr key={p.id}>
                                    <td style={{ fontWeight: 500 }}>{p.title}</td>
                                    <td style={{ color: '#666' }}>{p.area?.name || '—'}</td>
                                    <td><span style={{ background: '#e3f2fd', color: '#1565c0', padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{p.category || '—'}</span></td>
                                    <td><span style={{ background: p.isVisible ? '#e8f5e9' : '#f5f5f5', color: p.isVisible ? '#2e7d32' : '#999', padding: '2px 8px', borderRadius: 10, fontSize: 11, border: `1px solid ${p.isVisible ? '#a5d6a7' : '#ddd'}` }}>{p.isVisible ? '✅ Visible' : '⏸ Oculto'}</span></td>
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

// ── SubadminDashboard layout ──────────────────────────────────────────────────
const SubadminDashboard: React.FC = () => {
    const { user, clearAuth } = useAuthStore();
    const handleLogout = () => { authService.logout(); clearAuth(); };

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
                    <NavLink to="/subadmin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📊</span><span>Inicio</span>
                    </NavLink>
                    <NavLink to="/subadmin/areas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">🏛️</span><span>Mis Áreas</span>
                    </NavLink>
                    <NavLink to="/subadmin/points" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📍</span><span>Mis Puntos</span>
                    </NavLink>
                </nav>
                <div className="sidebar-footer">
                    <button type="button" className="btn btn-secondary btn-block" onClick={() => window.location.href = '/'}>← Volver al Tour</button>
                    <button type="button" className="btn btn-outline btn-block" onClick={handleLogout}>Cerrar Sesión</button>
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