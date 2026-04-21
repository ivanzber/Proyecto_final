import React, { useEffect, useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { statisticsService, DashboardStats, AreaVisit, VisitsByDate } from '@/services/statisticsService';
import { usersService } from '@/services/usersService';
import { areasService } from '@/services/areasService';
import { pointsService } from '@/services/pointsService';
import { eventsService } from '@/services/eventsService';
import { newsService } from '@/services/newsService';
import api from '@/services/api';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

interface ViewsSummary {
    events: { entityId: number; views: number }[];
    news: { entityId: number; views: number }[];
}

const DashboardHome: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [mostVisitedAreas, setMostVisitedAreas] = useState<AreaVisit[]>([]);
    const [visitsByDate, setVisitsByDate] = useState<VisitsByDate[]>([]);
    const [activeUsers, setActiveUsers] = useState<number>(0);
    const [recentEvents, setRecentEvents] = useState<any[]>([]);
    const [recentNews, setRecentNews] = useState<any[]>([]);
    const [viewsSummary, setViewsSummary] = useState<ViewsSummary>({ events: [], news: [] });
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const statsRef = React.useRef<DashboardStats | null>(null);
    const mostVisitedRef = React.useRef<AreaVisit[]>([]);
    const recentEventsRef = React.useRef<any[]>([]);
    const recentNewsRef = React.useRef<any[]>([]);
    const activeUsersRef = React.useRef<number>(0);
    const viewsSummaryRef = React.useRef<ViewsSummary>({ events: [], news: [] });

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(() => {
            loadActiveUsers();
            setLastUpdate(new Date());
        }, 30000);
        return () => clearInterval(interval);
    }, []);

    const loadActiveUsers = async () => {
        try {
            const res = await api.get('/statistics/active-users');
            const val = res.data?.activeNow || 0;
            setActiveUsers(val);
            activeUsersRef.current = val;
        } catch { /* silencioso */ }
    };

    const buildEmptyDays = (n: number): VisitsByDate[] =>
        Array.from({ length: n }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (n - 1 - i));
            return { date: d.toISOString().split('T')[0], visits: 0 };
        });

    const formatTickDate = (d: any): string => {
        if (!d || d === 'auto') return '';
        const date = typeof d === 'string'
            ? new Date(d.length === 10 ? d + 'T00:00:00' : d)
            : new Date(d);
        if (isNaN(date.getTime())) return String(d);
        return `${date.getDate()}/${date.getMonth() + 1}`;
    };

    const formatTooltipDate = (d: any): string => {
        if (!d) return '';
        const date = typeof d === 'string'
            ? new Date(d.length === 10 ? d + 'T00:00:00' : d)
            : new Date(d);
        if (isNaN(date.getTime())) return String(d);
        return date.toLocaleDateString('es-CO', {
            weekday: 'short', day: 'numeric', month: 'short'
        });
    };

    const loadDashboardData = async () => {
        try {
            setLoading(true);

            const [users, areas, points, events, news] = await Promise.all([
                usersService.getAll(),
                areasService.getAll(),
                pointsService.getAll(),
                eventsService.getAll(),
                newsService.getAll(),
            ]);

            const dashStats: DashboardStats = {
                totalUsers: users.length,
                totalAreas: areas.length,
                totalPoints: points.length,
                totalEvents: events.length,
                totalNews: news.length,
                activeUsers: users.filter((u: any) => u.isActive).length,
                publishedEvents: events.filter((e: any) => e.isPublished).length,
                publishedNews: news.filter((n: any) => n.isPublished).length,
            };
            setStats(dashStats);
            statsRef.current = dashStats;

            // Eventos recientes
            const sortedEvents = [...events]
                .sort((a: any, b: any) =>
                    new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
                )
                .slice(0, 10);
            setRecentEvents(sortedEvents);
            recentEventsRef.current = sortedEvents;

            // Noticias recientes
            const sortedNews = [...news]
                .sort((a: any, b: any) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                )
                .slice(0, 10);
            setRecentNews(sortedNews);
            recentNewsRef.current = sortedNews;

            try {
                const [areasData, visitsData, activeData, viewsData] = await Promise.all([
                    statisticsService.getMostVisitedAreas(8),
                    statisticsService.getVisitsByDate(7),
                    api.get('/statistics/active-users'),
                    api.get('/statistics/views/summary'),
                ]);

                const normalizedVisits: VisitsByDate[] = (visitsData || []).map((v: any) => ({
                    date: v.date instanceof Date
                        ? v.date.toISOString().split('T')[0]
                        : typeof v.date === 'string' && v.date.length > 10
                            ? v.date.split('T')[0]
                            : String(v.date),
                    visits: parseInt(v.visits) || 0,
                }));

                const areasFinal = areasData.length > 0
                    ? areasData
                    : areas.slice(0, 8).map((a: any) => ({
                        areaId: a.id, areaName: a.name, visitCount: 0, percentage: 0,
                    }));

                setMostVisitedAreas(areasFinal);
                mostVisitedRef.current = areasFinal;
                setVisitsByDate(normalizedVisits.length > 0 ? normalizedVisits : buildEmptyDays(7));

                const activeVal = activeData.data?.activeNow || 0;
                setActiveUsers(activeVal);
                activeUsersRef.current = activeVal;

                const views = viewsData.data || { events: [], news: [] };
                setViewsSummary(views);
                viewsSummaryRef.current = views;

            } catch {
                const fallbackAreas = areas.slice(0, 8).map((a: any) => ({
                    areaId: a.id, areaName: a.name, visitCount: 0, percentage: 0,
                }));
                setMostVisitedAreas(fallbackAreas);
                mostVisitedRef.current = fallbackAreas;
                setVisitsByDate(buildEmptyDays(7));
            }

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // ── PDF ───────────────────────────────────────────────────────
    const handleDownloadPDF = () => {
        const now = new Date().toLocaleDateString('es-CO', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
        const s = statsRef.current;
        const vs = viewsSummaryRef.current;
        const mv = mostVisitedRef.current;
        const re = recentEventsRef.current;
        const rn = recentNewsRef.current;
        const au = activeUsersRef.current;

        const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Campus Virtual UDEC</title>
  <style>
    body  { font-family: Arial, sans-serif; padding: 40px; color: #333; }
    h1    { color: #1b5e20; border-bottom: 3px solid #2e7d32; padding-bottom: 8px; }
    h2    { color: #2e7d32; margin-top: 28px; font-size: 16px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 13px; }
    th    { background: #2e7d32; color: #fff; padding: 8px 12px; text-align: left; }
    td    { padding: 8px 12px; border-bottom: 1px solid #e0e0e0; }
    tr:nth-child(even) { background: #f9f9f9; }
    .meta { color: #888; font-size: 12px; margin-bottom: 24px; }
    .badge { background: #e8f5e9; color: #2e7d32; padding: 2px 8px;
             border-radius: 10px; font-size: 11px; font-weight: 600; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <h1>📊 Reporte del Sistema — Campus Virtual UDEC</h1>
  <p class="meta">Generado el: ${now}<br>Universidad de Cundinamarca — Extensión Facatativá</p>

  <h2>Resumen General</h2>
  <table>
    <tr><th>Indicador</th><th>Valor</th></tr>
    <tr><td>Total Usuarios</td><td>${s?.totalUsers || 0}</td></tr>
    <tr><td>Usuarios Activos</td><td>${s?.activeUsers || 0}</td></tr>
    <tr><td>En el Recorrido Ahora</td><td>${au}</td></tr>
    <tr><td>Áreas del Campus</td><td>${s?.totalAreas || 0}</td></tr>
    <tr><td>Puntos de Interés</td><td>${s?.totalPoints || 0}</td></tr>
    <tr><td>Eventos Publicados</td><td>${s?.publishedEvents || 0} / ${s?.totalEvents || 0}</td></tr>
    <tr><td>Noticias Publicadas</td><td>${s?.publishedNews || 0} / ${s?.totalNews || 0}</td></tr>
  </table>

  <h2>Zonas Más Visitadas</h2>
  <table>
    <tr><th>#</th><th>Zona</th><th>Visitas</th><th>% del Total</th></tr>
    ${mv.map((a, i) => `
    <tr><td>${i + 1}</td><td>${a.areaName}</td><td>${a.visitCount}</td>
    <td><span class="badge">${a.percentage}%</span></td></tr>`).join('')
            || '<tr><td colspan="4" style="color:#aaa">Sin datos</td></tr>'}
  </table>

  <h2>Eventos Vistos</h2>
  <table>
    <tr><th>Título</th><th>Fecha</th><th>Punto de Interés</th><th>Categoría</th><th>Estado</th><th>Vistas</th></tr>
    ${re.map(e => {
                const vInfo = vs.events.find(v => v.entityId === e.id);
                const views = vInfo?.views || 0;
                return `<tr>
          <td>${e.title}</td>
          <td>${e.eventDate ? new Date(e.eventDate + 'T00:00:00').toLocaleDateString('es-CO') : '—'}</td>
          <td>${e.pointOfInterest?.title || e.area?.name || '—'}</td>
          <td><span class="badge">${e.category || '—'}</span></td>
          <td>${e.isPublished ? 'Publicado' : 'Borrador'}</td>
          <td>${views} ${views === 1 ? 'vista' : 'vistas'}</td>
        </tr>`;
            }).join('') || '<tr><td colspan="6" style="color:#aaa">Sin eventos</td></tr>'}
  </table>

  <h2>Noticias Vistas</h2>
  <table>
    <tr><th>Título</th><th>Categoría</th><th>Área</th><th>Fecha pub.</th><th>Estado</th><th>Vistas</th></tr>
    ${rn.map(n => {
                const vInfo = vs.news.find(v => v.entityId === n.id);
                const views = vInfo?.views || 0;
                return `<tr>
          <td>${n.title}</td>
          <td>${n.category || '—'}</td>
          <td>${n.area?.name || '—'}</td>
          <td>${n.publishDate || n.createdAt ? new Date(n.publishDate || n.createdAt).toLocaleDateString('es-CO') : '—'}</td>
          <td>${n.isPublished ? 'Publicado' : 'Borrador'}</td>
          <td>${views} ${views === 1 ? 'vista' : 'vistas'}</td>
        </tr>`;
            }).join('') || '<tr><td colspan="6" style="color:#aaa">Sin noticias</td></tr>'}
  </table>
</body>
</html>`;

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const win = window.open(url, '_blank');
        if (win) {
            win.onload = () => {
                setTimeout(() => { win.print(); URL.revokeObjectURL(url); }, 500);
            };
        }
    };

    if (loading) {
        return (
            <div className="dashboard-content">
                <div style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    height: 300, gap: 16, color: '#666'
                }}>
                    <div style={{
                        width: 40, height: 40, border: '3px solid #eee',
                        borderTopColor: '#2e7d32', borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite'
                    }} />
                    <p>Cargando estadísticas...</p>
                </div>
            </div>
        );
    }

    const pieData = [
        { name: 'Puntos de Interés', value: stats?.totalPoints || 0 },
        { name: 'Eventos', value: stats?.totalEvents || 0 },
        { name: 'Noticias', value: stats?.totalNews || 0 },
        { name: 'Áreas', value: stats?.totalAreas || 0 },
    ];

    const categoryStyle = (cat: string) => {
        const map: Record<string, { bg: string; color: string }> = {
            DEPORTIVO: { bg: '#e8f5e9', color: '#2e7d32' },
            ACADEMICO: { bg: '#e3f2fd', color: '#1565c0' },
            CULTURAL: { bg: '#f3e5f5', color: '#6a1b9a' },
            SOCIAL: { bg: '#fff3e0', color: '#e65100' },
        };
        return map[cat] || { bg: '#f5f5f5', color: '#555' };
    };

    // ── Helper: badge de vistas ────────────────────────────────────
    const viewsBadge = (views: number) => (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: views > 0 ? '#e3f2fd' : '#f5f5f5',
            color: views > 0 ? '#1565c0' : '#bbb',
            padding: '3px 12px', borderRadius: 12,
            fontSize: 12, fontWeight: 600,
            border: `1px solid ${views > 0 ? '#90caf9' : '#e0e0e0'}`,
            minWidth: 70, justifyContent: 'center'
        }}>
            {views}
        </span>
    );

    const thStyle = {
        textAlign: 'left' as const,
        padding: '10px 12px',
        color: '#555', fontWeight: 600, fontSize: 13
    };

    const tdStyle = (extra: React.CSSProperties = {}) => ({
        padding: '11px 12px', ...extra
    });

    return (
        <div className="dashboard-content">

            {/* ── Header ───────────────────────────────────────── */}
            <div className="dashboard-header">
                <div>
                    <h1>Panel de Administración</h1>
                    <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                        Campus Virtual UDEC — última actualización:{' '}
                        {lastUpdate.toLocaleTimeString('es-CO')}
                    </p>
                </div>
                <button onClick={loadDashboardData} style={{
                    background: '#2e7d32', color: '#fff', border: 'none',
                    borderRadius: 8, padding: '8px 18px', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600
                }}>
                    🔄 Actualizar
                </button>
            </div>

            {/* ── Tarjetas ─────────────────────────────────────── */}
            <div className="stats-grid">
                {[
                    { icon: '👥', label: 'Usuarios', num: stats?.totalUsers || 0, sub: `${stats?.activeUsers || 0} activos`, grad: '#667eea,#764ba2' },
                    { icon: '🏛️', label: 'Áreas', num: stats?.totalAreas || 0, sub: 'del campus', grad: '#f093fb,#f5576c' },
                    { icon: '📍', label: 'Punto de Interés', num: stats?.totalPoints || 0, sub: 'en el recorrido', grad: '#4facfe,#00f2fe' },
                    { icon: '📅', label: 'Eventos', num: stats?.totalEvents || 0, sub: `${stats?.publishedEvents || 0} publicados`, grad: '#43e97b,#38f9d7' },
                    { icon: '📰', label: 'Noticias', num: stats?.totalNews || 0, sub: `${stats?.publishedNews || 0} publicadas`, grad: '#fa709a,#fee140' },
                    { icon: '🟢', label: 'En el Recorrido', num: activeUsers, sub: 'usuarios ahora', grad: '#11998e,#38ef7d' },
                ].map(c => (
                    <div key={c.label} className="stat-card">
                        <div className="stat-icon" style={{ background: `linear-gradient(135deg,${c.grad})` }}>
                            {c.icon}
                        </div>
                        <div className="stat-info">
                            <h3>{c.label}</h3>
                            <p className="stat-number">{c.num}</p>
                            <span className="stat-label">{c.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Gráficas ─────────────────────────────────────── */}
            <div className="charts-grid">

                {/* Zonas más visitadas */}
                <div className="chart-card">
                    <h3>📊 Zonas Más Visitadas</h3>
                    {mostVisitedAreas.every(a => a.visitCount === 0) ? (
                        <div style={{
                            height: 200, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', color: '#bbb', gap: 8
                        }}>
                            <span style={{ fontSize: 36 }}>📭</span>
                            <p style={{ margin: 0, fontSize: 13 }}>Sin visitas registradas aún</p>
                            <p style={{ margin: 0, fontSize: 12, color: '#ccc' }}>
                                Las visitas se registran al explorar el campus 3D
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={mostVisitedAreas}
                                margin={{ top: 10, right: 20, left: 0, bottom: 70 }} barSize={50}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="areaName" angle={-35} textAnchor="end"
                                    height={80} tick={{ fontSize: 12 }} interval={0} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip formatter={(v: any) => [`${v} visitas`, 'Visitas']} />
                                <Bar dataKey="visitCount" name="Visitas" radius={[4, 4, 0, 0]}>
                                    {mostVisitedAreas.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Visitas por día */}
                <div className="chart-card">
                    <h3>📈 Visitas por Día (Últimos 7 días)</h3>
                    {visitsByDate.every(v => v.visits === 0) ? (
                        <div style={{
                            height: 200, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', color: '#bbb', gap: 8
                        }}>
                            <span style={{ fontSize: 36 }}>📉</span>
                            <p style={{ margin: 0, fontSize: 13 }}>Sin visitas en los últimos 7 días</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={visitsByDate} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatTickDate} />
                                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                                <Tooltip labelFormatter={formatTooltipDate}
                                    formatter={(v: any) => [`${v} visitas`, 'Visitas']} />
                                <Legend />
                                <Line type="monotone" dataKey="visits" stroke="#2e7d32"
                                    strokeWidth={2} dot={{ fill: '#2e7d32', r: 4 }}
                                    activeDot={{ r: 6 }} name="Visitas" />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Distribución de contenido */}
                <div className="chart-card">
                    <h3>🥧 Distribución de Contenido</h3>
                    {pieData.every(d => d.value === 0) ? (
                        <div style={{
                            height: 200, display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center', color: '#bbb', gap: 8
                        }}>
                            <span style={{ fontSize: 36 }}>📊</span>
                            <p style={{ margin: 0, fontSize: 13 }}>Sin contenido registrado</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie data={pieData.filter(d => d.value > 0)}
                                    cx="50%" cy="50%" labelLine={false}
                                    label={({ name, percent }) =>
                                        percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                                    outerRadius={100} dataKey="value">
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v: any, name: any) => [`${v}`, name]} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

            </div>

            {/* ── Visualizaciones de Contenido ─────────────────── */}
            <div className="chart-card" style={{ marginTop: 24 }}>

                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: 24
                }}>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0' }}> Visualizaciones de Contenido</h3>
                        <p style={{ margin: 0, fontSize: 13, color: '#888' }}>
                            Usuarios únicos que expandieron cada contenido en el recorrido virtual
                        </p>
                    </div>
                    <button onClick={handleDownloadPDF} style={{
                        background: '#2D8659', color: '#fff', border: 'none',
                        borderRadius: 8, padding: '10px 22px', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, flexShrink: 0,
                        display: 'flex', alignItems: 'center', gap: 8
                    }}>
                        📄 Descargar Reporte PDF
                    </button>
                </div>

                {/* ── Tabla Eventos Vistos ─────────────────────── */}
                <h4 style={{ color: '#2e7d32', marginBottom: 12, fontWeight: 600 }}>
                    📅 Eventos Vistos
                </h4>
                {recentEvents.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0', fontSize: 13, marginBottom: 32 }}>
                        <p style={{ margin: 0 }}>Sin eventos registrados</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, marginBottom: 32 }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                                {['Título', 'Fecha', 'Punto de Interés', 'Categoría', 'Estado', ' Vistas'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentEvents.map((e: any, i) => {
                                const cs = categoryStyle(e.category);
                                const vInfo = viewsSummary.events.find(v => v.entityId === e.id);
                                const views = vInfo?.views || 0;
                                return (
                                    <tr key={e.id} style={{
                                        borderBottom: '1px solid #f5f5f5',
                                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                                    }}>
                                        <td style={tdStyle({ fontWeight: 600, color: '#222' })}>
                                            {e.title}
                                        </td>
                                        <td style={tdStyle({ color: '#666', fontSize: 13 })}>
                                            {e.eventDate
                                                ? new Date(e.eventDate + 'T00:00:00').toLocaleDateString('es-CO', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })
                                                : '—'}
                                        </td>
                                        <td style={tdStyle({ color: '#555', fontSize: 13 })}>
                                            {e.pointOfInterest?.title
                                                ? <span>📍 {e.pointOfInterest.title}</span>
                                                : e.area?.name
                                                    ? <span>🏛️ {e.area.name}</span>
                                                    : <span style={{ color: '#bbb' }}>—</span>}
                                        </td>
                                        <td style={tdStyle()}>
                                            {e.category
                                                ? <span style={{
                                                    background: cs.bg, color: cs.color,
                                                    padding: '3px 10px', borderRadius: 12,
                                                    fontSize: 12, fontWeight: 700,
                                                }}>{e.category}</span>
                                                : <span style={{ color: '#bbb' }}>—</span>}
                                        </td>
                                        <td style={tdStyle()}>
                                            <span style={{
                                                background: e.isPublished ? '#e8f5e9' : '#fafafa',
                                                color: e.isPublished ? '#2e7d32' : '#999',
                                                padding: '3px 10px', borderRadius: 12,
                                                fontSize: 12, fontWeight: 600,
                                                border: `1px solid ${e.isPublished ? '#a5d6a7' : '#ddd'}`,
                                            }}>
                                                {e.isPublished ? '✅ Publicado' : '⏸ Borrador'}
                                            </span>
                                        </td>
                                        <td style={tdStyle()}>
                                            {viewsBadge(views)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* ── Tabla Noticias Vistas ────────────────────── */}
                <h4 style={{ color: '#1565c0', marginBottom: 12, fontWeight: 600 }}>
                    📰 Noticias Vistas
                </h4>
                {recentNews.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#bbb', padding: '20px 0', fontSize: 13 }}>
                        <p style={{ margin: 0 }}>Sin noticias registradas</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #f0f0f0', background: '#fafafa' }}>
                                {['Título', 'Categoría', 'Área', 'Fecha pub.', 'Estado', ' Vistas'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {recentNews.map((n: any, i) => {
                                const vInfo = viewsSummary.news.find(v => v.entityId === n.id);
                                const views = vInfo?.views || 0;
                                return (
                                    <tr key={n.id} style={{
                                        borderBottom: '1px solid #f5f5f5',
                                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                                    }}>
                                        <td style={tdStyle({ fontWeight: 600, color: '#222' })}>
                                            {n.title}
                                        </td>
                                        <td style={tdStyle()}>
                                            {n.category
                                                ? <span style={{
                                                    background: '#e3f2fd', color: '#1565c0',
                                                    padding: '3px 10px', borderRadius: 12,
                                                    fontSize: 12, fontWeight: 700,
                                                }}>{n.category}</span>
                                                : <span style={{ color: '#bbb' }}>—</span>}
                                        </td>
                                        <td style={tdStyle({ color: '#555', fontSize: 13 })}>
                                            {n.area?.name
                                                ? <span>🏛️ {n.area.name}</span>
                                                : <span style={{ color: '#bbb' }}>—</span>}
                                        </td>
                                        <td style={tdStyle({ color: '#666', fontSize: 13 })}>
                                            {n.publishDate || n.createdAt
                                                ? new Date(n.publishDate || n.createdAt).toLocaleDateString('es-CO', {
                                                    day: '2-digit', month: 'short', year: 'numeric'
                                                })
                                                : '—'}
                                        </td>
                                        <td style={tdStyle()}>
                                            <span style={{
                                                background: n.isPublished ? '#e8f5e9' : '#fafafa',
                                                color: n.isPublished ? '#2e7d32' : '#999',
                                                padding: '3px 10px', borderRadius: 12,
                                                fontSize: 12, fontWeight: 600,
                                                border: `1px solid ${n.isPublished ? '#a5d6a7' : '#ddd'}`,
                                            }}>
                                                {n.isPublished ? '✅ Publicado' : '⏸ Borrador'}
                                            </span>
                                        </td>
                                        <td style={tdStyle()}>
                                            {viewsBadge(views)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}

                {/* Leyenda */}
                <div style={{
                    marginTop: 14, padding: '8px 12px', background: '#f9f9f9',
                    borderRadius: 8, fontSize: 12, color: '#888',
                    display: 'flex', alignItems: 'center', gap: 6
                }}>
                    <span>ℹ️</span>
                    <span>
                        Las visualizaciones cuentan usuarios únicos que presionaron{' '}
                        <strong>"Ver más"</strong> en el panel del recorrido virtual.
                    </span>
                </div>
            </div>

        </div>
    );
};

export default DashboardHome;