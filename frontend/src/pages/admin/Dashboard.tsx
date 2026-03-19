import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import DashboardHome from '@/components/admin/DashboardHome';
import UsersManagement from '@/components/admin/UsersManagement';
import PointsManagement from '@/components/admin/PointsManagement';
import EventsManagement from '@/components/admin/EventsManagement';
import NewsManagement from '@/components/admin/NewsManagement';
import logoUdec from '@/assets/images/logo_2.png';
import './Dashboard.css';

const AdminDashboard: React.FC = () => {
    const { user, clearAuth } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

    const handleLogout = () => {
        authService.logout();
        clearAuth();
    };

    const toggleSidebar = () => {
        setSidebarCollapsed(!sidebarCollapsed);
    };

    return (
        <div className="dashboard-layout">
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <button className="sidebar-toggle" onClick={toggleSidebar} title={sidebarCollapsed ? 'Expandir' : 'Colapsar'}>
                    {sidebarCollapsed ? '☰' : '✕'}
                </button>
                <div className="sidebar-header">
                    <img src={logoUdec} alt="Logo UDEC" className="logo" />
                    {!sidebarCollapsed && (
                        <>
                            <h2>Campus Virtual</h2>
                            <p className="user-info">{user?.email}</p>
                            <span className="user-role">{user?.role || 'Admin'}</span>
                        </>
                    )}
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/admin" end className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Dashboard">
                        <span className="nav-icon">📊</span>
                        {!sidebarCollapsed && <span>Dashboard</span>}
                    </NavLink>
                    <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Usuarios">
                        <span className="nav-icon">👥</span>
                        {!sidebarCollapsed && <span>Usuarios</span>}
                    </NavLink>
                    <NavLink to="/admin/points" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Puntos de Interés">
                        <span className="nav-icon">📍</span>
                        {!sidebarCollapsed && <span>Puntos de Interés</span>}
                    </NavLink>
                    <NavLink to="/admin/events" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Eventos">
                        <span className="nav-icon">📅</span>
                        {!sidebarCollapsed && <span>Eventos</span>}
                    </NavLink>
                    <NavLink to="/admin/news" className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'} title="Noticias">
                        <span className="nav-icon">📰</span>
                        {!sidebarCollapsed && <span>Noticias</span>}
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button className="btn btn-secondary btn-block" onClick={() => window.location.href = '/'} title="Volver al Tour">
                        {sidebarCollapsed ? '🏠' : '← Volver al Tour'}
                    </button>
                    <button className="btn btn-outline btn-block" onClick={handleLogout} title="Cerrar Sesión">
                        {sidebarCollapsed ? '🚪' : 'Cerrar Sesión'}
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
