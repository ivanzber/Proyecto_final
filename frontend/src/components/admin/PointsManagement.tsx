import React, { useEffect, useState } from 'react';
import { pointsService, PointOfInterest, CreatePointDto } from '@/services/pointsService';
import { areasService, Area } from '@/services/areasService';

// ─── Modal ────────────────────────────────────────────────────────────
const PointModal: React.FC<{
    point: PointOfInterest | null;
    areas: Area[];
    onClose: () => void;
    onSave: () => void;
}> = ({ point, areas, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title: point?.title || '',
        description: point?.description || '',
        areaId: point?.areaId || (areas[0]?.id ?? 0),
        category: point?.category || '',
        isVisible: point?.isVisible ?? true,
        orderIndex: point?.orderIndex ?? 0,
        iconUrl: point?.iconUrl || '',
    });
    const [saving, setSaving] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: CreatePointDto = {
                title: formData.title,
                description: formData.description || undefined,
                areaId: Number(formData.areaId),
                category: formData.category || undefined,
                coordinates: {},
                isVisible: formData.isVisible,
                orderIndex: Number(formData.orderIndex),
                iconUrl: formData.iconUrl || undefined,
            };
            if (point) {
                await pointsService.update(point.id, payload);
            } else {
                await pointsService.create(payload);
            }
            onSave();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al guardar punto');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{point ? 'Editar Punto' : 'Nuevo Punto de Interés'}</h2>
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
                            placeholder="Ej: Biblioteca Principal"
                        />
                    </div>
                    <div className="form-group">
                        <label>Descripción</label>
                        <textarea
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            placeholder="Descripción del punto de interés..."
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Área *</label>
                            <select
                                value={formData.areaId}
                                onChange={e => setFormData({ ...formData, areaId: Number(e.target.value) })}
                                required
                            >
                                {areas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Categoría</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Sin categoría</option>
                                <option value="BIBLIOTECA">Biblioteca</option>
                                <option value="LABORATORIO">Laboratorio</option>
                                <option value="AULA">Aula</option>
                                <option value="CAFETERIA">Cafetería</option>
                                <option value="ADMINISTRATIVO">Administrativo</option>
                                <option value="DEPORTIVO">Deportivo</option>
                                <option value="PARQUE">Parque</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Orden</label>
                            <input
                                type="number"
                                value={formData.orderIndex}
                                onChange={e => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                                min={0}
                            />
                        </div>
                        <div className="form-group">
                            <label>URL Ícono</label>
                            <input
                                type="text"
                                value={formData.iconUrl}
                                onChange={e => setFormData({ ...formData, iconUrl: e.target.value })}
                                placeholder="https://..."
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={formData.isVisible}
                                onChange={e => setFormData({ ...formData, isVisible: e.target.checked })}
                            />
                            Visible en el recorrido
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : point ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────
const PointsManagement: React.FC = () => {
    const [points, setPoints] = useState<PointOfInterest[]>([]);
    const [areas, setAreas] = useState<Area[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPoint, setEditingPoint] = useState<PointOfInterest | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pData, aData] = await Promise.all([
                pointsService.getAll(),
                areasService.getAll(),
            ]);
            setPoints(pData);
            setAreas(aData);
        } catch (err) {
            console.error('Error cargando puntos:', err);
            alert('Error al cargar los puntos de interés');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar este punto de interés?')) return;
        try {
            await pointsService.delete(id);
            await loadData();
        } catch (err) {
            alert('Error al eliminar el punto');
        }
    };

    const filtered = points.filter(p =>
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-content"><div className="loading-spinner">Cargando puntos de interés...</div></div>;
    }

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <div>
                    <h1>Puntos de Interés</h1>
                    <p style={{ color: '#8b949e', margin: '4px 0 0', fontSize: '0.85rem' }}>
                        {points.length} puntos registrados en el campus
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditingPoint(null); setShowModal(true); }}>
                    + Agregar Punto
                </button>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="🔍 Buscar por título o categoría..."
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
                            <th>Área</th>
                            <th>Categoría</th>
                            <th>Orden</th>
                            <th>Visible</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#8b949e' }}>
                                    {search ? 'No se encontraron puntos con ese criterio' : 'No hay puntos de interés registrados'}
                                </td>
                            </tr>
                        ) : filtered.map(point => (
                            <tr key={point.id}>
                                <td>#{point.id}</td>
                                <td><strong>{point.title}</strong></td>
                                <td>{point.area?.name || `Area ${point.areaId}`}</td>
                                <td>
                                    {point.category ? (
                                        <span className="badge badge-info">{point.category}</span>
                                    ) : <span style={{ color: '#8b949e' }}>—</span>}
                                </td>
                                <td>{point.orderIndex}</td>
                                <td>
                                    <span className={`status-badge ${point.isVisible ? 'active' : 'inactive'}`}>
                                        {point.isVisible ? '✅ Visible' : '🚫 Oculto'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => { setEditingPoint(point); setShowModal(true); }}
                                            title="Editar"
                                        >✏️</button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(point.id)}
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
                <PointModal
                    point={editingPoint}
                    areas={areas}
                    onClose={() => setShowModal(false)}
                    onSave={async () => { setShowModal(false); await loadData(); }}
                />
            )}
        </div>
    );
};

export default PointsManagement;
