import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const GENDER_OPTIONS = ['No Preference', 'Male', 'Female'];
const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI/ML', 'UI/UX Design', 'Marketing', 'PPT/Presentation'];
const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

const DEFAULT_WEIGHTS = { skill: 35, role: 20, exp: 15, diversity: 20, gender: 10 };

const FACTORS = [
    {
        key: 'skill',
        icon: '⌨️',
        title: 'Skill Compatibility',
        desc: 'How well a member\'s technical skills match your required technologies (React, AI, Backend, ML, etc.).',
        color: '#2563EB',
    },
    {
        key: 'role',
        icon: '🪪',
        title: 'Role Fit',
        desc: 'Whether the member fits the specific role your team needs (Developer, Designer, Presenter, ML Engineer).',
        color: '#7C3AED',
    },
    {
        key: 'exp',
        icon: '🏆',
        title: 'Experience Balance',
        desc: 'Rewards teams with varied seniority levels across years (I–IV) for a balanced senior-junior mix.',
        color: '#D97706',
    },
    {
        key: 'diversity',
        icon: '🌐',
        title: 'Diversity Preference',
        desc: 'Encourages members from different departments and academic years for richer team perspectives.',
        color: '#059669',
    },
    {
        key: 'gender',
        icon: '⚖️',
        title: 'Gender Balance',
        desc: 'Adjust how strongly gender balance influences matching. Set to 0% if not relevant.',
        color: '#DB2777',
    },
];

