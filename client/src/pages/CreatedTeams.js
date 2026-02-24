import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const GENDER_OPTIONS = ['No Preference', 'Male', 'Female'];
const ROLE_OPTIONS = ['Frontend', 'Backend', 'AI/ML', 'UI/UX Design', 'Marketing', 'PPT/Presentation'];
const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

// ── Shared: User Detail Popover ───────────────────────────────
function UserDetailPopover({ u, onClose }) {
    if (!u) return null;
    const skills = u.skillStrengths
        ? (u.skillStrengths instanceof Map
            ? [...u.skillStrengths.entries()]
            : Object.entries(u.skillStrengths))
        : [];
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 360 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div><div style={{ fontWeight: 700 }}>{u.name}</div><div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.email}</div></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.85rem', marginBottom: 16 }}>
                    {u.dept && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DEPT</div><strong>{u.dept}</strong></div>}
                    {u.year && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>YEAR</div><strong>{u.year}</strong></div>}
                    {u.gender && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>GENDER</div><strong>{u.gender}</strong></div>}
                </div>
                {u.preferredRoles?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>ROLES</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {u.preferredRoles.map(r => <span key={r} className="badge badge-skill">{r}</span>)}
                        </div>
                    </div>
                )}
                {skills.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>SKILLS</div>
                        {skills.map(([s, l]) => (
                            <div key={s} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.83rem', marginBottom: 4 }}>
                                <span>{s}</span><span style={{ color: 'var(--accent)', fontWeight: 600 }}>{LEVEL_LABELS[l] || l}</span>
                            </div>
                        ))}
                    </div>
                )}
                <button className="btn btn-outline btn-full" onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

