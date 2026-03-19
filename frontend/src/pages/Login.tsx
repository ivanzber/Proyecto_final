import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { authService } from '@/services/authService';
import logoUdec from '@/assets/images/logo-udec.png';
import './Login.css';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const { setAuth } = useAuthStore();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await authService.login({ email, password });
            setAuth(response.user, response.accessToken);

            // Redirigir según el rol
            if (response.user.role === 'ADMIN') {
                navigate('/admin');
            } else if (response.user.role === 'SUBADMIN') {
                navigate('/subadmin');
            } else {
                navigate('/');
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-header">
                    <div className="logo">
                        <img src={logoUdec} alt="Logo UDEC" className="logo-icon" />
                        <h1>Campus Virtual UDEC</h1>
                        <p>Universidad de Cundinamarca - Extensión Facatativá</p>
                    </div>
                </div>

                <div className="login-card glass">
                    <h2>Iniciar Sesión</h2>
                    <p className="subtitle">Accede al panel de administración</p>

                    {error && (
                        <div className="alert error">
                            <span>⚠️</span>
                            <p>{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="email">Correo Electrónico</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuario@udec.edu.co"
                                required
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                disabled={loading}
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <button className="btn-text" onClick={() => navigate('/')}>
                            ← Volver al recorrido virtual
                        </button>
                    </div>


                </div>
            </div>
        </div>
    );
};

export default Login;