// ── Weight Slider Card ──────────────────────────────────────────
function FactorSlider({ factor, value, onChange }) {
    return (
        <div className="weight-card" style={{
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10,
            transition: 'box-shadow 0.18s',
        }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.3rem', lineHeight: 1.2 }}>{factor.icon}</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827', marginBottom: 2 }}>{factor.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6B7280', lineHeight: 1.5, maxWidth: 240 }}>{factor.desc}</div>
                    </div>
                </div>
                {/* Numeric input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                    <input
                        type="number" min={0} max={100} value={value}
                        onChange={e => onChange(Math.min(100, Math.max(0, Number(e.target.value))))}
                        style={{
                            width: 52, textAlign: 'center', fontWeight: 700, fontSize: '1rem',
                            color: factor.color, border: '1.5px solid #E5E7EB', borderRadius: 8,
                            padding: '4px 2px', outline: 'none', background: '#F9FAFB',
                        }}
                    />
                    <span style={{ fontSize: '0.85rem', color: '#9CA3AF' }}>%</span>
                </div>
            </div>

            {/* Slider */}
            <input type="range" min={0} max={100} value={value}
                onChange={e => onChange(Number(e.target.value))}
                style={{ accentColor: factor.color, width: '100%', cursor: 'pointer' }} />

            {/* Mini bar */}
            <div style={{ height: 4, borderRadius: 4, background: '#F3F4F6', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${value}%`,
                    background: factor.color, borderRadius: 4,
                    transition: 'width 0.2s ease',
                }} />
            </div>
        </div>
    );
}

// ── Weights Summary Bar ────────────────────────────────────────
function WeightsSummary({ weights }) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const pct = Math.min(total, 100);
    const color = total === 100 ? '#059669' : total > 100 ? '#DC2626' : '#D97706';
    const bgColor = total === 100 ? '#D1FAE5' : total > 100 ? '#FEE2E2' : '#FEF3C7';

    return (
        <div style={{
            border: `1.5px solid ${color}`, borderRadius: 12, padding: '16px 20px',
            background: bgColor, display: 'flex', flexDirection: 'column', gap: 10,
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>Compatibility Weight Summary</span>
                <span style={{ fontWeight: 800, fontSize: '1.05rem', color }}>
                    {total}% / 100%
                </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 8, borderRadius: 8, background: '#E5E7EB', overflow: 'hidden' }}>
                <div style={{
                    height: '100%', width: `${pct}%`, background: color, borderRadius: 8,
                    transition: 'width 0.25s ease, background 0.25s ease',
                }} />
            </div>

            {/* Factor breakdown mini-bars */}
            <div style={{ display: 'flex', height: 6, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
                {FACTORS.map(f => (
                    <div key={f.key} title={`${f.title}: ${weights[f.key]}%`}
                        style={{
                            flex: weights[f.key], background: f.color, minWidth: weights[f.key] > 0 ? 2 : 0,
                            transition: 'flex 0.25s ease',
                        }} />
                ))}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px' }}>
                {FACTORS.map(f => (
                    <span key={f.key} style={{ fontSize: '0.72rem', color: '#6B7280' }}>
                        <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: f.color, marginRight: 4 }} />
                        {f.title.split(' ')[0]}: <strong style={{ color: '#374151' }}>{weights[f.key]}%</strong>
                    </span>
                ))}
            </div>

            {total !== 100 && (
                <div style={{ fontSize: '0.8rem', color: color, fontWeight: 600 }}>
                    {total > 100
                        ? `⚠️ Reduce by ${total - 100}% — total must equal exactly 100%.`
                        : `⚠️ Add ${100 - total}% more — total must equal exactly 100%.`}
                </div>
            )}
            {total === 100 && (
                <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 600 }}>
                    ✓ Perfect — compatibility engine is ready.
                </div>
            )}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────
export default function CreateTeam({ user }) {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        hackathonName: '', hackathonPlace: '', hackathonDate: '',
        lastDate: '', problemStatement: '', maxMembers: '', preferredGender: 'No Preference',
    });
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [requiredRoles, setRequiredRoles] = useState([]);
    const [reqSkills, setReqSkills] = useState({});
    const [reqSkillInput, setReqSkillInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // ── Matching weights state ──
    const [useCustomWeights, setUseCustomWeights] = useState(true);
    const [weights, setWeights] = useState({ ...DEFAULT_WEIGHTS });
    const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);

    const setW = (key, val) => setWeights(w => ({ ...w, [key]: val }));
    const resetWeights = () => setWeights({ ...DEFAULT_WEIGHTS });

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const addSkill = (val) => {
        const parts = val.split(',').map(s => s.trim()).filter(Boolean);
        setSkills(prev => [...prev, ...parts.filter(s => !prev.includes(s))]);
        setSkillInput('');
    };
    const removeSkill = (s) => setSkills(prev => prev.filter(x => x !== s));
    const handleSkillKey = (e) => {
        if (['Enter', 'Tab'].includes(e.key)) { e.preventDefault(); addSkill(skillInput); }
    };
    const toggleRole = (role) => setRequiredRoles(prev =>
        prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    const addReqSkill = (val) => {
        const t = val.trim(); if (!t || reqSkills[t]) return;
        setReqSkills(s => ({ ...s, [t]: 3 })); setReqSkillInput('');
    };
    const removeReqSkill = (s) => { const n = { ...reqSkills }; delete n[s]; setReqSkills(n); };
    const setReqLevel = (s, l) => setReqSkills(prev => ({ ...prev, [s]: l }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setError('');
        if (!form.hackathonName || !form.hackathonDate || !form.lastDate || !form.maxMembers) {
            setError('Please fill in all required fields.'); return;
        }
        if (Number(form.maxMembers) < 2) {
            setError('Team must have at least 2 members.'); return;
        }
        if (useCustomWeights && totalWeight !== 100) {
            setError('Matching weights must total exactly 100% before posting.'); return;
        }
        setLoading(true);
        try {
            await api('/api/teams', {
                body: {
                    ...form,
                    maxMembers: Number(form.maxMembers),
                    skillsNeeded: skills, requiredRoles, requiredSkills: reqSkills,
                    leader: user.email, leaderName: user.name,
                    leaderDept: user.dept || '', leaderYear: user.year || '', leaderGender: user.gender || '',
                    matchingWeights: useCustomWeights ? weights : DEFAULT_WEIGHTS,
                },
            });
            navigate('/created');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const sectionLabel = (text) => (
        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: -4 }}>
            {text}
        </p>
    );

    const isSubmitDisabled = loading || (useCustomWeights && totalWeight !== 100);

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 700 }}>
                <div className="section-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 32 }}>
                    <h2>Create a team</h2>
                    <p>Post your hackathon listing and let teammates find you.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* ── Event details ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {sectionLabel('Event details')}
                        <div className="form-group">
                            <label className="label" htmlFor="hackathonName">Hackathon name *</label>
                            <input id="hackathonName" className="input" placeholder="Smart India Hackathon 2025" value={form.hackathonName} onChange={set('hackathonName')} required />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label" htmlFor="hackathonDate">Hackathon date *</label>
                                <input id="hackathonDate" type="date" className="input" value={form.hackathonDate} onChange={set('hackathonDate')} required />
                            </div>
                            <div className="form-group">
                                <label className="label" htmlFor="lastDate">Application deadline *</label>
                                <input id="lastDate" type="date" className="input" value={form.lastDate} onChange={set('lastDate')} required />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label" htmlFor="hackathonPlace">Venue / Mode</label>
                            <input id="hackathonPlace" className="input" placeholder="Chennai / Online" value={form.hackathonPlace} onChange={set('hackathonPlace')} />
                        </div>
                    </div>

                    <hr className="form-divider" />

                    {/* ── Team preferences ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {sectionLabel('Team preferences')}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="label" htmlFor="maxMembers">Max team size *</label>
                                <input id="maxMembers" type="number" min={2} max={10} className="input" placeholder="4" value={form.maxMembers} onChange={set('maxMembers')} required />
                            </div>
                            <div className="form-group">
                                <label className="label" htmlFor="preferredGender">Preferred gender</label>
                                <select id="preferredGender" className="select" value={form.preferredGender} onChange={set('preferredGender')}>
                                    {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Skills needed</label>
                            <div className="skills-wrap" onClick={() => document.getElementById('skill-inp')?.focus()}>
                                {skills.map(s => (
                                    <span className="skill-chip" key={s}>{s}
                                        <button type="button" onClick={() => removeSkill(s)}>×</button>
                                    </span>
                                ))}
                                <input id="skill-inp" className="skills-input"
                                    placeholder={skills.length ? '' : 'Python, React, ML… press Enter'}
                                    value={skillInput} onChange={e => setSkillInput(e.target.value)}
                                    onKeyDown={handleSkillKey} onBlur={() => addSkill(skillInput)} />
                            </div>
                            <span className="hint">Separate skills with Enter or comma.</span>
                        </div>
                    </div>

                    <hr className="form-divider" />

                    {/* ── Matching Requirements ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {sectionLabel('Matching Requirements')}
                        <div className="form-group">
                            <label className="label">Roles Needed</label>
                            <span className="hint">Click to select roles you need in your team</span>
                            <div className="role-chips" style={{ marginTop: 8 }}>
                                {ROLE_OPTIONS.map(r => (
                                    <button key={r} type="button"
                                        className={`role-chip${requiredRoles.includes(r) ? ' active' : ''}`}
                                        onClick={() => toggleRole(r)}>{r}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Minimum Skill Requirements</label>
                            <span className="hint">Add skills and set minimum proficiency level</span>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                                <input className="input" placeholder="e.g. Python" value={reqSkillInput}
                                    onChange={e => setReqSkillInput(e.target.value)}
                                    onKeyDown={e => { if (['Enter', ','].includes(e.key)) { e.preventDefault(); addReqSkill(reqSkillInput); } }}
                                    style={{ flex: 1 }} />
                                <button type="button" className="btn btn-outline" onClick={() => addReqSkill(reqSkillInput)}>Add</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
                                {Object.entries(reqSkills).map(([skill, level]) => (
                                    <div key={skill} className="skill-level-row">
                                        <span className="skill-name">{skill}</span>
                                        <div className="skill-dots">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} type="button"
                                                    className={`skill-dot${level >= n ? ' filled' : ''}`}
                                                    onClick={() => setReqLevel(skill, n)} title={LEVEL_LABELS[n]} />
                                            ))}
                                        </div>
                                        <span className="skill-level-label">{LEVEL_LABELS[level]}+</span>
                                        <button type="button" onClick={() => removeReqSkill(skill)}
                                            style={{ marginLeft: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1rem' }}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <hr className="form-divider" />

                    {/* ── Advanced Matching Weights ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Header row with toggle */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>🧠 Advanced Matching Preferences</span>
                                    <span title="These weights determine how strongly each factor influences member compatibility scoring."
                                        style={{ fontSize: '0.75rem', cursor: 'help', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, lineHeight: 1 }}>?</span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, maxWidth: 420 }}>
                                    Customize how compatibility scores are calculated. Weights must total 100%.
                                </p>
                            </div>
                            {/* Toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                                    {useCustomWeights ? 'Custom weights ON' : 'Using defaults'}
                                </span>
                                <div onClick={() => setUseCustomWeights(v => !v)}
                                    style={{
                                        width: 40, height: 22, borderRadius: 11,
                                        background: useCustomWeights ? 'var(--accent)' : '#D1D5DB',
                                        position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
                                    }}>
                                    <div style={{
                                        position: 'absolute', top: 3,
                                        left: useCustomWeights ? 21 : 3,
                                        width: 16, height: 16, borderRadius: '50%',
                                        background: '#fff', transition: 'left 0.2s',
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }} />
                                </div>
                            </label>
                        </div>

                        {!useCustomWeights ? (
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', fontSize: '0.85rem', color: '#6B7280', textAlign: 'center' }}>
                                Using default compatibility scoring (Skill 35%, Diversity 20%, Role 20%, Exp 15%, Gender 10%)
                            </div>
                        ) : (
                            <>
                                {/* 2-column grid of factor sliders */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
                                    {FACTORS.map(f => (
                                        <FactorSlider key={f.key} factor={f} value={weights[f.key]} onChange={v => setW(f.key, v)} />
                                    ))}
                                </div>

                                {/* Reset + summary */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="button" className="btn btn-outline btn-sm" onClick={resetWeights}>Reset to defaults</button>
                                </div>

                                <WeightsSummary weights={weights} />

                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, padding: '10px 14px' }}>
                                    💡 <strong>Tip:</strong> To prioritize technical skill, raise Skill Compatibility. For a well-rounded team, distribute weights more evenly across all factors.
                                </p>
                            </>
                        )}
                    </div>

                    <hr className="form-divider" />

                    {/* ── Problem statement ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {sectionLabel('Problem statement')}
                        <div className="form-group">
                            <label className="label" htmlFor="problemStatement">Describe the problem you're solving</label>
                            <textarea id="problemStatement" className="textarea" placeholder="We're building an AI-powered tool that…" value={form.problemStatement} onChange={set('problemStatement')} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn btn-primary" disabled={isSubmitDisabled}
                            title={useCustomWeights && totalWeight !== 100 ? `Weights total ${totalWeight}% — must be 100%` : ''}>
                            {loading ? <span className="spinner" /> : 'Post team listing'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
