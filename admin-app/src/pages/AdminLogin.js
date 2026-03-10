import React, { useState } from 'react';
import { api } from '../api';

export default function AdminLogin({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !password.trim()) { setError('Both fields are required'); return; }
        setLoading(true);
        try {
            const res = await api('/api/admin/login', {
                method: 'POST',
                body: { email, password },
            });
            onLogin(res.adminToken);
        } catch (err) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-box">
                <div className="admin-login-logo">🛡️</div>
                <h1>Admin Login</h1>
                <p className="admin-login-sub">CollabCampus Dashboard</p>

                {error && <div className="admin-alert admin-alert-error">{error}</div>}

                <form onSubmit={handleSubmit} className="admin-form">
                    <div className="admin-form-group">
                        <label className="admin-label">Email</label>
                        <input
                            type="email"
                            className="admin-input"
                            placeholder="admin@collabcampus.in"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>
                    <div className="admin-form-group">
                        <label className="admin-label">Password</label>
                        <input
                            type="password"
                            className="admin-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="admin-btn admin-btn-primary" disabled={loading} style={{ marginTop: 4 }}>
                        {loading ? <span className="admin-spinner" /> : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}
