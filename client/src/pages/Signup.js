import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

// ── Step 1: Registration form ──────────────────────────────────
function RegisterStep({ onSuccess }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            const data = await api('/auth/signup', { body: form });
            onSuccess({ email: form.email, fallbackOtp: data.otp });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <h2>Create account</h2>
            <p className="auth-sub">Join CollabCampus and find your team.</p>

            <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                    <label className="label" htmlFor="name">Full name</label>
                    <input
                        id="name"
                        className="input"
                        placeholder="Ragav"
                        value={form.name}
                        onChange={set('name')}
                        required
                        autoFocus
                        autoComplete="name"
                    />
                </div>

                <div className="form-group">
                    <label className="label" htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="input"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={set('email')}
                        required
                        autoComplete="email"
                    />
                </div>

                <div className="form-group">
                    <label className="label" htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        className="input"
                        placeholder="Min. 6 characters"
                        value={form.password}
                        onChange={set('password')}
                        required
                        autoComplete="new-password"
                    />
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Send verification code'}
                </button>
            </form>

            <p className="auth-footer">
                Already have an account?{' '}
                <Link to="/login">Sign in</Link>
            </p>
        </>
    );
}

// ── Step 2: OTP verification ───────────────────────────────────
function OtpStep({ email, fallbackOtp, setUser }) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const refs = useRef([]);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp];
        next[i] = val;
        setOtp(next);
        if (val && i < 5) refs.current[i + 1]?.focus();
    };

    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) {
            refs.current[i - 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...otp];
        text.split('').forEach((c, i) => { next[i] = c; });
        setOtp(next);
        refs.current[Math.min(text.length, 5)]?.focus();
        e.preventDefault();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Enter the full 6-digit code.'); return; }
        setError('');
        setLoading(true);
        try {
            const data = await api('/auth/verify-otp', { body: { email, otp: code } });
            localStorage.setItem('user', JSON.stringify(data.user));
            setUser(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setResending(true);
        setError('');
        setSuccess('');
        try {
            const data = await api('/auth/resend-otp', { body: { email } });
            setSuccess(data.otp ? `Email failed. Use OTP: ${data.otp}` : 'New code sent — check your inbox.');
        } catch (err) {
            setError(err.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <>
            <h2>Check your email</h2>
            <p className="auth-sub">
                We sent a 6-digit code to <strong>{email}</strong>.
                {fallbackOtp && <span style={{ color: 'var(--warning)', display: 'block', marginTop: 4 }}>Email may be delayed — code: <strong>{fallbackOtp}</strong></span>}
            </p>

            <form className="auth-form" onSubmit={handleSubmit}>
                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                <div className="form-group" style={{ alignItems: 'center' }}>
                    <div className="otp-row" onPaste={handlePaste}>
                        {otp.map((digit, i) => (
                            <input
                                key={i}
                                ref={(el) => (refs.current[i] = el)}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                className="otp-input"
                                value={digit}
                                onChange={(e) => handleChange(i, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(i, e)}
                                autoFocus={i === 0}
                            />
                        ))}
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Verify & sign in'}
                </button>
            </form>

            <p className="auth-footer">
                Didn't receive a code?{' '}
                <button
                    className="btn btn-ghost btn-sm"
                    onClick={handleResend}
                    disabled={resending}
                    style={{ display: 'inline-flex', padding: '0 2px', fontSize: '0.83rem', color: 'var(--accent)' }}
                >
                    {resending ? 'Sending…' : 'Resend'}
                </button>
            </p>
        </>
    );
}

// ── Main Signup component ──────────────────────────────────────
export default function Signup({ setUser }) {
    const [step, setStep] = useState('register');
    const [meta, setMeta] = useState({});

    const onRegisterSuccess = ({ email, fallbackOtp }) => {
        setMeta({ email, fallbackOtp });
        setStep('otp');
    };

    return (
        <div className="auth-page">
            <div className="auth-box">
                {step === 'register' ? (
                    <RegisterStep onSuccess={onRegisterSuccess} />
                ) : (
                    <OtpStep email={meta.email} fallbackOtp={meta.fallbackOtp} setUser={setUser} />
                )}
            </div>
        </div>
    );
}
