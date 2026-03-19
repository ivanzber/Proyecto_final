import React, { useEffect, useState } from 'react';
import { eventsService, Event, CreateEventDto } from '@/services/eventsService';
import { areasService, Area } from '@/services/areasService';
import { pointsService, PointOfInterest } from '@/services/pointsService';

// ─── Modal ─────────────────────────────────────────────────────────────
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
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{event ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Título *</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="Nombre del evento"
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Descripción del evento..."
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Fecha *</label>
                            <input
                                type="date"
                                value={formData.eventDate}
                                onChange={e => setFormData({ ...formData, eventDate: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Área</label>
                            <select
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
                            <label>Punto de Interés</label>
                            <select
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
                            <label>Hora inicio</label>
                            <input
                                type="time"
                                value={formData.startTime}
                                onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Hora fin</label>
                            <input
                                type="time"
                                value={formData.endTime}
                                onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Ubicación</label>
                            <input
                                type="text"
                                value={formData.location}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Ej: Auditorio Principal"
                            />
                        </div>
                        <div className="form-group">
                            <label>Categoría</label>
                            <select
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
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.isPublished}
                                onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                            />
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
            </div>
        </div>
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

    useEffect(() => {
        loadData();
    }, []);

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
        } catch (err) {
            alert('Error al eliminar el evento');
        }
    };

    const filtered = events.filter(e =>
        e.title.toLowerCase().includes(search.toLowerCase()) ||
        (e.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.location || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-content"><div className="loading-spinner">Cargando eventos...</div></div>;
    }

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <div>
                    <h1>Gestión de Eventos</h1>
                    <p style={{ color: '#8b949e', margin: '4px 0 0', fontSize: '0.85rem' }}>
                        {events.length} eventos · {events.filter(e => e.isPublished).length} publicados
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingEvent(null); setShowModal(true); }}>
                    + Crear Evento
                </button>
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
                            <th>ID</th>
                            <th>Título</th>
                            <th>Fecha</th>
                            <th>Ubicación</th>
                            <th>Área</th>
                            <th>Pto. Interés</th>
                            <th>Categoría</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: '#8b949e' }}>
                                    {search ? 'No se encontraron eventos con ese criterio' : 'No hay eventos registrados'}
                                </td>
                            </tr>
                        ) : filtered.map(ev => (
                            <tr key={ev.id}>
                                <td>#{ev.id}</td>
                                <td><strong>{ev.title}</strong></td>
                                <td>{new Date(ev.eventDate).toLocaleDateString('es-CO')}</td>
                                <td>{ev.location || <span style={{ color: '#8b949e' }}>—</span>}</td>
                                <td>{ev.area?.name || <span style={{ color: '#8b949e' }}>—</span>}</td>
                                <td>{ev.pointOfInterest?.title || <span style={{ color: '#8b949e' }}>—</span>}</td>
                                <td>
                                    {ev.category ? (
                                        <span className="badge badge-info">{ev.category}</span>
                                    ) : <span style={{ color: '#8b949e' }}>—</span>}
                                </td>
                                <td>
                                    <span className={`status-badge ${ev.isPublished ? 'active' : 'inactive'}`}>
                                        {ev.isPublished ? '✅ Publicado' : '📝 Borrador'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => { setEditingEvent(ev); setShowModal(true); }}
                                            title="Editar"
                                        >✏️</button>
                                        <button
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
        </div>
    );
};

export default EventsManagement;
