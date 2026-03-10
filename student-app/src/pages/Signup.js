import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const DEPT_OPTIONS = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
const YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];
const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];
const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI/ML', 'UI/UX Design', 'Marketing', 'PPT/Presentation'];

// ── Shared: Skill Strength Builder ────────────────────────────
function SkillStrengthBuilder({ skills, onChange }) {
    const [input, setInput] = useState('');

    const addSkill = (name) => {
        const trimmed = name.trim();
        if (!trimmed || skills[trimmed]) return;
        onChange({ ...skills, [trimmed]: 3 });
        setInput('');
    };
    const removeSkill = (name) => {
        const next = { ...skills };
        delete next[name];
        onChange(next);
    };
    const setLevel = (name, level) => onChange({ ...skills, [name]: level });

    const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
                <input
                    className="input"
                    placeholder="Add a skill (e.g. React)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(input); } }}
                    style={{ flex: 1 }}
                />
                <button type="button" className="btn btn-outline" onClick={() => addSkill(input)}>Add</button>
            </div>
            {Object.entries(skills).map(([skill, level]) => (
                <div key={skill} className="skill-level-row">
                    <span className="skill-name">{skill}</span>
                    <div className="skill-dots">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button
                                key={n} type="button"
                                className={`skill-dot${level >= n ? ' filled' : ''}`}
                                onClick={() => setLevel(skill, n)}
                                title={LEVEL_LABELS[n]}
                            />
                        ))}
                    </div>
                    <span className="skill-level-label">{LEVEL_LABELS[level]}</span>
                    <button type="button" onClick={() => removeSkill(skill)}
                        style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1 }}>×</button>
                </div>
            ))}
        </div>
    );
}

// ── Shared: Role Multi-Select ──────────────────────────────────
function RoleSelector({ selected, onChange }) {
    const toggle = (role) => {
        onChange(selected.includes(role) ? selected.filter(r => r !== role) : [...selected, role]);
    };
    return (
        <div className="role-chips">
            {ROLE_OPTIONS.map(r => (
                <button key={r} type="button"
                    className={`role-chip${selected.includes(r) ? ' active' : ''}`}
                    onClick={() => toggle(r)}>
                    {r}
                </button>
            ))}
        </div>
    );
}

// ── Step 1: Registration form ──────────────────────────────────
function RegisterStep({ onSuccess }) {
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
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
                    <input id="name" className="input" placeholder="Ragav" value={form.name}
                        onChange={set('name')} required autoFocus autoComplete="name" />
                </div>
                <div className="form-group">
                    <label className="label" htmlFor="email">Email</label>
                    <input id="email" type="email" className="input" placeholder="you@example.com"
                        value={form.email} onChange={set('email')} required autoComplete="email" />
                </div>
                <div className="form-group">
                    <label className="label" htmlFor="password">Password</label>
                    <input id="password" type="password" className="input" placeholder="Min. 6 characters"
                        value={form.password} onChange={set('password')} required autoComplete="new-password" />
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Send verification code'}
                </button>
            </form>
            <p className="auth-footer">
                Already have an account? <Link to="/login">Sign in</Link>
            </p>
        </>
    );
}

