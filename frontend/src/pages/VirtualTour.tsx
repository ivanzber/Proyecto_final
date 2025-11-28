import React from 'react';
import Unity3DPlaceholder from '@/components/Unity3DPlaceholder';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import './VirtualTour.css';

const VirtualTour: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuthStore();

    const handleAdminAccess = () => {
        if (isAuthenticated) {
            if (user?.role === 'ADMIN') {
                navigate('/admin');
            } else if (user?.role === 'SUBADMIN') {
                navigate('/subadmin');
            }
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="virtual-tour-page">
            {/* Navbar */}
            <nav className="tour-navbar">
                <div className="navbar-content">
                    <div className="navbar-brand">
                        <span className="brand-icon">🎓</span>
                        <span className="brand-text">Campus Virtual UDEC</span>
                    </div>

                    <div className="navbar-actions">
                        {isAuthenticated ? (
                            <>
                                <span className="welcome-text">
                                    Hola, {user?.firstName} ({user?.role})
                                </span>
                                <button className="btn btn-primary" onClick={handleAdminAccess}>
                                    Panel de Control
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-outline" onClick={() => navigate('/login')}>
                                Acceso Administrativo
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-title">Recorrido Virtual 3D</h1>
                    <p className="hero-subtitle">
                        Explora el Campus de la Universidad de Cundinamarca - Extensión Facatativá
                    </p>
                </div>
            </div>

            {/* Unity 3D Placeholder */}
            <Unity3DPlaceholder />

            {/* Footer Info */}
            <div className="tour-footer">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-section">
                            <h3>Universidad de Cundinamarca</h3>
                            <p>Extensión Facatativá</p>
                            <p>Sistema de Recorrido Virtual 3D</p>
                        </div>
                        <div className="footer-section">
                            <h3>Navegación</h3>
                            <p>🖱️ Click en los puntos para más información</p>
                            <p>⌨️ Usa las flechas para moverte</p>
                            <p>🔍 Haz zoom con la rueda del mouse</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VirtualTour;
