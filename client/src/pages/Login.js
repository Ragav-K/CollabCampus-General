import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Login({ setUser }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await api('/auth/login', { body: { email, password } });
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Welcome back</h2>
                <p className="auth-sub">Sign in to your CollabCampus account.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="form-group">
                        <label className="label" htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="label" htmlFor="password">Password</label>
                            <Link to="/reset" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Forgot?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Sign in'}
                    </button>
                </form>

                <p className="auth-footer">
                    No account?{' '}
                    <Link to="/signup">Create one</Link>
                </p>
            </div>
        </div>
    );
}
