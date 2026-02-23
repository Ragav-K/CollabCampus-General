import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';

const GENDER_OPTIONS = ['No Preference', 'Male', 'Female'];

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
                    leader: user.email,
                    leaderName: user.name,
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
