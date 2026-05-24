import React, { useEffect, useState } from 'react';
import { eventsService, Event, CreateEventDto } from '@/services/eventsService';
import { areasService, Area } from '@/services/areasService';
import { pointsService, PointOfInterest } from '@/services/pointsService';

// ── Hook: cerrar modal con Escape ─────────────────────────────────────────────
function useEscapeKey(handler: () => void) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handler(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [handler]);
}

// ── Modal accesible reutilizable ──────────────────────────────────────────────
// Backdrop = <button> interactivo (sin warning jsx-a11y)
// Diálogo  = <div role="dialog"> sin onKeyDown (Escape via useEscapeKey)
const ModalWrapper: React.FC<{
    onClose: () => void;
    children: React.ReactNode;
    wide?: boolean;
}> = ({ onClose, children, wide }) => {
    useEscapeKey(onClose);
    return (
        <div className="modal-overlay">
            <button
                type="button"
                aria-label="Cerrar modal"
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'transparent', border: 'none',
                    cursor: 'default', width: '100%', height: '100%',
                }}
            />
            <div
                role="dialog"
                aria-modal="true"
                className="modal-content"
                tabIndex={-1}
                style={{
                    position: 'relative', zIndex: 1,
                    ...(wide ? {
                        maxWidth: 780, width: '95%', maxHeight: '88vh',
                        display: 'flex', flexDirection: 'column',
                    } : {}),
                }}
            >
                {children}
            </div>
        </div>
    );
};

