import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | done | error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('loading');
        try {
            await api('/auth/forgot-password', { body: { email } });
            setStatus('done');
        } catch (err) {
            setMessage(err.message);
            setStatus('error');
        }
    };

    if (status === 'done') {
        return (
            <div className="auth-page">
                <div className="auth-box">
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2.5rem', marginBottom: 16 }}>📬</div>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Check your inbox</h2>
                        <p style={{ marginBottom: 24 }}>
                            We sent a password reset link to <strong>{email}</strong>. Follow the link to set a new password.
                        </p>
                        <Link to="/login" className="btn btn-outline btn-full">Back to sign in</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-box">
                <h2>Reset password</h2>
                <p className="auth-sub">Enter your email and we'll send you a reset link.</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {status === 'error' && <div className="alert alert-error">{message}</div>}

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
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={status === 'loading'}>
                        {status === 'loading' ? <span className="spinner" /> : 'Send reset link'}
                    </button>
                </form>

                <p className="auth-footer">
                    <Link to="/login">← Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}
