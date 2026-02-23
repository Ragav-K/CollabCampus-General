import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const GENDER_OPTIONS = ['No Preference', 'Male', 'Female'];
const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI/ML', 'UI/UX Design', 'Marketing', 'PPT/Presentation'];
const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

export default function CreateTeam({ user }) {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        hackathonName: '',
        hackathonPlace: '',
        hackathonDate: '',
        lastDate: '',
        problemStatement: '',
        maxMembers: '',
        preferredGender: 'No Preference',
    });
    const [skills, setSkills] = useState([]);
    const [skillInput, setSkillInput] = useState('');
    const [requiredRoles, setRequiredRoles] = useState([]);
    const [reqSkills, setReqSkills] = useState({}); // { skill: level 1-5 }
    const [reqSkillInput, setReqSkillInput] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const addSkill = (val) => {
        const v = val.trim();
        if (v && !skills.includes(v)) setSkills((s) => [...s, v]);
        setSkillInput('');
    };

    const removeSkill = (s) => setSkills((prev) => prev.filter((x) => x !== s));

    const handleSkillKey = (e) => {
        if (['Enter', ',', 'Tab'].includes(e.key)) {
            e.preventDefault();
            addSkill(skillInput);
        }
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
        e.preventDefault();
        setError('');

        if (!form.hackathonName || !form.hackathonDate || !form.lastDate || !form.maxMembers) {
            setError('Please fill in all required fields.');
            return;
        }

        if (Number(form.maxMembers) < 2) {
            setError('Team must have at least 2 members.');
            return;
        }

        setLoading(true);
        try {
            await api('/api/teams', {
                body: {
                    ...form,
                    maxMembers: Number(form.maxMembers),
                    skillsNeeded: skills,
                    requiredRoles,
                    requiredSkills: reqSkills,
                    leader: user.email,
                    leaderName: user.name,
                    leaderDept: user.dept || '',
                    leaderYear: user.year || '',
                    leaderGender: user.gender || '',
                },
            });
            navigate('/created');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 660 }}>
                <div className="section-head" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4, marginBottom: 32 }}>
                    <h2>Create a team</h2>
                    <p>Post your hackathon listing and let teammates find you.</p>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {error && <div className="alert alert-error">{error}</div>}

                    {/* Event details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: -4 }}>
                            Event details
                        </p>

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

                    {/* Team preferences */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: -4 }}>
                            Team preferences
                        </p>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="label" htmlFor="maxMembers">Max team size *</label>
                                <input
                                    id="maxMembers"
                                    type="number"
                                    min={2}
                                    max={10}
                                    className="input"
                                    placeholder="4"
                                    value={form.maxMembers}
                                    onChange={set('maxMembers')}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="label" htmlFor="preferredGender">Preferred gender</label>
                                <select id="preferredGender" className="select" value={form.preferredGender} onChange={set('preferredGender')}>
                                    {GENDER_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="label">Skills needed</label>
                            <div className="skills-wrap" onClick={() => document.getElementById('skill-inp')?.focus()}>
                                {skills.map((s) => (
                                    <span className="skill-chip" key={s}>
                                        {s}
                                        <button type="button" onClick={() => removeSkill(s)} aria-label={`Remove ${s}`}>×</button>
                                    </span>
                                ))}
                                <input
                                    id="skill-inp"
                                    className="skills-input"
                                    placeholder={skills.length ? '' : 'Python, React, ML… press Enter'}
                                    value={skillInput}
                                    onChange={(e) => setSkillInput(e.target.value)}
                                    onKeyDown={handleSkillKey}
                                    onBlur={() => addSkill(skillInput)}
                                />
                            </div>
                            <span className="hint">Separate skills with Enter or comma.</span>
                        </div>
                    </div>

                    <hr className="form-divider" />

                    {/* Matching Engine */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: -4 }}>
                            Matching Requirements
                        </p>

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
                            <span className="hint">Add skills and set minimum proficiency level — used by the matching engine</span>
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
                                                    onClick={() => setReqLevel(skill, n)}
                                                    title={LEVEL_LABELS[n]} />
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

                    {/* Problem statement */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: -4 }}>
                            Problem statement
                        </p>

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
