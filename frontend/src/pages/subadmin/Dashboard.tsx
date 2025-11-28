import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import '../admin/Dashboard.css';

const SubadminHome = () => (
    <div className="dashboard-content">
        <h1>Panel de Subadministrador</h1>
        <p>Gestiona el contenido de tus áreas asignadas</p>
        <div className="alert info">
            <span>ℹ️</span>
            <p>Solo puedes editar contenido de las áreas que tienes asignadas</p>
        </div>
    </div>
);

const MyAreas = () => (
    <div className="dashboard-content">
        <h1>Mis Áreas</h1>
        <p>Áreas asignadas a tu gestión</p>
    </div>
);

const MyPoints = () => (
    <div className="dashboard-content">
        <h1>Mis Puntos de Interés</h1>
        <p>Gestiona puntos dentro de tus áreas</p>
    </div>
);

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
                    <div className="logo">🎓</div>
                    <h2>Subadmin Panel</h2>
                    <p className="user-info">{user?.email}</p>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/subadmin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📊</span>
                        <span>Início</span>
                    </NavLink>
                    <NavLink to="/subadmin/areas" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">🏢</span>
                        <span>Mis Áreas</span>
                    </NavLink>
                    <NavLink to="/subadmin/points" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📍</span>
                        <span>Mis Puntos</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-secondary btn-block" onClick={() => window.location.href = '/'}>
                        ← Volver al Tour
                    </button>
                    <button className="btn btn-outline btn-block" onClick={handleLogout}>
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            <main className="dashboard-main">
                <Routes>
                    <Route index element={<SubadminHome />} />
                    <Route path="areas" element={<MyAreas />} />
                    <Route path="points" element={<MyPoints />} />
                    <Route path="*" element={<Navigate to="/subadmin" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default SubadminDashboard;
