import React, { useEffect, useState } from 'react';
import { newsService, News, CreateNewsDto } from '@/services/newsService';
import { areasService, Area } from '@/services/areasService';

// ── Hook: cerrar modal con Escape ─────────────────────────────────────────────
function useEscapeKey(handler: () => void) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handler(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [handler]);
}

// ─── Modal ─────────────────────────────────────────────────────────────
const NewsModal: React.FC<{
    news: News | null;
    areas: Area[];
    onClose: () => void;
    onSave: () => void;
}> = ({ news, areas, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        title:       news?.title       || '',
        summary:     news?.summary     || '',
        content:     news?.content     || '',
        areaId:      news?.areaId      || '',
        category:    news?.category    || '',
        isPublished: news?.isPublished ?? false,
        isFeatured:  news?.isFeatured  ?? false,
        publishDate: news?.publishDate ? news.publishDate.split('T')[0] : '',
    });
    const [saving, setSaving] = useState(false);

    // ✅ Escape via useEffect — sin onKeyDown en div
    useEscapeKey(onClose);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload: CreateNewsDto = {
                title:       formData.title,
                summary:     formData.summary     || undefined,
                content:     formData.content,
                areaId:      formData.areaId      ? Number(formData.areaId) : undefined,
                category:    formData.category    || undefined,
                isPublished: formData.isPublished,
                isFeatured:  formData.isFeatured,
                publishDate: formData.publishDate || undefined,
            };
            if (news) {
                await newsService.update(news.id, payload);
            } else {
                await newsService.create(payload);
            }
            onSave();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Error al guardar la noticia');
        } finally {
            setSaving(false);
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
                aria-labelledby="news-modal-title"
                className="modal-content modal-wide"
                tabIndex={-1}
                style={{ position: 'relative', zIndex: 1 }}
            >
                <div className="modal-header">
                    <h2 id="news-modal-title">{news ? 'Editar Noticia' : 'Nueva Noticia'}</h2>
                    <button type="button" className="modal-close" onClick={onClose}>×</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="ns-title">Título *</label>
                        <input
                            id="ns-title"
                            type="text"
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            required
                            placeholder="Título de la noticia"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ns-summary">Resumen</label>
                        <textarea
                            id="ns-summary"
                            value={formData.summary}
                            onChange={e => setFormData({ ...formData, summary: e.target.value })}
                            rows={2}
                            placeholder="Breve descripción visible en listados..."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="ns-content">Contenido *</label>
                        <textarea
                            id="ns-content"
                            value={formData.content}
                            onChange={e => setFormData({ ...formData, content: e.target.value })}
                            rows={5}
                            required
                            placeholder="Contenido completo de la noticia..."
                        />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="ns-area">Área</label>
                            <select
                                id="ns-area"
                                value={formData.areaId}
                                onChange={e => setFormData({ ...formData, areaId: e.target.value })}
                            >
                                <option value="">Sin área</option>
                                {areas.map(a => (
                                    <option key={a.id} value={a.id}>{a.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="ns-cat">Categoría</label>
                            <select
                                id="ns-cat"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Sin categoría</option>
                                <option value="ACADEMICO">Académico</option>
                                <option value="INSTITUCIONAL">Institucional</option>
                                <option value="CULTURAL">Cultural</option>
                                <option value="INVESTIGACION">Investigación</option>
                                <option value="BIENESTAR">Bienestar</option>
                                <option value="OTRO">Otro</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="ns-date">Fecha publicación</label>
                            <input
                                id="ns-date"
                                type="date"
                                value={formData.publishDate}
                                onChange={e => setFormData({ ...formData, publishDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="ns-pub" className="checkbox-label">
                                <input
                                    id="ns-pub"
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
                                />{' '}
                                Publicar noticia
                            </label>
                        </div>
                        <div className="form-group">
                            <label htmlFor="ns-feat" className="checkbox-label">
                                <input
                                    id="ns-feat"
                                    type="checkbox"
                                    checked={formData.isFeatured}
                                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                                />{' '}
                                Destacar noticia
                            </label>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn btn-primary" disabled={saving}>
                            {saving ? 'Guardando...' : news ? 'Actualizar' : 'Publicar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// ─── Main Component ─────────────────────────────────────────────────────
const NewsManagement: React.FC = () => {
    const [newsList, setNewsList]       = useState<News[]>([]);
    const [areas, setAreas]             = useState<Area[]>([]);
    const [loading, setLoading]         = useState(true);
    const [showModal, setShowModal]     = useState(false);
    const [editingNews, setEditingNews] = useState<News | null>(null);
    const [search, setSearch]           = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [nData, aData] = await Promise.all([
                newsService.getAll(),
                areasService.getAll(),
            ]);
            setNewsList(nData);
            setAreas(aData);
        } catch (err) {
            console.error('Error cargando noticias:', err);
            alert('Error al cargar las noticias');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('¿Eliminar esta noticia?')) return;
        try {
            await newsService.delete(id);
            await loadData();
        } catch {
            alert('Error al eliminar la noticia');
        }
    };

    const filtered = newsList.filter(n =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        (n.category || '').toLowerCase().includes(search.toLowerCase()) ||
        (n.summary  || '').toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return <div className="dashboard-content"><div className="loading-spinner">Cargando noticias...</div></div>;
    }

    return (
        <div className="dashboard-content">
            <div className="content-header">
                <div>
                    <h1>Gestión de Noticias</h1>
                    <p style={{ color: '#8b949e', margin: '4px 0 0', fontSize: '0.85rem' }}>
                        {newsList.length} noticias · {newsList.filter(n => n.isPublished).length} publicadas · {newsList.filter(n => n.isFeatured).length} destacadas
                    </p>
                </div>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => { setEditingNews(null); setShowModal(true); }}
                >
                    + Crear Noticia
                </button>
            </div>

            <div className="search-bar">
                <input
                    type="text"
                    placeholder="🔍 Buscar por título, resumen o categoría..."
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
                            <th>Categoría</th>
                            <th>Área</th>
                            <th>Fecha pub.</th>
                            <th>Destacada</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#8b949e' }}>
                                    {search ? 'No se encontraron noticias con ese criterio' : 'No hay noticias registradas'}
                                </td>
                            </tr>
                        ) : filtered.map(n => (
                            <tr key={n.id}>
                                <td>#{n.id}</td>
                                <td>
                                    <strong>{n.title}</strong>
                                    {n.summary && (
                                        <div style={{ fontSize: '0.75rem', color: '#8b949e', marginTop: '2px' }}>
                                            {n.summary.slice(0, 60)}{n.summary.length > 60 ? '...' : ''}
                                        </div>
                                    )}
                                </td>
                                <td>
                                    {n.category
                                        ? <span className="badge badge-info">{n.category}</span>
                                        : <span style={{ color: '#8b949e' }}>—</span>}
                                </td>
                                <td>{n.area?.name || <span style={{ color: '#8b949e' }}>—</span>}</td>
                                <td>
                                    {n.publishDate
                                        ? new Date(n.publishDate).toLocaleDateString('es-CO')
                                        : <span style={{ color: '#8b949e' }}>—</span>}
                                </td>
                                <td style={{ textAlign: 'center' }}>{n.isFeatured ? '⭐' : '—'}</td>
                                <td>
                                    <span className={`status-badge ${n.isPublished ? 'active' : 'inactive'}`}>
                                        {n.isPublished ? '✅ Publicada' : '📝 Borrador'}
                                    </span>
                                </td>
                                <td>
                                    <div className="action-buttons">
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => { setEditingNews(n); setShowModal(true); }}
                                            title="Editar"
                                        >✏️</button>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-danger"
                                            onClick={() => handleDelete(n.id)}
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
                <NewsModal
                    news={editingNews}
                    areas={areas}
                    onClose={() => setShowModal(false)}
                    onSave={async () => { setShowModal(false); await loadData(); }}
                />
            )}
        </div>
    );
};

export default NewsManagement;
