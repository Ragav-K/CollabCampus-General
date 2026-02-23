import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';

// Helper: compatibility badge
function CompatBadge({ score, label, loading }) {
    if (loading) return <span className="compat-badge loading">Scoring…</span>;
    if (score === null || score === undefined) return null;
    const cls = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
    const icon = score >= 75 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    return <span className={`compat-badge ${cls}`}>{icon} {score}% — {label}</span>;
}

function CompatBar({ score }) {
    if (score === null || score === undefined) return null;
    const cls = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
    return (
        <div className="compat-bar-wrap">
            <div className="compat-bar">
                <div className="compat-bar-fill" style={{ width: `${score}%` }} />
            </div>
            <span className={`compat-bar-fill ${cls}`} style={{ width: 'auto', background: 'none', fontSize: '0.75rem', fontWeight: 600 }}>{score}%</span>
        </div>
    );
}

function ApplyModal({ team, user, onClose, onApplied }) {
    const [form, setForm] = useState({ message: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api('/api/requests', {
                body: {
                    teamId: team._id, userEmail: user.email, userName: user.name,
                    userDept: user.dept || '', userYear: user.year || '',
                    userGender: user.gender || '', message: form.message,
                },
            });
            onApplied(team._id);
            onClose();
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    };

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal">
                <h3 style={{ marginBottom: 4 }}>Apply to {team.hackathonName}</h3>
                <p style={{ marginBottom: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Led by {team.leaderName}
                </p>
                {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="label">Message (optional)</label>
                        <textarea className="textarea" rows={3} placeholder="Tell the leader why you're a great fit…"
                            value={form.message} onChange={e => setForm({ message: e.target.value })} />
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
                            {loading ? <span className="spinner" /> : 'Send request'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function JoinTeam({ user }) {
    const [teams, setTeams] = useState([]);
    const [scores, setScores] = useState({});       // { teamId: { score, label, breakdown } }
    const [scoringLoading, setScoringLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [applied, setApplied] = useState(new Set());
    const [modal, setModal] = useState(null);
    const [sortByScore, setSortByScore] = useState(true);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api(`/api/teams${user?.email ? `?email=${encodeURIComponent(user.email)}` : ''}`);
            setTeams(data);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, [user]);

    const fetchScores = useCallback(async (teamList) => {
        if (!user?.email || !teamList.length) return;
        setScoringLoading(true);
        try {
            const result = await api('/api/compatibility/batch', {
                method: 'POST',
                body: { teamIds: teamList.map(t => t._id), userEmail: user.email },
            });
            setScores(result);
        } catch { /* silently skip scoring if engine unavailable */ }
        finally { setScoringLoading(false); }
    }, [user]);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);
    useEffect(() => { if (teams.length) fetchScores(teams); }, [teams, fetchScores]);

    const filtered = teams.filter(t =>
        !search || [t.hackathonName, t.leaderName, t.hackathonPlace, ...(t.skillsNeeded || [])]
            .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const sorted = [...filtered].sort((a, b) => {
        if (!sortByScore) return 0;
        const sa = scores[a._id]?.score ?? -1;
        const sb = scores[b._id]?.score ?? -1;
        return sb - sa;
    });

    const spotsLeft = (t) => (t.maxMembers || 0) - (t.members?.length || 0) - 1;

    return (
        <div className="page">
            <div className="container">
                <div className="section-head">
                    <div>
                        <h2>Browse Teams</h2>
                        <p>Teams are ranked by your compatibility score.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                        {user && (
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <input type="checkbox" checked={sortByScore} onChange={e => setSortByScore(e.target.checked)} />
                                Sort by match
                            </label>
                        )}
                        <input className="input" style={{ width: 220 }} placeholder="Search teams…"
                            value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                </div>

                {loading ? (
                    <div className="loading-page"><span className="spinner" /> Loading teams…</div>
                ) : sorted.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">🔍</div>
                        <h3>No teams found</h3>
                        <p>Try a different search or check back later.</p>
                    </div>
                ) : (
                    <div className="teams-grid">
                        {sorted.map(team => {
                            const sc = scores[team._id];
                            const isApplied = applied.has(team._id);
                            const spots = spotsLeft(team);
                            return (
                                <div key={team._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12, opacity: isApplied ? 0.6 : 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <div>
                                            <h3 className="card-title" style={{ marginBottom: 2 }}>{team.hackathonName}</h3>
                                            <p style={{ fontSize: '0.8rem', margin: 0 }}>{team.hackathonPlace}</p>
                                        </div>
                                        {user && <CompatBadge score={sc?.score} label={sc?.label} loading={scoringLoading && !sc} />}
                                    </div>

                                    {user && sc && <CompatBar score={sc.score} />}

                                    <div className="meta-row">
                                        <span className="meta-item">👤 {team.leaderName}</span>
                                        <span className="meta-item">🪑 {spots} spot{spots !== 1 ? 's' : ''} left</span>
                                        {team.lastDate && <span className="meta-item">📅 {new Date(team.lastDate).toLocaleDateString()}</span>}
                                    </div>

                                    {team.preferredGender && team.preferredGender !== 'No Preference' && (
                                        <span className={`badge badge-g${team.preferredGender === 'Male' ? 'm' : 'f'}`}>
                                            Prefers {team.preferredGender}
                                        </span>
                                    )}

                                    {team.skillsNeeded?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                            {team.skillsNeeded.map(s => <span key={s} className="badge badge-skill">{s}</span>)}
                                        </div>
                                    )}

                                    {sc?.breakdown && (
                                        <details style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                            <summary style={{ cursor: 'pointer', marginBottom: 6 }}>Score breakdown</summary>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', paddingTop: 4 }}>
                                                {[
                                                    ['Skill Coverage', sc.breakdown.skillComp],
                                                    ['Diversity', sc.breakdown.diversity],
                                                    ['Exp. Balance', sc.breakdown.expBalance],
                                                    ['Gender Match', sc.breakdown.genderMatch],
                                                    ['Role Fit', sc.breakdown.roleFit],
                                                ].map(([label, val]) => (
                                                    <span key={label}>{label}: <strong>{val}%</strong></span>
                                                ))}
                                            </div>
                                        </details>
                                    )}

                                    {team.problemStatement && (
                                        <p style={{ fontSize: '0.82rem', margin: 0 }}>{team.problemStatement.slice(0, 120)}{team.problemStatement.length > 120 ? '…' : ''}</p>
                                    )}

                                    <div className="card-footer" style={{ marginTop: 'auto', paddingTop: 12 }}>
                                        {isApplied ? (
                                            <span className="badge badge-pending">Request sent</span>
                                        ) : (
                                            <button className="btn btn-primary btn-sm"
                                                onClick={() => setModal(team)} disabled={spots <= 0}>
                                                {spots <= 0 ? 'Full' : 'Apply'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {modal && (
                <ApplyModal team={modal} user={user} onClose={() => setModal(null)}
                    onApplied={id => setApplied(s => new Set([...s, id]))} />
            )}
        </div>
    );
}
