import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api';

function genderBadge(g) {
    if (g === 'Male') return <span className="badge badge-gm">♂ Male only</span>;
    if (g === 'Female') return <span className="badge badge-gf">♀ Female only</span>;
    return null;
}

// ── Join request modal ────────────────────────────────────────
function JoinModal({ team, userEmail, userName, onClose, onSubmit }) {
    const [form, setForm] = useState({ userWhatsapp: '', userStrengths: '', userProblemStatement: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api('/api/requests', {
                body: {
                    teamId: team._id,
                    userEmail,
                    userName,
                    userDept: '',
                    userYear: '',
                    userGender: '',
                    ...form,
                },
            });
            onSubmit(team._id);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <div className="modal-header">
                    <div>
                        <div className="card-title">Apply to join</div>
                        <div className="card-sub">{team.hackathonName}</div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
                </div>

                <form className="modal-form" onSubmit={handleSubmit}>
                    {error && <div className="alert alert-error">{error}</div>}

                    <div className="form-group">
                        <label className="label" htmlFor="whatsapp">WhatsApp number</label>
                        <input id="whatsapp" className="input" placeholder="+91 98765 43210" value={form.userWhatsapp} onChange={set('userWhatsapp')} />
                    </div>

                    <div className="form-group">
                        <label className="label" htmlFor="strengths">Your skills / strengths *</label>
                        <textarea id="strengths" className="textarea" placeholder="I'm good at backend development, ML models, and deployment…" value={form.userStrengths} onChange={set('userStrengths')} required style={{ minHeight: 70 }} />
                    </div>

                    <div className="form-group">
                        <label className="label" htmlFor="ps">Your problem statement idea</label>
                        <textarea id="ps" className="textarea" placeholder="I think we should solve X by building Y…" value={form.userProblemStatement} onChange={set('userProblemStatement')} style={{ minHeight: 70 }} />
                    </div>

                    <div className="modal-actions">
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Send request'}
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Team card ────────────────────────────────────────────────
function TeamCard({ team, onApply }) {
    const spotsLeft = team.maxMembers - (team.members?.length || 0);

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <div className="card-title">{team.hackathonName}</div>
                    <div className="card-sub">
                        Posted by {team.leaderName || team.leader}
                        {team.hackathonPlace && ` · ${team.hackathonPlace}`}
                    </div>
                </div>
                <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: spotsLeft <= 1 ? 'var(--warning)' : 'var(--success)',
                    background: spotsLeft <= 1 ? '#fffbeb' : 'var(--success-light)',
                    border: `1px solid ${spotsLeft <= 1 ? '#fde68a' : '#a7f3d0'}`,
                    borderRadius: 100,
                    padding: '2px 10px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                }}>
                    {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
                </span>
            </div>

            <div className="card-body">
                <div className="meta-row">
                    {team.hackathonDate && (
                        <span className="meta-item">📅 {new Date(team.hackathonDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    )}
                    {team.lastDate && (
                        <span className="meta-item">⏳ Apply by {new Date(team.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    )}
                </div>

                {team.problemStatement && (
                    <p style={{ fontSize: '0.85rem', WebkitLineClamp: 3, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {team.problemStatement}
                    </p>
                )}

                {team.skillsNeeded?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {team.skillsNeeded.map((s) => <span key={s} className="badge badge-skill">{s}</span>)}
                    </div>
                )}
            </div>

            <div className="card-footer" style={{ justifyContent: 'space-between' }}>
                {genderBadge(team.preferredGender)}
                <button className="btn btn-primary btn-sm" onClick={() => onApply(team)} style={{ marginLeft: 'auto' }}>
                    Apply →
                </button>
            </div>
        </div>
    );
}

// ── Main JoinTeam page ───────────────────────────────────────
export default function JoinTeam({ user }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [modal, setModal] = useState(null);
    const [applied, setApplied] = useState(new Set());
    const [search, setSearch] = useState('');

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api(`/api/teams?email=${encodeURIComponent(user.email)}&excludeRequested=${encodeURIComponent(user.email)}`);
            setTeams(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user.email]);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);

    const handleApplied = (teamId) => {
        setApplied((s) => new Set(s).add(teamId));
        setModal(null);
    };

    const filtered = search.trim()
        ? teams.filter((t) =>
            [t.hackathonName, t.leaderName, t.hackathonPlace, ...(t.skillsNeeded || [])]
                .join(' ').toLowerCase().includes(search.toLowerCase())
        )
        : teams;

    return (
        <div className="page">
            <div className="container">
                <div className="section-head">
                    <div>
                        <h2>Browse teams</h2>
                        <p>Open hackathon teams looking for members like you.</p>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={fetchTeams}>↺ Refresh</button>
                </div>

                <div className="form-group" style={{ marginBottom: 24, maxWidth: 340 }}>
                    <input
                        className="input"
                        placeholder="Search hackathons, skills…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                {loading && (
                    <div className="loading-page">
                        <span className="spinner" /> Loading teams…
                    </div>
                )}

                {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}

                {!loading && !error && filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>{search ? 'No matches found' : 'No open teams right now'}</h3>
                        <p>{search ? 'Try a different search term.' : 'Check back soon, or create your own team listing.'}</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="teams-grid">
                        {filtered.map((t) => (
                            applied.has(t._id)
                                ? (
                                    <div className="card" key={t._id} style={{ opacity: 0.65 }}>
                                        <div className="card-header">
                                            <div>
                                                <div className="card-title">{t.hackathonName}</div>
                                                <div className="card-sub">Request sent</div>
                                            </div>
                                            <span className="badge badge-pending">Pending</span>
                                        </div>
                                    </div>
                                )
                                : <TeamCard key={t._id} team={t} onApply={setModal} />
                        ))}
                    </div>
                )}
            </div>

            {modal && (
                <JoinModal
                    team={modal}
                    userEmail={user.email}
                    userName={user.name}
                    onClose={() => setModal(null)}
                    onSubmit={handleApplied}
                />
            )}
        </div>
    );
}