// ── Edit Team Modal ───────────────────────────────────────────
function EditTeamModal({ team, user, onClose, onSaved }) {
    const [form, setForm] = useState({
        hackathonName: team.hackathonName || '',
        hackathonPlace: team.hackathonPlace || '',
        hackathonDate: team.hackathonDate || '',
        lastDate: team.lastDate || '',
        problemStatement: team.problemStatement || '',
        maxMembers: team.maxMembers || '',
        preferredGender: team.preferredGender || 'No Preference',
    });
    const [skills, setSkills] = useState(team.skillsNeeded || []);
    const [skillInput, setSkillInput] = useState('');
    const [roles, setRoles] = useState(team.requiredRoles || []);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
    const addSkill = val => {
        const parts = val.split(',').map(s => s.trim()).filter(Boolean);
        setSkills(prev => [...prev, ...parts.filter(s => !prev.includes(s))]);
        setSkillInput('');
    };
    const toggleRole = r => setRoles(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]);

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        try {
            await api(`/api/teams/${team._id}`, {
                method: 'PATCH',
                body: { leaderEmail: user.email, ...form, maxMembers: Number(form.maxMembers), skillsNeeded: skills, requiredRoles: roles },
            });
            onSaved({ ...team, ...form, maxMembers: Number(form.maxMembers), skillsNeeded: skills, requiredRoles: roles });
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
                <h3 style={{ marginBottom: 20 }}>Edit Team — {team.hackathonName}</h3>
                {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="form-group">
                        <label className="label">Hackathon Name</label>
                        <input className="input" value={form.hackathonName} onChange={set('hackathonName')} required />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="label">Hackathon Date</label>
                            <input type="date" className="input" value={form.hackathonDate} onChange={set('hackathonDate')} />
                        </div>
                        <div className="form-group">
                            <label className="label">Application Deadline</label>
                            <input type="date" className="input" value={form.lastDate} onChange={set('lastDate')} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="label">Venue / Mode</label>
                            <input className="input" value={form.hackathonPlace} onChange={set('hackathonPlace')} />
                        </div>
                        <div className="form-group">
                            <label className="label">Max Team Size</label>
                            <input type="number" min={2} max={10} className="input" value={form.maxMembers} onChange={set('maxMembers')} required />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Preferred Gender</label>
                        <select className="select" value={form.preferredGender} onChange={set('preferredGender')}>
                            {GENDER_OPTIONS.map(g => <option key={g}>{g}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="label">Skills Needed</label>
                        <div className="skills-wrap" onClick={() => document.getElementById('edit-skill-inp')?.focus()}>
                            {skills.map(s => (
                                <span className="skill-chip" key={s}>{s}
                                    <button type="button" onClick={() => setSkills(p => p.filter(x => x !== s))}>×</button>
                                </span>
                            ))}
                            <input id="edit-skill-inp" className="skills-input"
                                placeholder={skills.length ? '' : 'Python, React…'}
                                value={skillInput}
                                onChange={e => setSkillInput(e.target.value)}
                                onKeyDown={e => { if (['Enter', ',', 'Tab'].includes(e.key)) { e.preventDefault(); addSkill(skillInput); } }}
                                onBlur={() => { if (skillInput) addSkill(skillInput); }} />
                        </div>
                        <span className="hint">Press Enter or comma to add each skill separately.</span>
                    </div>
                    <div className="form-group">
                        <label className="label">Roles Needed</label>
                        <div className="role-chips" style={{ marginTop: 4 }}>
                            {ROLE_OPTIONS.map(r => (
                                <button key={r} type="button"
                                    className={`role-chip${roles.includes(r) ? ' active' : ''}`}
                                    onClick={() => toggleRole(r)}>{r}</button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="label">Problem Statement</label>
                        <textarea className="textarea" rows={3} value={form.problemStatement} onChange={set('problemStatement')} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Save Changes'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Suggestions Panel ─────────────────────────────────────────
function SuggestionsPanel({ teamId }) {
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetched, setFetched] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const handle = async () => {
        if (fetched) { setOpen(o => !o); return; }
        setOpen(true); setLoading(true);
        try {
            const data = await api(`/api/teams/${teamId}/suggestions`);
            setSuggestions(data); setFetched(true);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    };

    const cls = s => s >= 75 ? 'high' : s >= 50 ? 'mid' : 'low';

    return (
        <>
            <div className="suggestions-panel">
                <div className="suggestions-header" onClick={handle}>
                    <span>🤖 AI-Suggested Members</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>{open ? '▲ Hide' : '▼ Show top matches'}</span>
                </div>
                {open && (
                    <div className="suggestions-list">
                        {loading && <div className="loading-page" style={{ minHeight: 60 }}><span className="spinner" /> Scoring candidates…</div>}
                        {!loading && suggestions.length === 0 && <p style={{ padding: 16, fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>No candidates found.</p>}
                        {!loading && suggestions.map(s => (
                            <div key={s.user.email} className="suggestion-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedUser(s.user)}>
                                <div className="suggestion-avatar">{s.user.name?.charAt(0)?.toUpperCase() || '?'}</div>
                                <div className="suggestion-info">
                                    <div className="suggestion-name">{s.user.name}</div>
                                    <div className="suggestion-meta">
                                        {[s.user.dept, s.user.year ? `Year ${s.user.year}` : null, s.user.preferredRoles?.join(', ')].filter(Boolean).join(' · ')}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                                    <span className={`compat-badge ${cls(s.score)}`}>{s.score}%</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>click for details</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {selectedUser && <UserDetailPopover u={selectedUser} onClose={() => setSelectedUser(null)} />}
        </>
    );
}

// ── Request Row ───────────────────────────────────────────────
function RequestRow({ req, onAccept, onDecline }) {
    const [loading, setLoading] = useState(null);
    const act = async action => {
        setLoading(action);
        try {
            await api(`/api/requests/${req._id}/${action}`, { method: 'POST' });
            action === 'accept' ? onAccept(req._id) : onDecline(req._id);
        } catch (e) { console.error(e); }
        finally { setLoading(null); }
    };
    const statusBadge = { pending: <span className="badge badge-pending">Pending</span>, accepted: <span className="badge badge-accepted">Accepted</span>, declined: <span className="badge badge-declined">Declined</span> }[req.status] || null;

    return (
        <div className="request-item">
            <div className="request-info">
                <strong>{req.userName || req.userEmail}</strong>
                <span>{req.userEmail}</span>
                {req.userDept && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{req.userDept}{req.userYear ? ` · Year ${req.userYear}` : ''}{req.userGender ? ` · ${req.userGender}` : ''}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {statusBadge}
                {req.status === 'pending' && (
                    <div className="request-actions">
                        <button className="btn btn-success btn-sm" onClick={() => act('accept')} disabled={!!loading}>
                            {loading === 'accept' ? <span className="spinner" /> : '✓ Accept'}
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => act('decline')} disabled={!!loading}>
                            {loading === 'decline' ? <span className="spinner" /> : '✕ Decline'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Team Panel ────────────────────────────────────────────────
function TeamPanel({ team: initialTeam, onDelete }) {
    const [team, setTeam] = useState(initialTeam);
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loadingReqs, setLoadingReqs] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [editOpen, setEditOpen] = useState(false);

    const fetchRequests = useCallback(async () => {
        if (!open) return;
        setLoadingReqs(true);
        try { setRequests(await api(`/api/requests/team/${team._id}`)); }
        catch (e) { console.error(e); }
        finally { setLoadingReqs(false); }
    }, [open, team._id]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleAccept = id => setRequests(r => r.map(x => x._id === id ? { ...x, status: 'accepted' } : x));
    const handleDecline = id => setRequests(r => r.map(x => x._id === id ? { ...x, status: 'declined' } : x));
    const handleDelete = async () => {
        if (!window.confirm(`Delete "${team.hackathonName}"? This cannot be undone.`)) return;
        setDeleting(true);
        try { await api(`/api/teams/${team._id}`, { method: 'DELETE' }); onDelete(team._id); }
        catch (e) { console.error(e); setDeleting(false); }
    };

    // spots = maxMembers - 1 (leader slot) - members.length
    const spotsLeft = team.maxMembers - 1 - (team.members?.length || 0);
    const pending = requests.filter(r => r.status === 'pending').length;

    const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    return (
        <>
            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">{team.hackathonName}</div>
                        <div className="card-sub">
                            {team.hackathonPlace && `${team.hackathonPlace} · `}
                            {team.hackathonDate && `Event: ${fmt(team.hackathonDate)}`}
                            {team.lastDate && ` · Apply by: ${fmt(team.lastDate)}`}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 100, color: spotsLeft > 0 ? 'var(--success)' : 'var(--text-muted)', background: spotsLeft > 0 ? 'var(--success-light)' : '#f4f4f5', border: `1px solid ${spotsLeft > 0 ? '#a7f3d0' : '#e4e4e7'}` }}>
                            {spotsLeft > 0 ? `${spotsLeft} spot${spotsLeft !== 1 ? 's' : ''} left` : 'Full'}
                        </span>
                        {pending > 0 && <span className="badge badge-pending">{pending} pending</span>}
                    </div>
                </div>

                {team.skillsNeeded?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                        {team.skillsNeeded.map(s => <span key={s} className="badge badge-skill">{s}</span>)}
                    </div>
                )}

                <div className="card-footer">
                    <button className="btn btn-outline btn-sm" onClick={() => setOpen(o => !o)}>
                        {open ? '▲ Hide requests' : `▼ View requests${requests.length ? ` (${requests.length})` : ''}`}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setEditOpen(true)}>✏️ Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting} style={{ marginLeft: 'auto' }}>
                        {deleting ? <span className="spinner" /> : 'Delete'}
                    </button>
                </div>

                {open && (
                    <div style={{ marginTop: 16 }}>
                        {loadingReqs && <div className="loading-page" style={{ minHeight: 60 }}><span className="spinner" /></div>}
                        {!loadingReqs && requests.length === 0 && <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>No join requests yet.</p>}
                        {!loadingReqs && requests.length > 0 && (
                            <div className="request-list">
                                {requests.map(r => <RequestRow key={r._id} req={r} onAccept={handleAccept} onDecline={handleDecline} />)}
                            </div>
                        )}
                    </div>
                )}

                <SuggestionsPanel teamId={team._id} />
            </div>

            {editOpen && (
                <EditTeamModal team={team} user={{ email: team.leader }} onClose={() => setEditOpen(false)}
                    onSaved={updated => setTeam(updated)} />
            )}
        </>
    );
}

// ── Main ─────────────────────────────────────────────────────
export default function CreatedTeams({ user }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTeams = useCallback(async () => {
        setLoading(true); setError('');
        try { setTeams(await api(`/api/teams/created/${encodeURIComponent(user.email)}`)); }
        catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [user.email]);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);
    const handleDelete = id => setTeams(t => t.filter(x => x._id !== id));

    return (
        <div className="page">
            <div className="container">
                <div className="section-head">
                    <div><h2>My teams</h2><p>Teams you've created and their join requests.</p></div>
                    <Link to="/create" className="btn btn-primary btn-sm">+ New team</Link>
                </div>

                {loading && <div className="loading-page"><span className="spinner" /> Loading…</div>}
                {error && <div className="alert alert-error">{error}</div>}

                {!loading && !error && teams.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📂</div>
                        <h3>No teams yet</h3>
                        <p>Create your first hackathon team listing and start finding teammates.</p>
                        <Link to="/create" className="btn btn-primary">Create a team</Link>
                    </div>
                )}

                {!loading && teams.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {teams.map(t => <TeamPanel key={t._id} team={t} onDelete={handleDelete} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
