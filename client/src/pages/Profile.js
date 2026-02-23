import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const DEPT_OPTIONS = ['CSE', 'IT', 'ECE', 'EEE', 'Mechanical', 'Civil', 'Other'];
const YEAR_OPTIONS = ['I', 'II', 'III', 'IV'];
const GENDER_OPTIONS = ['Male', 'Female', 'Prefer not to say'];
const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI/ML', 'UI/UX Design', 'Marketing', 'PPT/Presentation'];
const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

function SkillStrengthBuilder({ skills, onChange }) {
    const [input, setInput] = useState('');
    const addSkill = (name) => {
        const t = name.trim(); if (!t || skills[t]) return;
        onChange({ ...skills, [t]: 3 }); setInput('');
    };
    const removeSkill = (name) => { const n = { ...skills }; delete n[name]; onChange(n); };
    const setLevel = (name, level) => onChange({ ...skills, [name]: level });

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" placeholder="Add a skill (e.g. React)" value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(input); } }}
                    style={{ flex: 1 }} />
                <button type="button" className="btn btn-outline" onClick={() => addSkill(input)}>Add</button>
            </div>
            {Object.entries(skills).map(([skill, level]) => (
                <div key={skill} className="skill-level-row">
                    <span className="skill-name">{skill}</span>
                    <div className="skill-dots">
                        {[1, 2, 3, 4, 5].map(n => (
                            <button key={n} type="button"
                                className={`skill-dot${level >= n ? ' filled' : ''}`}
                                onClick={() => setLevel(skill, n)} title={LEVEL_LABELS[n]} />
                        ))}
                    </div>
                    <span className="skill-level-label">{LEVEL_LABELS[level]}</span>
                    <button type="button" onClick={() => removeSkill(skill)}
                        style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1 }}>×</button>
                </div>
            ))}
            {Object.keys(skills).length === 0 && (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No skills added yet. Type a skill above and press Enter.
                </p>
            )}
        </div>
    );
}

function RoleSelector({ selected, onChange }) {
    const toggle = (r) => onChange(selected.includes(r) ? selected.filter(x => x !== r) : [...selected, r]);
    return (
        <div className="role-chips">
            {ROLE_OPTIONS.map(r => (
                <button key={r} type="button"
                    className={`role-chip${selected.includes(r) ? ' active' : ''}`}
                    onClick={() => toggle(r)}>{r}</button>
            ))}
        </div>
    );
}

export default function Profile({ user, setUser }) {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        dept: user?.dept || '',
        year: user?.year || '',
        gender: user?.gender || '',
        preferredRoles: user?.preferredRoles || [],
        skillStrengths: user?.skillStrengths || {},
        hackathonInterests: user?.hackathonInterests || [],
    });
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setSaved(false); setError('');
        try {
            await api('/auth/profile', { method: 'PATCH', body: { email: user.email, ...form } });
            const updated = { ...user, ...form };
            localStorage.setItem('user', JSON.stringify(updated));
            setUser(updated);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    if (!user) { navigate('/login'); return null; }

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 680 }}>
                <div style={{ marginBottom: 32 }}>
                    <h2 style={{ marginBottom: 4 }}>My Profile</h2>
                    <p>Your profile powers the matching engine. The more complete it is, the better your compatibility scores.</p>
                </div>

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
                {saved && <div className="alert alert-success" style={{ marginBottom: 20 }}>✓ Profile saved successfully.</div>}

                <form onSubmit={handleSubmit}>
                    {/* ── Personal Info ── */}
                    <div className="profile-section">
                        <p className="profile-section-title">Personal Info</p>
                        <div className="card" style={{ padding: 24 }}>
                            <div className="form-row" style={{ marginBottom: 16 }}>
                                <div className="form-group">
                                    <label className="label">Full Name</label>
                                    <input className="input" value={user.name} readOnly
                                        style={{ background: '#f4f4f5', cursor: 'default' }} />
                                </div>
                                <div className="form-group">
                                    <label className="label">Email</label>
                                    <input className="input" value={user.email} readOnly
                                        style={{ background: '#f4f4f5', cursor: 'default' }} />
                                </div>
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="label">Department</label>
                                    <select className="select" value={form.dept} onChange={set('dept')}>
                                        <option value="">Select department</option>
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
                            <div className="form-group" style={{ marginTop: 16 }}>
                                <label className="label">Gender</label>
                                <select className="select" value={form.gender} onChange={set('gender')}>
                                    <option value="">Prefer not to say</option>
                                    {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* ── Matching Profile ── */}
                    <div className="profile-section">
                        <p className="profile-section-title">Matching Profile</p>
                        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div className="form-group">
                                <label className="label">Preferred Roles</label>
                                <span className="hint">What you enjoy doing in a hackathon team</span>
                                <div style={{ marginTop: 8 }}>
                                    <RoleSelector selected={form.preferredRoles}
                                        onChange={roles => setForm(f => ({ ...f, preferredRoles: roles }))} />
                                </div>
                            </div>
                            <div className="form-group">
                                <label className="label">Skills & Strength Level</label>
                                <span className="hint">1 = Beginner &nbsp;•&nbsp; 5 = Expert. Click dots to rate.</span>
                                <div style={{ marginTop: 8 }}>
                                    <SkillStrengthBuilder skills={form.skillStrengths}
                                        onChange={s => setForm(f => ({ ...f, skillStrengths: s }))} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── How Matching Works ── */}
                    <div className="profile-section">
                        <p className="profile-section-title">How your score is computed</p>
                        <div className="card" style={{ padding: 24 }}>
                            {[
                                ['35%', 'Skill Coverage', 'How many of the team\'s required skills you fill, with a bonus for rare skills and a penalty for redundant ones.'],
                                ['20%', 'Diversity (Simpson Index)', 'A mathematical diversity score based on department distribution — rewards cross-dept teams.'],
                                ['15%', 'Experience Balance', 'Standard deviation of year values — higher σ = more balanced seniority mix.'],
                                ['15%', 'Gender Match', 'Whether you match the team\'s gender preference, if any is specified.'],
                                ['15%', 'Role Fit', 'Overlap between your preferred roles and the team\'s required roles.'],
                            ].map(([w, title, desc]) => (
                                <div key={title} style={{ display: 'flex', gap: 14, marginBottom: 14 }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-light)', padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap', alignSelf: 'flex-start', marginTop: 2 }}>{w}</span>
                                    <div>
                                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: 2 }}>{title}</p>
                                        <p style={{ fontSize: '0.8rem', margin: 0 }}>{desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                        {loading ? <span className="spinner" /> : 'Save changes'}
                    </button>
                </form>
            </div>
        </div>
    );
}