// ── Step 2: OTP verification ───────────────────────────────────
function OtpStep({ email, fallbackOtp, onSuccess }) {
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const refs = useRef([]);

    const handleChange = (i, val) => {
        if (!/^\d?$/.test(val)) return;
        const next = [...otp]; next[i] = val; setOtp(next);
        if (val && i < 5) refs.current[i + 1]?.focus();
    };
    const handleKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus();
    };
    const handlePaste = (e) => {
        const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        const next = [...otp]; text.split('').forEach((c, i) => { next[i] = c; });
        setOtp(next); refs.current[Math.min(text.length, 5)]?.focus(); e.preventDefault();
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length < 6) { setError('Enter the full 6-digit code.'); return; }
        setError(''); setLoading(true);
        try {
            const data = await api('/auth/verify-otp', { body: { email, otp: code } });
            onSuccess(data.user); // go to Step 3
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };
    const handleResend = async () => {
        setResending(true); setError(''); setSuccess('');
        try {
            const data = await api('/auth/resend-otp', { body: { email } });
            setSuccess(data.otp ? `Email failed. Use OTP: ${data.otp}` : 'New code sent — check your inbox.');
        } catch (err) { setError(err.message); }
        finally { setResending(false); }
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
                            <input key={i} ref={el => (refs.current[i] = el)} type="text"
                                inputMode="numeric" maxLength={1} className="otp-input"
                                value={digit} onChange={e => handleChange(i, e.target.value)}
                                onKeyDown={e => handleKeyDown(i, e)} autoFocus={i === 0} />
                        ))}
                    </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                    {loading ? <span className="spinner" /> : 'Verify & continue'}
                </button>
            </form>
            <p className="auth-footer">
                Didn't receive a code?{' '}
                <button className="btn btn-ghost btn-sm" onClick={handleResend} disabled={resending}
                    style={{ display: 'inline-flex', padding: '0 2px', fontSize: '0.83rem', color: 'var(--accent)' }}>
                    {resending ? 'Sending…' : 'Resend'}
                </button>
            </p>
        </>
    );
}

// ── Step 3: Profile Setup ──────────────────────────────────────
function ProfileStep({ user, setUser }) {
    const [form, setForm] = useState({ dept: '', year: '', gender: '', preferredRoles: [], skillStrengths: {}, hackathonInterests: [] });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api('/auth/profile', { method: 'PATCH', body: { email: user.email, ...form } });
            localStorage.setItem('user', JSON.stringify(user));
            setUser(user);
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <>
            <h2>Set up your profile</h2>
            <p className="auth-sub" style={{ marginBottom: 20 }}>
                Help the matching engine find you the best team.
            </p>
            {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <label className="label">Department</label>
                        <select className="select" value={form.dept} onChange={set('dept')}>
                            <option value="">Select dept</option>
                            {DEPT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Year</label>
                        <select className="select" value={form.year} onChange={set('year')}>
                            <option value="">Select year</option>
                            {YEAR_OPTIONS.map(y => <option key={y}>{y}</option>)}
                        </select>
                    </div>
                </div>
                <div className="form-group">
                    <label className="label">Gender</label>
                    <select className="select" value={form.gender} onChange={set('gender')}>
                        <option value="">Prefer not to say</option>
                        {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label className="label">Preferred Roles</label>
                    <span className="hint">Select all that apply</span>
                    <RoleSelector selected={form.preferredRoles}
                        onChange={roles => setForm(f => ({ ...f, preferredRoles: roles }))} />
                </div>

                <div className="form-group">
                    <label className="label">Skills & Strength</label>
                    <span className="hint">Add skills, then rate your level (1 = Beginner, 5 = Expert)</span>
                    <SkillStrengthBuilder skills={form.skillStrengths}
                        onChange={s => setForm(f => ({ ...f, skillStrengths: s }))} />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Save profile'}
                    </button>
                    <button type="button" className="btn btn-ghost" onClick={() => { localStorage.setItem('user', JSON.stringify(user)); setUser(user); }}>
                        Skip for now
                    </button>
                </div>
            </form>
        </>
    );
}

// ── Main Signup component ──────────────────────────────────────
export default function Signup({ setUser }) {
    const [step, setStep] = useState('register');
    const [meta, setMeta] = useState({});

    const onRegisterSuccess = ({ email, fallbackOtp }) => { setMeta({ email, fallbackOtp }); setStep('otp'); };
    const onOtpSuccess = (user) => { setMeta(m => ({ ...m, user })); setStep('profile'); };

    return (
        <div className="auth-page">
            <div className="auth-box" style={{ maxWidth: step === 'profile' ? 520 : 400 }}>
                {step === 'register' && <RegisterStep onSuccess={onRegisterSuccess} />}
                {step === 'otp' && <OtpStep email={meta.email} fallbackOtp={meta.fallbackOtp} onSuccess={onOtpSuccess} />}
                {step === 'profile' && <ProfileStep user={meta.user} setUser={setUser} />}
            </div>
        </div>
    );
}
