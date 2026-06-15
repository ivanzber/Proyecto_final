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

// ── Modal base accesible ──────────────────────────────────────────────────────
const ModalWrapper: React.FC<{
    onClose: () => void;
    children: React.ReactNode;
    wide?: boolean;
}> = ({ onClose, children, wide }) => {
    useEscapeKey(onClose);
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
        }}>
            <button
                type="button"
                aria-label="Cerrar modal"
                onClick={onClose}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'transparent', border: 'none', cursor: 'default',
                }}
            />
            <div
                role="dialog"
                aria-modal="true"
                style={{
                    position: 'relative', zIndex: 1,
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                    width: '100%',
                    maxWidth: wide ? '780px' : '520px',
                    maxHeight: '90vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                }}
                tabIndex={-1}
            >
                {children}
            </div>
        </div>
    );
};

// ── Modal de error con estilo (compatible con todos los navegadores) ───────────
const ErrorModal: React.FC<{
    message: string;
    onClose: () => void;
}> = ({ message, onClose }) => {
    useEscapeKey(onClose);
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
        }}>
            <button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'transparent', border: 'none', cursor: 'default',
                }}
            />
            <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="error-title"
                style={{
                    position: 'relative', zIndex: 1,
                    background: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
                    width: '100%',
                    maxWidth: '460px',
                    overflow: 'hidden',
                }}
            >
                {/* Banda superior roja */}
                <div style={{
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <span style={{ fontSize: '28px' }}>⚠️</span>
                    <h2 id="error-title" style={{
                        margin: 0, color: '#fff',
                        fontSize: '18px', fontWeight: 700,
                        fontFamily: 'Arial, sans-serif',
                    }}>
                        Conflicto de Evento
                    </h2>
                </div>

                {/* Cuerpo del mensaje */}
                <div style={{ padding: '24px' }}>
                    <p style={{
                        margin: '0 0 20px',
                        color: '#374151',
                        fontSize: '15px',
                        lineHeight: '1.6',
                        fontFamily: 'Arial, sans-serif',
                    }}>
                        {message}
                    </p>

                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        padding: '12px 16px',
                        marginBottom: '20px',
                    }}>
                        <p style={{
                            margin: 0,
                            color: '#dc2626',
                            fontSize: '13px',
                            fontFamily: 'Arial, sans-serif',
                        }}>
                            💡 El evento <strong>no fue guardado</strong>. Cambia la fecha, el horario o el lugar para evitar el conflicto.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '15px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'Arial, sans-serif',
                        }}
                    >
                        Entendido
                    </button>
                </div>
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
    onConflict: (msg: string) => void;
}> = ({ event, points, onClose, onSave, onConflict }) => {
    const [formData, setFormData] = useState({
        title: event?.title || '',
        description: event?.description || '',
        areaId: event?.areaId || '',
        pointOfInterestId: event?.pointOfInterestId || (points.length > 0 ? points[0].id : ''),
        eventDate: event?.eventDate ? String(event.eventDate).split('T')[0] : '',
        startTime: event?.startTime || '',
        endTime: event?.endTime || '',
        location: event?.location || '',
        category: event?.category || '',
        isPublished: event?.isPublished ?? false,
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // ── Validación: campos obligatorios (excepto ubicación) ───────────────
        const missing: string[] = [];
        if (!formData.title.trim()) missing.push('Título');
        if (!formData.description?.trim()) missing.push('Descripción');
        if (!formData.eventDate) missing.push('Fecha del evento');
        if (!formData.startTime) missing.push('Hora de inicio');
        if (!formData.endTime) missing.push('Hora de fin');
        if (!formData.category) missing.push('Categoría');

        if (missing.length > 0) {
            onConflict(
                `Los siguientes campos son obligatorios:\n\n• ${missing.join('\n• ')}\n\nPor favor compótalos antes de guardar.`
            );
            return;
        }

        // ── Validación: la hora de finalización debe ser después de la hora de inicio ──
        if (formData.startTime && formData.endTime) {
            const [sh, sm] = formData.startTime.split(':').map(Number);
            const [eh, em] = formData.endTime.split(':').map(Number);
            if (eh * 60 + em <= sh * 60 + sm) {
                onConflict('La hora de finalización debe ser posterior a la hora de inicio.');
                return;
            }
        }

        // ── Validación: no permitir eventos en el pasado (solo al crear) ─────
        if (!event) {
            if (isEventInPast(formData.eventDate, formData.startTime)) {
                const timeLabel = `a las ${formData.startTime}`;
                onConflict(
                    `No es posible crear un evento en una fecha u hora que ya pasó.\n\n` +
                    `Fecha seleccionada: ${formData.eventDate} ${timeLabel}.\n\n` +
                    `Por favor elige una fecha y hora futuras.`
                );
                return;
            }
        }

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
            const msg = err.response?.data?.message;
            if (err.response?.status === 409 || (typeof msg === 'string' && msg.includes('Conflicto'))) {
                onConflict(msg || 'Existe un conflicto de horario en ese lugar y fecha.');
            } else {
                onConflict(msg || 'Error al guardar el evento. Intenta de nuevo.');
            }
        } finally {
            setSaving(false);
        }
    };

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
        <ModalWrapper onClose={onClose}>
            {/* Header */}
            <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: 'linear-gradient(135deg, #2e7d32, #388e3c)',
            }}>
                <h2 style={{
                    margin: 0, color: '#fff', fontSize: '18px',
                    fontWeight: 700, fontFamily: 'Arial, sans-serif',
                }}>
                    {event ? '✏️ Editar Evento' : '📅 Nuevo Evento'}
                </h2>
                <button type="button" onClick={onClose} style={{
                    background: 'rgba(255,255,255,0.2)', border: 'none',
                    borderRadius: '50%', width: '32px', height: '32px',
                    cursor: 'pointer', color: '#fff', fontSize: '18px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>×</button>
            </div>

            {/* Cuerpo con scroll */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
                <form id="event-form" onSubmit={handleSubmit}>
                    <div style={groupStyle}>
                        <label style={labelStyle} htmlFor="ev-title">Título *</label>
                        <input id="ev-title" type="text" style={inputStyle}
                            value={formData.title} required
                            placeholder="Nombre del evento"
                            onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>

                    <div style={groupStyle}>
                        <label style={labelStyle} htmlFor="ev-desc">
                            Descripción <span style={{ color: '#dc2626' }}>*</span>
                        </label>
                        <textarea id="ev-desc" rows={3} style={{
                            ...inputStyle, resize: 'vertical',
                            borderColor: !formData.description?.trim() ? '#fca5a5' : '#d1d5db',
                        }}
                            value={formData.description}
                            placeholder="Descripción del evento..."
                            onChange={e => setFormData({ ...formData, description: e.target.value })} />
                        {!formData.description?.trim() && (
                            <small style={{ color: '#dc2626', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                                ⚠️ La descripción es obligatoria
                            </small>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={groupStyle}>
                            <label style={labelStyle} htmlFor="ev-date">Fecha *</label>
                            <input id="ev-date" type="date" style={inputStyle}
                                value={formData.eventDate} required
                                onChange={e => setFormData({ ...formData, eventDate: e.target.value })} />
                        </div>
                        <div style={groupStyle}>
                            <label style={labelStyle} htmlFor="ev-cat">
                                Categoría <span style={{ color: '#dc2626' }}>*</span>
                            </label>
                            <select id="ev-cat" style={{
                                ...inputStyle,
                                borderColor: !formData.category ? '#fca5a5' : '#d1d5db',
                            }}
                                required
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}>
                                <option value="" disabled>— Selecciona una categoría —</option>
                                <option value="ACADEMICO">Académico</option>
                                <option value="CULTURAL">Cultural</option>
                                <option value="DEPORTIVO">Deportivo</option>
                                <option value="INSTITUCIONAL">Institucional</option>
                                <option value="OTRO">Otro</option>
                            </select>
                            {!formData.category && (
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
                                borderColor: !formData.startTime ? '#fca5a5' : '#d1d5db',
                            }}
                                required
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })} />
                            {!formData.startTime && (
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
                                borderColor: !formData.endTime ? '#fca5a5' : '#d1d5db',
                            }}
                                required
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })} />
                            {!formData.endTime && (
                                <small style={{ color: '#dc2626', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                                    ⚠️ Obligatoria
                                </small>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={groupStyle}>
                            <label style={labelStyle} htmlFor="ev-poi">Punto de Interés</label>
                            <select id="ev-poi" style={inputStyle}
                                value={formData.pointOfInterestId}
                                onChange={e => setFormData({ ...formData, pointOfInterestId: e.target.value, areaId: '' })}>
                                {points.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={groupStyle}>
                        <label style={labelStyle} htmlFor="ev-loc">Ubicación</label>
                        <input id="ev-loc" type="text" style={inputStyle}
                            value={formData.location}
                            placeholder="Ej: Auditorio Principal"
                            onChange={e => setFormData({ ...formData, location: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <input id="ev-pub" type="checkbox" checked={formData.isPublished}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            onChange={e => setFormData({ ...formData, isPublished: e.target.checked })} />
                        <label htmlFor="ev-pub" style={{ ...labelStyle, margin: 0, cursor: 'pointer' }}>
                            Publicar evento
                        </label>
                    </div>
                </form>
            </div>

            {/* Footer */}
            <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e7eb',
                display: 'flex', justifyContent: 'flex-end', gap: '10px',
                background: '#f9fafb',
            }}>
                <button type="button" onClick={onClose} style={{
                    padding: '10px 20px', borderRadius: '8px',
                    border: '1px solid #d1d5db', background: '#fff',
                    color: '#374151', cursor: 'pointer', fontSize: '14px',
                    fontFamily: 'Arial, sans-serif', fontWeight: 600,
                }}>Cancelar</button>
                <button type="submit" form="event-form" disabled={saving} style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    background: saving ? '#86efac' : 'linear-gradient(135deg, #2e7d32, #388e3c)',
                    color: '#fff', cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '14px', fontFamily: 'Arial, sans-serif', fontWeight: 700,
                }}>
                    {saving ? 'Guardando...' : event ? 'Actualizar' : 'Crear Evento'}
                </button>
            </div>
        </ModalWrapper>
    );
};

// ─── Helpers ────────────────────────────────────────────────────────────

/**
 * Devuelve true si el evento ya ocurrió (fecha + hora de inicio en el pasado).
 * Si no hay hora de inicio se usa el fin del día (23:59) para no bloquear eventos de todo el día.
 */
function isEventInPast(eventDate: string, startTime?: string): boolean {
    if (!eventDate) return false;
    // Extraer solo HH:mm, ignorando segundos si vienen en startTime
    const timeStr = startTime && startTime.length >= 5 ? startTime.substring(0, 5) : '23:59';
    const eventDateTime = new Date(`${eventDate.split('T')[0]}T${timeStr}:00`);
    return eventDateTime < new Date();
}

const CATEGORY_COLORS: Record<string, string> = {
    ACADEMICO: '#1a7f37',
    CULTURAL: '#6639ba',
    DEPORTIVO: '#0969da',
    INSTITUCIONAL: '#bc4c00',
    OTRO: '#57606a',
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

function formatDate(d: any): string {
    if (!d) return '—';
    const date = new Date(String(d).includes('T') ? d : d + 'T00:00:00');
    return date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Modal Historial ────────────────────────────────────────────────────
const HistorialModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [pastEvents, setPastEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [catFilter, setCatFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const past = await eventsService.getPast();
                setPastEvents(past);
            } catch {
                /* silencioso */
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const filtered = pastEvents.filter(e => {
        const matchSearch =
            e.title.toLowerCase().includes(search.toLowerCase()) ||
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
        <ModalWrapper onClose={onClose} wide>
            {/* Header */}
            <div style={{
                padding: '20px 24px', borderBottom: '1px solid #e5e7eb',
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                background: 'linear-gradient(135deg, #374151, #4b5563)',
                flexShrink: 0,
            }}>
                <div>
                    <h2 style={{ margin: 0, color: '#fff', fontSize: '18px', fontWeight: 700, fontFamily: 'Arial, sans-serif' }}>
                        🕐 Historial de Eventos
                    </h2>
                    <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.7)', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
                        {pastEvents.length} eventos pasados registrados
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
                flexShrink: 0, display: 'flex', flexWrap: 'wrap', gap: '8px',
                background: '#f9fafb',
            }}>
                <input type="text" placeholder="🔍 Buscar evento..."
                    value={search} onChange={e => setSearch(e.target.value)}
                    style={{ ...inputStyle, flex: '1 1 180px' }} />
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
                    onChange={e => setDateFrom(e.target.value)}
                    style={{ ...inputStyle, flex: '0 1 140px' }} />
                <input type="date" value={dateTo} title="Hasta"
                    onChange={e => setDateTo(e.target.value)}
                    style={{ ...inputStyle, flex: '0 1 140px' }} />
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
                            {hasFilters ? 'Sin resultados para los filtros aplicados' : 'No hay eventos pasados aún'}
                        </p>
                        {hasFilters && (
                            <button type="button" onClick={clearFilters} style={{
                                marginTop: 8, background: 'none', border: 'none',
                                color: '#2e7d32', cursor: 'pointer', fontSize: '14px',
                                fontFamily: 'Arial, sans-serif',
                            }}>Limpiar filtros</button>
                        )}
                    </div>
                ) : (
                    Object.entries(grouped).map(([month, evs]) => (
                        <div key={month} style={{ marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <span style={{
                                    fontSize: '11px', fontWeight: 700, color: '#6b7280',
                                    textTransform: 'uppercase', letterSpacing: '0.08em',
                                    fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
                                }}>{month}</span>
                                <div style={{ flex: 1, height: '1px', background: '#e5e7eb' }} />
                                <span style={{
                                    fontSize: '11px', color: '#6b7280', background: '#f3f4f6',
                                    border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1px 8px',
                                    fontFamily: 'Arial, sans-serif',
                                }}>{evs.length}</span>
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
                                            <button type="button"
                                                onClick={() => setExpandedId(isOpen ? null : ev.id)}
                                                style={{
                                                    width: '100%', textAlign: 'left', background: 'none',
                                                    border: 'none', cursor: 'pointer', padding: '12px 16px',
                                                    display: 'flex', alignItems: 'center', gap: '14px',
                                                }}>
                                                <div style={{
                                                    flexShrink: 0, width: '48px', textAlign: 'center',
                                                    borderRight: `3px solid ${color}`, paddingRight: '12px',
                                                }}>
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
                                                            <span style={{
                                                                fontSize: '11px', padding: '2px 10px', borderRadius: '10px',
                                                                background: color + '20', color, border: `1px solid ${color}40`,
                                                                fontWeight: 700, fontFamily: 'Arial, sans-serif', flexShrink: 0,
                                                            }}>{ev.category}</span>
                                                        )}
                                                        {!ev.isPublished && (
                                                            <span style={{
                                                                fontSize: '11px', padding: '2px 10px', borderRadius: '10px',
                                                                background: '#f3f4f6', color: '#6b7280', border: '1px solid #e5e7eb',
                                                                fontFamily: 'Arial, sans-serif', flexShrink: 0,
                                                            }}>Borrador</span>
                                                        )}
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '12px', marginTop: '4px', fontSize: '12px', color: '#6b7280', flexWrap: 'wrap', fontFamily: 'Arial, sans-serif' }}>
                                                        {ev.location && <span>📍 {ev.location}</span>}
                                                        {ev.area?.name && <span>🏢 {ev.area.name}</span>}
                                                        {ev.startTime && <span>⏰ {ev.startTime}{ev.endTime ? ` – ${ev.endTime}` : ''}</span>}
                                                        <span style={{ marginLeft: 'auto', fontStyle: 'italic' }}>{timeAgo(String(ev.eventDate))}</span>
                                                    </div>
                                                </div>
                                                <span style={{
                                                    color: '#6b7280', flexShrink: 0, fontSize: '14px',
                                                    display: 'inline-block',
                                                    transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                                    transition: 'transform 0.2s',
                                                }}>▾</span>
                                            </button>
                                            {isOpen && (
                                                <div style={{
                                                    padding: '12px 16px 16px 76px',
                                                    borderTop: '1px solid #e5e7eb',
                                                    background: '#f0fdf4',
                                                }}>
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
            <div style={{
                padding: '14px 24px', borderTop: '1px solid #e5e7eb',
                flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#f9fafb',
            }}>
                <span style={{ fontSize: '13px', color: '#6b7280', fontFamily: 'Arial, sans-serif' }}>
                    {filtered.length !== pastEvents.length
                        ? `${filtered.length} de ${pastEvents.length} eventos`
                        : `${pastEvents.length} eventos en total`}
                </span>
                <button type="button" onClick={onClose} style={{
                    padding: '9px 20px', borderRadius: '8px',
                    border: '1px solid #d1d5db', background: '#fff',
                    color: '#374151', cursor: 'pointer', fontSize: '14px',
                    fontFamily: 'Arial, sans-serif', fontWeight: 600,
                }}>Cerrar</button>
            </div>
        </ModalWrapper>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────
const EventsManagement: React.FC = () => {
    const [events, setEvents] = useState<Event[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [points, setPoints] = useState<PointOfInterest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);
    const [search, setSearch] = useState('');
    const [showHistorial, setShowHistorial] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);    // conflicto al crear/editar
    const [loadErrorMsg, setLoadErrorMsg] = useState<string | null>(null); // error al cargar datos

    useEffect(() => { loadData(); }, []);

    // ── Tick cada 30 s → re-render → isEventInPast usa la hora actual ──────────
    useEffect(() => {
        const timer = setInterval(() => setEvents(prev => [...prev]), 30_000);
        return () => clearInterval(timer);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            // ✅ Usar admin/all para ver TODOS los eventos incluyendo conflictivos
            const [eData, aData, pData] = await Promise.all([
                eventsService.getAllAdmin(),
                areasService.getAll(),
                pointsService.getAll(),
            ]);
            setEvents(eData);
            setAreas(aData);
            setPoints(pData);
        } catch (err: any) {
            console.error('Error cargando eventos:', err);
            // Mostrar error de carga como banner, no como modal de conflicto
            setLoadErrorMsg(err.message || 'Error desconocido');
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
            setErrorMsg('Error al eliminar el evento.');
        }
    };

    // ── Solo mostrar eventos FUTUROS o de HOY que aún no han terminado ──────
    const upcomingEvents = events.filter(e =>
        !isEventInPast(String(e.eventDate).split('T')[0], e.endTime || e.startTime)
    );

    const filtered = upcomingEvents.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-content"><div className="loading-spinner">Cargando eventos...</div></div>;
    }

    const thStyle: React.CSSProperties = {
        textAlign: 'left', padding: '12px 14px',
        fontWeight: 700, fontSize: '13px', color: '#374151',
        fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
    };

    const tdStyle: React.CSSProperties = {
        padding: '12px 14px', fontSize: '13px',
        color: '#374151', fontFamily: 'Arial, sans-serif',
        verticalAlign: 'middle',
    };

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <div>
                    <h1>Gestión de Eventos</h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: '13px' }}>
                        {upcomingEvents.length} eventos próximos · {upcomingEvents.filter(e => e.isPublished).length} publicados
                        {events.length - upcomingEvents.length > 0 && (
                            <span style={{ marginLeft: 8, color: '#9ca3af' }}>
                                · {events.length - upcomingEvents.length} en historial
                            </span>
                        )}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" className="btn btn-secondary"
                        onClick={() => setShowHistorial(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        🕐 Historial
                    </button>
                    <button type="button" className="btn btn-primary"
                        onClick={() => { setEditingEvent(null); setShowModal(true); }}>
                        + Crear Evento
                    </button>
                </div>
            </div>

            {/* Banner de error de carga — no bloquea la pantalla */}
            {loadErrorMsg && (
                <div style={{
                    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
                    padding: '10px 16px', marginBottom: '12px', display: 'flex',
                    alignItems: 'center', gap: '10px', fontSize: '13px', color: '#dc2626',
                    fontFamily: 'Arial, sans-serif',
                }}>
                    <span>⚠️</span>
                    <span>Error al cargar datos: {loadErrorMsg}</span>
                    <button type="button" onClick={() => { setLoadErrorMsg(null); loadData(); }}
                        style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff',
                            border: 'none', borderRadius: '6px', padding: '4px 10px',
                            cursor: 'pointer', fontSize: '12px' }}>Reintentar</button>
                </div>
            )}

            <div className="search-bar">
                <input type="text"
                    placeholder="🔍 Buscar por título, categoría o ubicación..."
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            <div className="table-container">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb', background: '#f9fafb' }}>
                            <th style={thStyle}>ID</th>
                            <th style={thStyle}>Título</th>
                            <th style={thStyle}>📅 Fecha Evento</th>
                            <th style={thStyle}>🕐 Horario</th>
                            <th style={thStyle}>📝 Creado</th>
                            <th style={thStyle}>Área / POI</th>
                            <th style={thStyle}>Categoría</th>
                            <th style={thStyle}>Estado</th>
                            <th style={thStyle}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                                    {search ? 'No se encontraron eventos' : 'No hay eventos registrados'}
                                </td>
                            </tr>
                        ) : filtered.map((ev, i) => (
                            <tr key={ev.id} style={{ borderBottom: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                <td style={{ ...tdStyle, color: '#9ca3af' }}>#{ev.id}</td>
                                <td style={{ ...tdStyle, fontWeight: 700, color: '#111' }}>{ev.title}</td>
                                <td style={tdStyle}>{formatDate(ev.eventDate)}</td>
                                <td style={{ ...tdStyle, color: '#6b7280' }}>
                                    {ev.startTime
                                        ? `${ev.startTime}${ev.endTime ? ` – ${ev.endTime}` : ''}`
                                        : '—'}
                                </td>
                                <td style={{ ...tdStyle, color: '#6b7280' }}>{formatDate(ev.createdAt)}</td>
                                <td style={tdStyle}>
                                    {ev.area?.name
                                        ? <span>🏢 {ev.area.name}</span>
                                        : ev.pointOfInterest?.title
                                            ? <span>📍 {ev.pointOfInterest.title}</span>
                                            : <span style={{ color: '#9ca3af' }}>—</span>}
                                </td>
                                <td style={tdStyle}>
                                    {ev.category ? (
                                        <span style={{
                                            background: CATEGORY_COLORS[ev.category] + '20',
                                            color: CATEGORY_COLORS[ev.category] || '#374151',
                                            padding: '3px 10px', borderRadius: '10px',
                                            fontSize: '12px', fontWeight: 700,
                                            border: `1px solid ${CATEGORY_COLORS[ev.category] || '#374151'}40`,
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
                                    <div className="action-buttons">
                                        <button type="button" className="btn btn-sm btn-secondary"
                                            onClick={() => { setEditingEvent(ev); setShowModal(true); }}
                                            title="Editar">✏️</button>
                                        <button type="button" className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(ev.id)}
                                            title="Eliminar">🗑️</button>
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
                    onConflict={msg => { setShowModal(false); setErrorMsg(msg); }}
                    onSave={async () => { setShowModal(false); await loadData(); }}
                />
            )}

            {showHistorial && (
                <HistorialModal onClose={() => setShowHistorial(false)} />
            )}

            {errorMsg && (
                <ErrorModal message={errorMsg} onClose={() => setErrorMsg(null)} />
            )}
        </div>
    );
};

export default EventsManagement;