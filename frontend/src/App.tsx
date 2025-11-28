import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import VirtualTour from './pages/VirtualTour';
import AdminDashboard from './pages/admin/Dashboard';
import SubadminDashboard from './pages/subadmin/Dashboard';
import './index.css';

const App: React.FC = () => {
    const { isAuthenticated, user, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
        if (!isAuthenticated) {
            return <Navigate to="/login" replace />;
        }

        if (allowedRoles && user && !allowedRoles.includes(user.role)) {
            return <Navigate to="/" replace />;
        }

        return <>{children}</>;
    };

    return (
        <BrowserRouter>
            <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<VirtualTour />} />

                {/* Admin Routes */}
                <Route
                    path="/admin/*"
                    element={
                        <ProtectedRoute allowedRoles={['ADMIN']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Subadmin Routes */}
                <Route
                    path="/subadmin/*"
                    element={
                        <ProtectedRoute allowedRoles={['SUBADMIN']}>
                            <SubadminDashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};

export default App;
