import React, { useEffect, useState } from 'react';
import { usersService, User, CreateUserDto } from '@/services/usersService';

// ── Hook: cerrar modal con Escape ─────────────────────────────────────────────
function useEscapeKey(handler: () => void) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handler(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [handler]);
}

// ─── Modal ────────────────────────────────────────────────────────────
const UserModal: React.FC<{
    user: User | null;
    onClose: () => void;
    onSave: () => void;
}> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        email:     user?.email     || '',
        firstName: user?.firstName || '',
        lastName:  user?.lastName  || '',
        password:  '',
        roleId:    user?.roleId    || 1,
        isActive:  user?.isActive  ?? true,
    });

    // ✅ Escape via useEffect — sin onKeyDown en div
    useEscapeKey(onClose);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (user) {
                const updateData: any = {
                    email:     formData.email,
                    firstName: formData.firstName,
                    lastName:  formData.lastName,
                    roleId:    formData.roleId,
                    isActive:  formData.isActive,
                };
                if (formData.password) updateData.password = formData.password;
                await usersService.update(user.id, updateData);
                alert('Usuario actualizado exitosamente');
            } else {
                await usersService.create(formData as CreateUserDto);
                alert('Usuario creado exitosamente');
            }
            onSave();
        } catch (error: any) {
            console.error('Error saving user:', error);
            alert(error.response?.data?.message || 'Error al guardar usuario');
        }
    };

    return (
        // ✅ Backdrop como <button> — elemento interactivo, sin warning
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
            {/* ✅ role="dialog" sin onKeyDown — Escape lo maneja useEscapeKey */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="user-modal-title"
                className="modal-content"
                tabIndex={-1}
                style={{ position: 'relative', zIndex: 1 }}
            >
                <div className="modal-header">
                    <h2 id="user-modal-title">{user ? 'Editar Usuario' : 'Crear Usuario'}</h2>
                    <button type="button" className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="usr-email">Email</label>
                        <input
                            id="usr-email"
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="usr-fname">Nombre</label>
                        <input
                            id="usr-fname"
                            type="text"
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="usr-lname">Apellido</label>
                        <input
                            id="usr-lname"
                            type="text"
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="usr-pass">
                            Contraseña {user && '(dejar en blanco para no cambiar)'}
                        </label>
                        <input
                            id="usr-pass"
                            type="password"
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                            required={!user}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="usr-role">Rol</label>
                        <select
                            id="usr-role"
                            value={formData.roleId}
                            onChange={e => setFormData({ ...formData, roleId: Number(e.target.value) })}
                            required
                        >
                            <option value={2}>ADMIN</option>
                            <option value={3}>SUBADMIN</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="usr-active" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input
                                id="usr-active"
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            Activo
                        </label>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>
                            Cancelar
                        </button>
                        <button type="submit" className="btn btn-primary">
                            {user ? 'Actualizar' : 'Crear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────
const UsersManagement: React.FC = () => {
    const [users, setUsers]           = useState<User[]>([]);
    const [loading, setLoading]       = useState(true);
    const [showModal, setShowModal]   = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await usersService.getAll();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
            alert('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await usersService.delete(id);
            await loadUsers();
            alert('Usuario eliminado exitosamente');
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Error al eliminar usuario');
        }
    };

    if (loading) {
        return (
            <div className="dashboard-content">
                <div className="loading-spinner">Cargando...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <h1>Gestión de Usuarios</h1>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { setEditingUser(null); setShowModal(true); }}
                >
                    + Crear Usuario
                </button>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Email</th>
                            <th>Nombre</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Último Acceso</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.email}</td>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>
                                    <span className={`badge badge-${user.role?.name.toLowerCase()}`}>
                                        {user.role?.name || 'N/A'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                                        {user.isActive ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td>
                                    {user.lastLogin
                                        ? new Date(user.lastLogin).toLocaleDateString()
                                        : 'Nunca'}
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => { setEditingUser(user); setShowModal(true); }}
                                            title="Editar"
                                        >✏️</button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(user.id)}
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
                <UserModal
                    user={editingUser}
                    onClose={() => setShowModal(false)}
                    onSave={async () => { setShowModal(false); await loadUsers(); }}
                />
            )}
        </div>
    );
};

export default UsersManagement;
