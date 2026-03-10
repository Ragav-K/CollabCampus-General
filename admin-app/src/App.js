import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useLocation } from 'react-router-dom';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import HackathonManager from './pages/HackathonManager';
import StudentsList from './pages/StudentsList';
import TeamsList from './pages/TeamsList';
import './index.css';

function NavBar({ onLogout }) {
    const location = useLocation();
    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';
    return (
        <nav className="admin-nav">
            <div className="admin-nav-brand">🛡️ CollabCampus Admin</div>
            <div className="admin-nav-links">
                <Link to="/dashboard" className={isActive('/dashboard')}>📊 Dashboard</Link>
                <Link to="/hackathons" className={isActive('/hackathons')}>🏆 Hackathons</Link>
                <Link to="/students" className={isActive('/students')}>👩‍🎓 Students</Link>
                <Link to="/teams" className={isActive('/teams')}>👥 Teams</Link>
            </div>
            <button className="admin-logout" onClick={onLogout}>Logout</button>
        </nav>
    );
}

function ProtectedRoute({ children, isAdmin }) {
    return isAdmin ? children : <Navigate to="/login" replace />;
}

export default function App() {
    const [adminToken, setAdminToken] = useState(() => localStorage.getItem('adminToken'));

    const handleLogin = (token) => {
        localStorage.setItem('adminToken', token);
        setAdminToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('adminToken');
        setAdminToken(null);
    };

    return (
        <Router>
            {adminToken && <NavBar onLogout={handleLogout} />}
            <Routes>
                <Route
                    path="/login"
                    element={adminToken ? <Navigate to="/dashboard" replace /> : <AdminLogin onLogin={handleLogin} />}
                />
                <Route
                    path="/dashboard"
                    element={<ProtectedRoute isAdmin={!!adminToken}><Dashboard /></ProtectedRoute>}
                />
                <Route
                    path="/hackathons"
                    element={<ProtectedRoute isAdmin={!!adminToken}><HackathonManager /></ProtectedRoute>}
                />
                <Route
                    path="/students"
                    element={<ProtectedRoute isAdmin={!!adminToken}><StudentsList /></ProtectedRoute>}
                />
                <Route
                    path="/teams"
                    element={<ProtectedRoute isAdmin={!!adminToken}><TeamsList /></ProtectedRoute>}
                />
                <Route path="*" element={<Navigate to={adminToken ? "/dashboard" : "/login"} replace />} />
            </Routes>
        </Router>
    );
}
