import React, { useEffect, useState } from 'react';
import { areasService, Area, CreateAreaDto } from '@/services/areasService';
import { usersService, User } from '@/services/usersService';

const AreasManagement: React.FC = () => {
    const [areas, setAreas] = useState<Area[]>([]);
    const [subadmins, setSubadmins] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAssign, setShowAssign] = useState(false);
    const [editingArea, setEditingArea] = useState<Area | null>(null);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);
    const [assignedUsers, setAssignedUsers] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState<CreateAreaDto>({
        name: '', code: '', description: '', isActive: true,
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [areasData, usersData] = await Promise.all([
                areasService.getAll(),
                usersService.getAll(),
            ]);
            setAreas(areasData);
            setSubadmins(usersData.filter((u: User) => u.role?.name === 'SUBADMIN'));
        } catch (err) {
            console.error('Error cargando datos:', err);
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingArea(null);
        setForm({ name: '', code: '', description: '', isActive: true });
        setShowModal(true);
    };

    const openEdit = (area: Area) => {
        setEditingArea(area);
        setForm({
            name: area.name,
            code: area.code,
            description: area.description || '',
            isActive: area.isActive,
        });
        setShowModal(true);
    };

    const openAssign = async (area: Area) => {
        setSelectedArea(area);
        // Cargar subadmins que ya tienen esta área asignada
        try {
            const assigned: number[] = [];
            for (const sub of subadmins) {
                const areas = await usersService.getAssignedAreas(sub.id);
                if (areas.some((a: any) => a.id === area.id || a.areaId === area.id)) {
                    assigned.push(sub.id);
                }
            }
            setAssignedUsers(assigned);
        } catch {
            setAssignedUsers([]);
        }
        setShowAssign(true);
    };

    const handleSave = async () => {
        if (!form.name || !form.code) {
            alert('Nombre y código son obligatorios');
            return;
        }
        try {
            setSaving(true);
            if (editingArea) {
                await areasService.update(editingArea.id, form);
            } else {
                await areasService.create(form);
            }
            setShowModal(false);
            await loadData();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al guardar área');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta área?')) return;
        try {
            await areasService.delete(id);
            await loadData();
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al eliminar área');
        }
    };

    const toggleSubadmin = (userId: number) => {
        setAssignedUsers(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSaveAssign = async () => {
        if (!selectedArea) return;
        try {
            setSaving(true);
            // Para cada subadmin, obtener sus áreas actuales y actualizar
            for (const sub of subadmins) {
                const currentAreas = await usersService.getAssignedAreas(sub.id);
                const currentIds = currentAreas.map((a: any) => a.id || a.areaId);
                let newIds: number[];

                if (assignedUsers.includes(sub.id)) {
                    // Agregar esta área si no la tiene
                    newIds = currentIds.includes(selectedArea.id)
                        ? currentIds
                        : [...currentIds, selectedArea.id];
                } else {
                    // Quitar esta área si la tiene
                    newIds = currentIds.filter((id: number) => id !== selectedArea.id);
                }

                if (JSON.stringify(newIds.sort()) !== JSON.stringify(currentIds.sort())) {
                    await usersService.assignAreas(sub.id, newIds);
                }
            }
            setShowAssign(false);
            alert('Asignaciones guardadas correctamente');
        } catch (err: any) {
            alert(err?.response?.data?.message || 'Error al asignar áreas');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="dashboard-content">
                <div className="loading-spinner">Cargando áreas...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-content">

            {/* Header */}
            <div className="content-header">
                <div>
                    <h1>Gestión de Áreas</h1>
                    <p style={{ color: '#888', margin: 0, fontSize: 14 }}>
                        {areas.length} áreas registradas del campus
                    </p>
                </div>
                <button className="btn btn-primary" onClick={openCreate}>
                    + Nueva Área
                </button>
            </div>

            {/* Tabla */}
            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Código</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {areas.map(area => (
                            <tr key={area.id}>
                                <td>{area.id}</td>
                                <td style={{ fontWeight: 500 }}>{area.name}</td>
                                <td>
                                    <code style={{
                                        background: '#f0f4f0', color: '#2e7d32',
                                        padding: '2px 8px', borderRadius: 4, fontSize: 12
                                    }}>
                                        {area.code}
                                    </code>
                                </td>
                                <td style={{ color: '#666', fontSize: 13 }}>
                                    {area.description || '—'}
                                </td>
                                <td>
                                    <span style={{
                                        background: area.isActive ? '#e8f5e9' : '#fafafa',
                                        color: area.isActive ? '#2e7d32' : '#999',
                                        padding: '2px 10px', borderRadius: 12,
                                        fontSize: 12, fontWeight: 600,
                                        border: `1px solid ${area.isActive ? '#a5d6a7' : '#ddd'}`,
                                    }}>
                                        {area.isActive ? '✅ Activa' : '⏸ Inactiva'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => openEdit(area)}
                                            title="Editar"
                                        >✏️</button>
                                        <button
                                            className="btn btn-sm"
                                            onClick={() => openAssign(area)}
                                            title="Asignar subadministradores"
                                            style={{
                                                background: '#e3f2fd', color: '#1565c0',
                                                border: '1px solid #90caf9'
                                            }}
                                        >👤 Asignar</button>
                                        <button
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(area.id)}
                                            title="Eliminar"
                                        >🗑️</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {areas.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', color: '#aaa', padding: 32 }}>
                                    No hay áreas registradas
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Modal Crear/Editar área ────────────────────────── */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingArea ? 'Editar Área' : 'Nueva Área'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">

                            <div className="form-group">
                                <label>Nombre *</label>
                                <input
                                    className="form-control"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    placeholder="Ej: Zonas Deportivas"
                                />
                            </div>

                            <div className="form-group">
                                <label>Código único *</label>
                                <input
                                    className="form-control"
                                    value={form.code}
                                    onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                    placeholder="Ej: DEPORTES"
                                    disabled={!!editingArea}
                                />
                                {editingArea && (
                                    <small style={{ color: '#999' }}>El código no se puede modificar</small>
                                )}
                            </div>

                            <div className="form-group">
                                <label>Descripción</label>
                                <textarea
                                    className="form-control"
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    placeholder="Descripción del área..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={e => setForm({ ...form, isActive: e.target.checked })}
                                        style={{ marginRight: 8 }}
                                    />
                                    Área activa
                                </label>
                            </div>

                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                {saving ? 'Guardando...' : editingArea ? 'Actualizar' : 'Crear Área'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal Asignar subadmins ────────────────────────── */}
            {showAssign && selectedArea && (
                <div className="modal-overlay" onClick={() => setShowAssign(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Asignar Subadministradores</h2>
                            <button className="modal-close" onClick={() => setShowAssign(false)}>✕</button>
                        </div>
                        <div className="modal-body">

                            <div style={{
                                background: '#f0f4f0', borderRadius: 8,
                                padding: '10px 14px', marginBottom: 16,
                                display: 'flex', alignItems: 'center', gap: 8
                            }}>
                                <span>📍</span>
                                <div>
                                    <strong>{selectedArea.name}</strong>
                                    <div style={{ fontSize: 12, color: '#666' }}>
                                        Código: {selectedArea.code}
                                    </div>
                                </div>
                            </div>

                            {subadmins.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#aaa', padding: 24 }}>
                                    <p>No hay subadministradores registrados.</p>
                                    <p style={{ fontSize: 13 }}>
                                        Crea un usuario con rol SUBADMIN primero.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <p style={{ color: '#666', fontSize: 14, marginBottom: 12 }}>
                                        Selecciona los subadministradores que gestionarán esta área:
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {subadmins.map(sub => (
                                            <label key={sub.id} style={{
                                                display: 'flex', alignItems: 'center', gap: 12,
                                                padding: '10px 14px', borderRadius: 8,
                                                border: `1px solid ${assignedUsers.includes(sub.id) ? '#a5d6a7' : '#e0e0e0'}`,
                                                background: assignedUsers.includes(sub.id) ? '#f1f8f1' : '#fafafa',
                                                cursor: 'pointer', transition: 'all 0.15s'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    checked={assignedUsers.includes(sub.id)}
                                                    onChange={() => toggleSubadmin(sub.id)}
                                                    style={{ width: 16, height: 16 }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 500 }}>
                                                        {sub.firstName} {sub.lastName}
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#888' }}>
                                                        {sub.email}
                                                    </div>
                                                </div>
                                                {assignedUsers.includes(sub.id) && (
                                                    <span style={{
                                                        background: '#e8f5e9', color: '#2e7d32',
                                                        fontSize: 11, padding: '2px 8px',
                                                        borderRadius: 10, fontWeight: 600
                                                    }}>
                                                        ✓ Asignado
                                                    </span>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAssign(false)}>
                                Cancelar
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSaveAssign}
                                disabled={saving || subadmins.length === 0}
                            >
                                {saving ? 'Guardando...' : 'Guardar Asignaciones'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AreasManagement;