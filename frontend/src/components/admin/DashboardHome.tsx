import React, { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { statisticsService, DashboardStats, AreaVisit, VisitsByDate } from '@/services/statisticsService';
import { usersService } from '@/services/usersService';
import { areasService } from '@/services/areasService';
import { pointsService } from '@/services/pointsService';
import { eventsService, Event } from '@/services/eventsService';
import { newsService } from '@/services/newsService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const DashboardHome: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [mostVisitedAreas, setMostVisitedAreas] = useState<AreaVisit[]>([]);
    const [visitsByDate, setVisitsByDate] = useState<VisitsByDate[]>([]);
    const [recentEvents, setRecentEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            // Load each data source independently so one failure doesn't zero everything
            let users: any[] = [];
            let areas: any[] = [];
            let points: any[] = [];
            let events: Event[] = [];
            let news: any[] = [];

            try { users = await usersService.getAll(); } catch (e) { console.warn('Error cargando usuarios:', e); }
            try { areas = await areasService.getAll(); } catch (e) { console.warn('Error cargando áreas:', e); }
            try { points = await pointsService.getAll(); } catch (e) { console.warn('Error cargando puntos:', e); }
            try { events = await eventsService.getAll(); } catch (e) { console.warn('Error cargando eventos:', e); }
            try { news = await newsService.getAll(); } catch (e) { console.warn('Error cargando noticias:', e); }

            const dashboardStats: DashboardStats = {
                totalUsers: users.length,
                totalAreas: areas.length,
                totalPoints: points.length,
                totalEvents: events.length,
                totalNews: news.length,
                activeUsers: users.filter(u => u.isActive).length,
                publishedEvents: events.filter(e => e.isPublished).length,
                publishedNews: news.filter(n => n.isPublished).length,
            };

            setStats(dashboardStats);

            // Store recent events (last 5)
            const sorted = [...events].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setRecentEvents(sorted.slice(0, 5));

            // Load analytics data from real endpoints
            try {
                const areasData = await statisticsService.getMostVisitedAreas(8);
                setMostVisitedAreas(areasData);
            } catch (error) {
                console.warn('No se pudieron cargar estadísticas de áreas:', error);
                setMostVisitedAreas([]);
            }

            try {
                const visitsData = await statisticsService.getVisitsByDate(30);
                setVisitsByDate(visitsData);
            } catch (error) {
                console.warn('No se pudieron cargar visitas por fecha:', error);
                setVisitsByDate([]);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };


    if (loading) {
        return (
            <div className="dashboard-content">
                <div className="loading-spinner">Cargando estadísticas...</div>
            </div>
        );
    }

    return (
        <div className="dashboard-content">
            <div className="dashboard-header">
                <h1>Panel de Administración</h1>
                <p>Bienvenido al sistema de gestión del Campus Virtual UDEC</p>
            </div>

            {/* Stats Cards */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        👥
                    </div>
                    <div className="stat-info">
                        <h3>Usuarios</h3>
                        <p className="stat-number">{stats?.totalUsers || 0}</p>
                        <span className="stat-label">{stats?.activeUsers || 0} activos</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                        🏛️
                    </div>
                    <div className="stat-info">
                        <h3>Áreas</h3>
                        <p className="stat-number">{stats?.totalAreas || 0}</p>
                        <span className="stat-label">del campus</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                        📍
                    </div>
                    <div className="stat-info">
                        <h3>Puntos de Interés</h3>
                        <p className="stat-number">{stats?.totalPoints || 0}</p>
                        <span className="stat-label">en el recorrido</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                        📅
                    </div>
                    <div className="stat-info">
                        <h3>Eventos</h3>
                        <p className="stat-number">{stats?.totalEvents || 0}</p>
                        <span className="stat-label">{stats?.publishedEvents || 0} publicados</span>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                        📰
                    </div>
                    <div className="stat-info">
                        <h3>Noticias</h3>
                        <p className="stat-number">{stats?.totalNews || 0}</p>
                        <span className="stat-label">{stats?.publishedNews || 0} publicadas</span>
                    </div>
                </div>
            </div>

            {/* Recent Events Section */}
            <div className="chart-card" style={{ marginBottom: '24px' }}>
                <h3>📅 Eventos Recientes</h3>
                {recentEvents.length === 0 ? (
                    <p style={{ color: '#8b949e', textAlign: 'center', padding: '24px' }}>
                        No hay eventos registrados aún. Crea uno desde la sección de Eventos.
                    </p>
                ) : (
                    <div className="table-container">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Título</th>
                                    <th>Fecha</th>
                                    <th>Punto de Interés</th>
                                    <th>Categoría</th>
                                    <th>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentEvents.map(ev => (
                                    <tr key={ev.id}>
                                        <td><strong>{ev.title}</strong></td>
                                        <td>{new Date(ev.eventDate).toLocaleDateString('es-CO')}</td>
                                        <td>{ev.pointOfInterest?.title || ev.area?.name || <span style={{ color: '#8b949e' }}>—</span>}</td>
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Charts Section */}
            <div className="charts-grid">
                {/* Most Visited Areas - Bar Chart */}
                <div className="chart-card">
                    <h3>Zonas Más Visitadas</h3>
                    {mostVisitedAreas.length === 0 ? (
                        <p style={{ color: '#8b949e', textAlign: 'center', padding: '48px 24px' }}>
                            Sin datos de visitas aún. Las estadísticas se generarán cuando los usuarios visiten el campus virtual.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mostVisitedAreas}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="areaName" angle={-45} textAnchor="end" height={100} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="visitCount" fill="#8884d8" name="Visitas" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Visits by Date - Line Chart */}
                <div className="chart-card">
                    <h3>Visitas por Día (Últimos 7 días)</h3>
                    {visitsByDate.length === 0 ? (
                        <p style={{ color: '#8b949e', textAlign: 'center', padding: '48px 24px' }}>
                            Sin datos de visitas aún. Las estadísticas se generarán automáticamente.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={visitsByDate}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Line type="monotone" dataKey="visits" stroke="#82ca9d" strokeWidth={2} name="Visitas" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Distribution Pie Chart */}
                <div className="chart-card">
                    <h3>Distribución de Contenido</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Puntos de Interés', value: stats?.totalPoints || 0 },
                                    { name: 'Eventos', value: stats?.totalEvents || 0 },
                                    { name: 'Noticias', value: stats?.totalNews || 0 },
                                    { name: 'Áreas', value: stats?.totalAreas || 0 },
                                ]}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {COLORS.map((color, index) => (
                                    <Cell key={`cell-${index}`} fill={color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DashboardHome;
