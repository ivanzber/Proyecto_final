import React from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import DashboardHome    from '@/components/admin/DashboardHome';
import UsersManagement  from '@/components/admin/UsersManagement';
import PointsManagement from '@/components/admin/PointsManagement';
import EventsManagement from '@/components/admin/EventsManagement';
import NewsManagement   from '@/components/admin/NewsManagement';
import AreasManagement  from '@/components/admin/AreasManagement';
import logoUdec from '@/assets/images/logo_2.png';
import './Dashboard.css';

const AdminDashboard: React.FC = () => {
    const { user, clearAuth } = useAuthStore();
    const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

    const handleLogout = () => {
        authService.logout();
        clearAuth();
    };

    const navItem = (to: string, icon: string, label: string, end = false) => (
        <NavLink
            to={to}
            end={end}
            title={label}
            className={({ isActive }) => isActive ? 'nav-item active' : 'nav-item'}
        >
            <span className="nav-icon">{icon}</span>
            {!sidebarCollapsed && <span>{label}</span>}
        </NavLink>
    );

    return (
        <div className="dashboard-layout">

            {/* ── Sidebar ─────────────────────────────────────── */}
            <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>

                <button
                    className="sidebar-toggle"
                    onClick={() => setSidebarCollapsed(p => !p)}
                    title={sidebarCollapsed ? 'Expandir' : 'Colapsar'}
                >
                    {sidebarCollapsed ? '☰' : '✕'}
                </button>

                <div className="sidebar-header">
                    <img src={logoUdec} alt="Logo UDEC" className="logo" />
                    {!sidebarCollapsed && (
                        <>
                            <h2>Campus Virtual</h2>
                            <p className="user-info">{user?.email}</p>
                            <span className="user-role">{user?.role || 'ADMIN'}</span>
                        </>
                    )}
                </div>

                <nav className="sidebar-nav">
                    {navItem('/admin',        '📊', 'Dashboard',         true)}
                    {navItem('/admin/users',  '👥', 'Usuarios')}
                    {navItem('/admin/areas',  '🏛️', 'Áreas')}
                    {navItem('/admin/points', '📍', 'Puntos de Interés')}
                    {navItem('/admin/events', '📅', 'Eventos')}
                    {navItem('/admin/news',   '📰', 'Noticias')}
                </nav>

                <div className="sidebar-footer">
                    <button
                        className="btn btn-secondary btn-block"
                        onClick={() => window.location.href = '/'}
                        title="Volver al Tour"
                    >
                        {sidebarCollapsed ? '🏠' : '← Volver al Tour'}
                    </button>
                    <button
                        className="btn btn-outline btn-block"
                        onClick={handleLogout}
                        title="Cerrar Sesión"
                    >
                        {sidebarCollapsed ? '🚪' : 'Cerrar Sesión'}
                    </button>
                </div>
            </aside>

            {/* ── Contenido principal ──────────────────────────── */}
            <main className="dashboard-main">
                <Routes>
                    <Route index          element={<DashboardHome    />} />
                    <Route path="users"   element={<UsersManagement  />} />
                    <Route path="areas"   element={<AreasManagement  />} />
                    <Route path="points"  element={<PointsManagement />} />
                    <Route path="events"  element={<EventsManagement />} />
                    <Route path="news"    element={<NewsManagement   />} />
                    <Route path="*"       element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>

        </div>
    );
};

export default AdminDashboard;