// ─── Modal Crear/Editar ────────────────────────────────────────────────
const EventModal: React.FC<{
    event: Event | null;
    areas: Area[];
    points: PointOfInterest[];
    onClose: () => void;
    onSave: () => void;
}> = ({ event, areas, points, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        description: event?.description || '',
        areaId: event?.areaId || '',
        pointOfInterestId: event?.pointOfInterestId || '',
        eventDate: event?.eventDate ? event.eventDate.split('T')[0] : '',
        startTime: event?.startTime || '',
        endTime: event?.endTime || '',
        location: event?.location || '',
        category: event?.category || '',
        isPublished: event?.isPublished ?? false,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: CreateEventDto = {
                title: formData.title,
                description: formData.description || undefined,
                areaId: formData.areaId ? Number(formData.areaId) : undefined,
                pointOfInterestId: formData.pointOfInterestId ? Number(formData.pointOfInterestId) : undefined,
                eventDate: formData.eventDate,
                startTime: formData.startTime || undefined,
                endTime: formData.endTime || undefined,
                location: formData.location || undefined,
                category: formData.category || undefined,
                isPublished: formData.isPublished,
            };
            if (event) {
                await eventsService.update(event.id, payload);
            } else {
                await eventsService.create(payload);
            }
            onSave();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al guardar el evento');
        } finally {
            setSaving(false);
        }
    };

    return (
        <ModalWrapper onClose={onClose}>
            <div className="modal-header">
                <h2>{event ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                <button type="button" className="modal-close" onClick={onClose}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="ev-title">Título *</label>
                    <input
                        id="ev-title"
                        type="text"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                        placeholder="Nombre del evento"
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="ev-desc">Descripción</label>
                    <textarea
                        id="ev-desc"
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                        placeholder="Descripción del evento..."
                    />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="ev-date">Fecha *</label>
                        <input
                            id="ev-date"
                            type="date"
                            value={formData.eventDate}
                            onChange={e => setFormData({ ...formData, eventDate: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ev-area">Área</label>
                        <select
                            id="ev-area"
                            value={formData.areaId}
                            onChange={e => setFormData({ ...formData, areaId: e.target.value, pointOfInterestId: '' })}
                        >
                            <option value="">Sin área</option>
                            {areas.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="ev-poi">Punto de Interés</label>
                        <select
                            id="ev-poi"
                            value={formData.pointOfInterestId}
                            onChange={e => setFormData({ ...formData, pointOfInterestId: e.target.value, areaId: '' })}
                        >
                            <option value="">Sin punto de interés</option>
                            {points.map(p => (
                                <option key={p.id} value={p.id}>{p.title}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="ev-start">Hora inicio</label>
                        <input
                            id="ev-start"
                            type="time"
                            value={formData.startTime}
                            onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ev-end">Hora fin</label>
                        <input
                            id="ev-end"
                            type="time"
                            value={formData.endTime}
                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="ev-loc">Ubicación</label>
                        <input
                            id="ev-loc"
                            type="text"
                            value={formData.location}
                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                            placeholder="Ej: Auditorio Principal"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ev-cat">Categoría</label>
                        <select
                            id="ev-cat"
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                        >
                            <option value="">Sin categoría</option>
                            <option value="ACADEMICO">Académico</option>
                            <option value="CULTURAL">Cultural</option>
                            <option value="DEPORTIVO">Deportivo</option>
                            <option value="INSTITUCIONAL">Institucional</option>
                            <option value="OTRO">Otro</option>
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label htmlFor="ev-pub" className="checkbox-label">
                        <input
                            id="ev-pub"
                            type="checkbox"
                            checked={formData.isPublished}
                            onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                        />{' '}
                        Publicar evento
                    </label>
                </div>
                <div className="modal-actions">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? 'Guardando...' : event ? 'Actualizar' : 'Crear'}
                    </button>
                </div>
            </form>
        </ModalWrapper>
    );
};

// ─── Helpers ────────────────────────────────────────────────────────────
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

// ─── Modal Historial ────────────────────────────────────────────────────
const HistorialModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
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
                const past = await eventsService.getPast();
                setPastEvents(past);
            } catch {
                alert('Error al cargar el historial');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

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
        <ModalWrapper onClose={onClose} wide>
            {/* Header */}
            <div className="modal-header" style={{ flexShrink: 0 }}>
                <div>
                    <h2 style={{ margin: 0 }}>🕐 Historial de Eventos</h2>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#888' }}>
                        {pastEvents.length} eventos pasados registrados
                    </p>
                </div>
                <button type="button" className="modal-close" onClick={onClose}>×</button>
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
                        background: '#fff', border: '1px solid #e0e0e0',
                        borderRadius: 6, color: '#333', fontSize: '0.85rem',
                    }}
                />
                <select
                    value={catFilter}
                    onChange={e => setCatFilter(e.target.value)}
                    style={{
                        flex: '0 1 155px', padding: '7px 10px',
                        background: '#fff', border: '1px solid #e0e0e0',
                        borderRadius: 6, color: '#333', fontSize: '0.85rem',
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
                        background: '#fff', border: '1px solid #e0e0e0',
                        borderRadius: 6, color: '#333', fontSize: '0.85rem',
                    }}
                />
                <input
                    type="date" value={dateTo} title="Hasta"
                    onChange={e => setDateTo(e.target.value)}
                    style={{
                        flex: '0 1 140px', padding: '7px 10px',
                        background: '#fff', border: '1px solid #e0e0e0',
                        borderRadius: 6, color: '#333', fontSize: '0.85rem',
                    }}
                />
                {hasFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        style={{
                            padding: '7px 12px', background: 'transparent',
                            border: '1px solid #e0e0e0', borderRadius: 6,
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
                    <div style={{ textAlign: 'center', padding: '48px 0', color: '#888' }}>
                        Cargando historial...
                    </div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <div style={{ fontSize: '2.5rem' }}>🗓️</div>
                        <p style={{ color: '#888', marginTop: 8 }}>
                            {hasFilters
                                ? 'Sin resultados para los filtros aplicados'
                                : 'No hay eventos pasados registrados aún'}
                        </p>
                        {hasFilters && (
                            <button
                                type="button"
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
                                                type="button"
                                                onClick={() => setExpandedId(isOpen ? null : ev.id)}
                                                style={{
                                                    width: '100%', textAlign: 'left',
                                                    background: 'none', border: 'none',
                                                    cursor: 'pointer', padding: '10px 14px',
                                                    display: 'flex', alignItems: 'center', gap: 14,
                                                }}
                                            >
                                                <div style={{
                                                    flexShrink: 0, width: 44, textAlign: 'center',
                                                    borderRight: `2px solid ${color}`, paddingRight: 12,
                                                }}>
                                                    <div style={{ fontSize: '0.65rem', color: '#888', textTransform: 'uppercase' }}>
                                                        {evDate.toLocaleDateString('es-CO', { month: 'short' })}
                                                    </div>
                                                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#333', lineHeight: 1.1 }}>
                                                        {evDate.getDate()}
                                                    </div>
                                                </div>

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
                                                                flexShrink: 0, background: color + '22', color,
                                                                border: `1px solid ${color}44`, fontWeight: 600,
                                                            }}>
                                                                {ev.category}
                                                            </span>
                                                        )}
                                                        {!ev.isPublished && (
                                                            <span style={{
                                                                fontSize: '0.7rem', padding: '1px 8px', borderRadius: 10,
                                                                flexShrink: 0, background: '#f5f5f5', color: '#888',
                                                                border: '1px solid #e0e0e0',
                                                            }}>
                                                                Borrador
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{
                                                        display: 'flex', gap: 12, marginTop: 3,
                                                        fontSize: '0.75rem', color: '#888', flexWrap: 'wrap',
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

                                                <span style={{
                                                    color: '#888', flexShrink: 0, fontSize: '0.8rem',
                                                    display: 'inline-block',
                                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s',
                                                }}>▾</span>
                                            </button>

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
                                                            <p style={{ color: '#888', margin: '0 0 2px', fontSize: '0.72rem', textTransform: 'uppercase' }}>
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
                                                                <p style={{ color: '#888', margin: '0 0 2px', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                                    Punto de Interés
                                                                </p>
                                                                <p style={{ color: '#333', margin: 0 }}>{ev.pointOfInterest.title}</p>
                                                            </div>
                                                        )}
                                                        {ev.description && (
                                                            <div style={{ gridColumn: '1 / -1' }}>
                                                                <p style={{ color: '#888', margin: '0 0 2px', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                                                    Descripción
                                                                </p>
                                                                <p style={{ color: '#555', margin: 0, lineHeight: 1.5 }}>{ev.description}</p>
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
                <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {filtered.length !== pastEvents.length
                        ? `${filtered.length} de ${pastEvents.length} eventos`
                        : `${pastEvents.length} eventos en total`}
                </span>
                <button type="button" className="btn btn-secondary" onClick={onClose}>Cerrar</button>
            </div>
        </ModalWrapper>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────
const EventsManagement: React.FC = () => {
    const [events, setEvents]               = useState<Event[]>([]);
    const [areas, setAreas]                 = useState<Area[]>([]);
    const [points, setPoints]               = useState<PointOfInterest[]>([]);
    const [loading, setLoading]             = useState(true);
    const [showModal, setShowModal]         = useState(false);
    const [editingEvent, setEditingEvent]   = useState<Event | null>(null);
    const [search, setSearch]               = useState('');
    const [showHistorial, setShowHistorial] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [eData, aData, pData] = await Promise.all([
                eventsService.getAll(),
                areasService.getAll(),
                pointsService.getAll(),
            ]);
            setEvents(eData);
            setAreas(aData);
            setPoints(pData);
        } catch (err) {
            console.error('Error cargando eventos:', err);
            alert('Error al cargar los eventos');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este evento?')) return;
        try {
            await eventsService.delete(id);
            await loadData();
        } catch {
            alert('Error al eliminar el evento');
        }
    };

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.location  || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="dashboard-content">
                <div className="loading-spinner">Cargando eventos...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <div>
                    <h1>Gestión de Eventos</h1>
                    <p style={{ color: '#888', margin: '4px 0 0', fontSize: '0.85rem' }}>
                        {events.length} eventos · {events.filter(e => e.isPublished).length} publicados
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowHistorial(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        🕐 Historial
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => { setEditingEvent(null); setShowModal(true); }}
                    >
                        + Crear Evento
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="🔍 Buscar por título, categoría o ubicación..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th><th>Título</th><th>Fecha</th><th>Ubicación</th>
                            <th>Área</th><th>Pto. Interés</th><th>Categoría</th>
                            <th>Estado</th><th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#888' }}>
                                    {search ? 'No se encontraron eventos con ese criterio' : 'No hay eventos registrados'}
                                </td>
                            </tr>
                        ) : filtered.map(ev => (
                            <tr key={ev.id}>
                                <td>#{ev.id}</td>
                                <td><strong>{ev.title}</strong></td>
                                <td>{new Date(ev.eventDate).toLocaleDateString('es-CO')}</td>
                                <td>{ev.location || <span style={{ color: '#888' }}>—</span>}</td>
                                <td>{ev.area?.name || <span style={{ color: '#888' }}>—</span>}</td>
                                <td>{ev.pointOfInterest?.title || <span style={{ color: '#888' }}>—</span>}</td>
                                <td>
                                    {ev.category
                                        ? <span className="badge badge-info">{ev.category}</span>
                                        : <span style={{ color: '#888' }}>—</span>}
                                </td>
                                <td>
                                    <span className={`status-badge ${ev.isPublished ? 'active' : 'inactive'}`}>
                                        {ev.isPublished ? '✅ Publicado' : '📝 Borrador'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => { setEditingEvent(ev); setShowModal(true); }}
                                            title="Editar"
                                        >✏️</button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(ev.id)}
                                            title="Eliminar"
                                        >🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <EventModal
                    event={editingEvent}
                    areas={areas}
                    points={points}
                    onClose={() => setShowModal(false)}
                    onSave={async () => { setShowModal(false); await loadData(); }}
                />
            )}

            {showHistorial && (
                <HistorialModal onClose={() => setShowHistorial(false)} />
            )}
        </div>
    );
};

export default EventsManagement;
