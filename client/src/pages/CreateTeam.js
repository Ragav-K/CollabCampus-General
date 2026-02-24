import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const GENDER_OPTIONS = ['No Preference', 'Male', 'Female'];
const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI/ML', 'UI/UX Design', 'Marketing', 'PPT/Presentation'];
const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

// ── Factor definitions ──────────────────────────────────────
const FACTORS = [
    { key: 'skill', icon: '⌨️', title: 'Skill Compatibility', desc: 'Measures how well a member\'s technical skills match your required technologies (React, AI, Backend, ML, UI/UX, etc.).', defaultW: 8, defaultOn: true, color: '#2563EB' },
    { key: 'role', icon: '🪪', title: 'Role Fit', desc: 'Evaluates whether the member fits the specific role your team needs (Developer, Designer, Presenter, ML Engineer).', defaultW: 6, defaultOn: true, color: '#7C3AED' },
    { key: 'diversity', icon: '🌐', title: 'Diversity Preference', desc: 'Encourages inclusion of members from different departments, academic years, or varied technical backgrounds.', defaultW: 4, defaultOn: true, color: '#059669' },
];

const PRESETS = {
    skill: { label: '⌨️ Skill-Focused', color: '#2563EB', values: { skill: { e: true, w: 10 }, role: { e: true, w: 4 }, diversity: { e: false, w: 0 } } },
    balanced: { label: '⚖️ Balanced Team', color: '#059669', values: { skill: { e: true, w: 6 }, role: { e: true, w: 6 }, diversity: { e: true, w: 6 } } },
    diversity: { label: '🌐 Diversity-Focused', color: '#7C3AED', values: { skill: { e: true, w: 4 }, role: { e: true, w: 4 }, diversity: { e: true, w: 10 } } },
};

const priorityLabel = (w) => w === 0 ? 'Off' : w <= 3 ? 'Low' : w <= 6 ? 'Medium' : w <= 8 ? 'High' : 'Critical';
const priorityColor = (w) => w === 0 ? '#9CA3AF' : w <= 3 ? '#D97706' : w <= 6 ? '#2563EB' : w <= 8 ? '#059669' : '#DC2626';

const defaultPrefs = () => Object.fromEntries(FACTORS.map(f => [f.key, { e: f.defaultOn, w: f.defaultW }]));

