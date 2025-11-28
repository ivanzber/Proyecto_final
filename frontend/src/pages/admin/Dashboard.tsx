import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import './Dashboard.css';

// Placeholder components for admin routes
const DashboardHome = () => (
    <div className="dashboard-content">
        <h1>Panel de Administración</h1>
        <p>Bienvenido al sistema de gestión del Campus Virtual UDEC</p>
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-icon">📍</div>
                <div className="stat-info">
                    <h3>Puntos de Interés</h3>
                    <p className="stat-number">24</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                    <h3>Usuarios</h3>
                    <p className="stat-number">12</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-info">
                    <h3>Eventos</h3>
                    <p className="stat-number">8</p>
                </div>
            </div>
            <div className="stat-card">
                <div className="stat-icon">📰</div>
                <div className="stat-info">
                    <h3>Noticias</h3>
                    <p className="stat-number">15</p>
                </div>
            </div>
        </div>
    </div>
);

const UsersManagement = () => (
    <div className="dashboard-content">
        <h1>Gestión de Usuarios</h1>
        <p>Administra usuarios y subadministradores del sistema</p>
        <button className="btn btn-primary">+ Crear Usuario</button>
    </div>
);

const PointsManagement = () => (
    <div className="dashboard-content">
        <h1>Puntos de Interés</h1>
        <p>Gestiona los puntos del recorrido virtual 3D</p>
        <button className="btn btn-primary">+ Agregar Punto</button>
    </div>
);

const EventsManagement = () => (
    <div className="dashboard-content">
        <h1>Eventos</h1>
        <p>Administra eventos institucionales</p>
    </div>
);

const NewsManagement = () => (
    <div className="dashboard-content">
        <h1>Noticias</h1>
        <p>Gestiona noticias y anuncios</p>
    </div>
);

const AdminDashboard: React.FC = () => {
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
                    <h2>Admin Panel</h2>
                    <p className="user-info">{user?.email}</p>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📊</span>
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">👥</span>
                        <span>Usuarios</span>
                    </NavLink>
                    <NavLink to="/admin/points" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📍</span>
                        <span>Puntos de Interés</span>
                    </NavLink>
                    <NavLink to="/admin/events" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📅</span>
                        <span>Eventos</span>
                    </NavLink>
                    <NavLink to="/admin/news" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}>
                        <span className="nav-icon">📰</span>
                        <span>Noticias</span>
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
                    <Route index element={<DashboardHome />} />
                    <Route path="users" element={<UsersManagement />} />
                    <Route path="points" element={<PointsManagement />} />
                    <Route path="events" element={<EventsManagement />} />
                    <Route path="news" element={<NewsManagement />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminDashboard;