// ── Factor Card ─────────────────────────────────────────────
function FactorCard({ factor, pref, onChange }) {
    const { e: enabled, w: weight } = pref;

    return (
        <div style={{
            background: enabled ? '#fff' : '#F9FAFB',
            border: `1.5px solid ${enabled ? '#E5E7EB' : '#F3F4F6'}`,
            borderRadius: 14, padding: '18px 20px',
            opacity: enabled ? 1 : 0.6,
            transition: 'all 0.2s ease',
        }}>
            {/* Header: icon + title + toggle */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.25rem', lineHeight: 1.2, filter: enabled ? 'none' : 'grayscale(1)' }}>{factor.icon}</span>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111827' }}>{factor.title}</div>
                        <div style={{ fontSize: '0.74rem', color: '#6B7280', lineHeight: 1.5, marginTop: 2 }}>{factor.desc}</div>
                    </div>
                </div>
                {/* Toggle */}
                <div onClick={() => onChange({ e: !enabled, w: !enabled ? (factor.defaultW || 5) : 0 })}
                    style={{ flexShrink: 0, width: 38, height: 21, borderRadius: 11, background: enabled ? factor.color : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, left: enabled ? 19 : 3, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                </div>
            </div>

            {/* Importance slider */}
            <div style={{ marginTop: 12, opacity: enabled ? 1 : 0.4, pointerEvents: enabled ? 'auto' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', gap: 6, fontSize: '0.7rem', color: '#9CA3AF' }}>
                        <span>Low</span><span>—</span><span>Medium</span><span>—</span><span>High</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: priorityColor(weight) }}>
                        {priorityLabel(weight)}
                    </span>
                </div>
                <input type="range" min={0} max={10} value={weight}
                    onChange={e => onChange({ e: enabled, w: Number(e.target.value) })}
                    style={{ accentColor: factor.color, width: '100%', cursor: 'pointer' }} />
                {/* Mini fill bar */}
                <div style={{ height: 3, borderRadius: 3, background: '#F3F4F6', marginTop: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${weight * 10}%`, background: factor.color, borderRadius: 3, transition: 'width 0.2s ease' }} />
                </div>
            </div>
        </div>
    );
}

// ── Distribution Preview Bar ─────────────────────────────────
function DistributionBar({ prefs }) {
    const [showBreakdown, setShowBreakdown] = useState(false);
    const enabled = FACTORS.filter(f => prefs[f.key]?.e);
    const total = enabled.reduce((s, f) => s + (prefs[f.key]?.w || 0), 0);

    if (enabled.length === 0) return null;

    return (
        <div style={{ background: '#F8FAFC', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontWeight: 600, fontSize: '0.83rem', color: '#374151' }}>Compatibility Distribution Preview</span>
                <button type="button" onClick={() => setShowBreakdown(v => !v)}
                    style={{ fontSize: '0.72rem', color: '#2563EB', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {showBreakdown ? 'Hide breakdown' : 'Preview breakdown'}
                </button>
            </div>

            {/* Stacked horizontal bar */}
            <div style={{ display: 'flex', height: 10, borderRadius: 8, overflow: 'hidden', gap: 2, marginBottom: 10 }}>
                {enabled.map(f => {
                    const pct = total > 0 ? ((prefs[f.key]?.w || 0) / total) * 100 : 0;
                    return pct > 0 ? (
                        <div key={f.key} title={`${f.title}: ${Math.round(pct)}%`}
                            style={{ flex: prefs[f.key]?.w, background: f.color, transition: 'flex 0.3s ease', minWidth: 2 }} />
                    ) : null;
                })}
            </div>

            {/* Factor labels */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                {enabled.map(f => {
                    const pct = total > 0 ? Math.round(((prefs[f.key]?.w || 0) / total) * 100) : 0;
                    return (
                        <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.73rem', color: '#6B7280' }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: f.color, flexShrink: 0 }} />
                            <span>{f.title.split(' ')[0]}</span>
                            {showBreakdown && <span style={{ fontWeight: 700, color: f.color }}>{pct}%</span>}
                        </div>
                    );
                })}
            </div>

            {!showBreakdown && (
                <p style={{ fontSize: '0.71rem', color: '#9CA3AF', marginTop: 8 }}>
                    Final percentages are automatically calculated when your team is created.
                </p>
            )}
        </div>
    );
}

// ── Main Form ────────────────────────────────────────────────
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

    // ── Matching preferences (auto-normalized) ──
    const [useMatching, setUseMatching] = useState(true);
    const [prefs, setPrefs] = useState(defaultPrefs());
    const [activePreset, setActivePreset] = useState(null);

    const applyPreset = (key) => {
        const p = PRESETS[key];
        const mapped = {};
        Object.entries(p.values).forEach(([k, v]) => { mapped[k] = { e: v.e, w: v.w }; });
        setPrefs(mapped);
        setActivePreset(key);
    };

    const setPref = (key, val) => {
        setPrefs(p => ({ ...p, [key]: val }));
        setActivePreset(null); // custom after manual change
    };

    // Build matchingPreferences payload for API
    const matchingPreferences = useMemo(() => {
        const result = {};
        FACTORS.forEach(f => { result[f.key] = { enabled: prefs[f.key]?.e ?? false, weight: prefs[f.key]?.w ?? 0 }; });
        return result;
    }, [prefs]);

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const addSkill = val => {
        const parts = val.split(',').map(s => s.trim()).filter(Boolean);
        setSkills(prev => [...prev, ...parts.filter(s => !prev.includes(s))]);
        setSkillInput('');
    };
    const removeSkill = s => setSkills(prev => prev.filter(x => x !== s));
    const handleSkillKey = e => { if (['Enter', 'Tab'].includes(e.key)) { e.preventDefault(); addSkill(skillInput); } };
    const toggleRole = role => setRequiredRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    const addReqSkill = val => {
        const t = val.trim(); if (!t || reqSkills[t]) return;
        setReqSkills(s => ({ ...s, [t]: 3 })); setReqSkillInput('');
    };
    const removeReqSkill = s => { const n = { ...reqSkills }; delete n[s]; setReqSkills(n); };
    const setReqLevel = (s, l) => setReqSkills(prev => ({ ...prev, [s]: l }));

    const handleSubmit = async e => {
        e.preventDefault(); setError('');
        if (!form.hackathonName || !form.hackathonDate || !form.lastDate || !form.maxMembers) {
            setError('Please fill in all required fields.'); return;
        }
        if (Number(form.maxMembers) < 2) { setError('Team must have at least 2 members.'); return; }
        setLoading(true);
        try {
            await api('/api/teams', {
                body: {
                    ...form, maxMembers: Number(form.maxMembers),
                    skillsNeeded: skills, requiredRoles, requiredSkills: reqSkills,
                    leader: user.email, leaderName: user.name,
                    leaderDept: user.dept || '', leaderYear: user.year || '', leaderGender: user.gender || '',
                    matchingPreferences: useMatching ? matchingPreferences : null,
                },
            });
            navigate('/created');
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    const sectionLabel = text => (
        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: -4 }}>
            {text}
        </p>
    );

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
                            <span className="hint">Click to select roles you need</span>
                            <div className="role-chips" style={{ marginTop: 8 }}>
                                {ROLE_OPTIONS.map(r => (
                                    <button key={r} type="button" className={`role-chip${requiredRoles.includes(r) ? ' active' : ''}`} onClick={() => toggleRole(r)}>{r}</button>
                                ))}
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="label">Minimum Skill Requirements</label>
                            <span className="hint">Add skills and set minimum proficiency — used by the matching engine</span>
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
                                                <button key={n} type="button" className={`skill-dot${level >= n ? ' filled' : ''}`} onClick={() => setReqLevel(skill, n)} title={LEVEL_LABELS[n]} />
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

                    {/* ── Advanced Matching Preferences ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {/* Section header + toggle */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: '#2563EB' }}>🧠 Advanced Matching Preferences</span>
                                    <span title="Instead of setting exact percentages, you set relative importance. CollabCampus automatically calculates the final compatibility distribution behind the scenes."
                                        style={{ fontSize: '0.72rem', cursor: 'help', color: '#9CA3AF', border: '1px solid #D1D5DB', borderRadius: '50%', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0 }}>?</span>
                                </div>
                                <p style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: 4, maxWidth: 440, lineHeight: 1.5 }}>
                                    Choose which factors matter most. We automatically balance the percentages for you.
                                </p>
                            </div>
                            {/* Master toggle */}
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', flexShrink: 0 }}>
                                <span style={{ fontSize: '0.79rem', color: '#6B7280', fontWeight: 500 }}>
                                    {useMatching ? 'Custom' : 'Default'}
                                </span>
                                <div onClick={() => setUseMatching(v => !v)}
                                    style={{ width: 40, height: 22, borderRadius: 11, background: useMatching ? '#2563EB' : '#D1D5DB', position: 'relative', cursor: 'pointer', transition: 'background 0.2s' }}>
                                    <div style={{ position: 'absolute', top: 3, left: useMatching ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
                                </div>
                            </label>
                        </div>

                        {!useMatching ? (
                            <div style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', fontSize: '0.85rem', color: '#6B7280', textAlign: 'center' }}>
                                Using default compatibility scoring — all factors weighted equally.
                            </div>
                        ) : (
                            <>
                                {/* ── Preset Strategy Buttons ── */}
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#9CA3AF', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>Matching Strategy Presets</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {Object.entries(PRESETS).map(([key, p]) => (
                                            <button key={key} type="button"
                                                onClick={() => applyPreset(key)}
                                                style={{
                                                    padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                                                    border: `1.5px solid ${activePreset === key ? p.color : '#E5E7EB'}`,
                                                    background: activePreset === key ? p.color + '15' : '#fff',
                                                    color: activePreset === key ? p.color : '#374151',
                                                    transition: 'all 0.15s ease',
                                                }}>
                                                {p.label}
                                            </button>
                                        ))}
                                        {activePreset && (
                                            <button type="button" onClick={() => { setPrefs(defaultPrefs()); setActivePreset(null); }}
                                                style={{ padding: '7px 14px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 500, cursor: 'pointer', border: '1.5px solid #E5E7EB', background: '#fff', color: '#9CA3AF' }}>
                                                ↺ Reset
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* ── Factor Cards (2-col grid) ── */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: 12 }}>
                                    {FACTORS.map(f => (
                                        <FactorCard key={f.key} factor={f} pref={prefs[f.key]} onChange={v => setPref(f.key, v)} />
                                    ))}
                                </div>

                                {/* ── Distribution Preview ── */}
                                <DistributionBar prefs={prefs} />

                                <p style={{ fontSize: '0.78rem', color: '#6B7280', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 8, padding: '10px 14px', lineHeight: 1.55 }}>
                                    💡 <strong>Just tell us what matters more.</strong> CollabCampus handles the math — no percentages, no friction, no errors.
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
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Post team listing'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => navigate('/')}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
