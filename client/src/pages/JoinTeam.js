import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api';

// ── Compat Badge ──────────────────────────────────────────────
function CompatBadge({ score, label, loading }) {
    if (loading) return <span className="compat-badge loading">Scoring…</span>;
    if (score === null || score === undefined) return null;
    const cls = score >= 75 ? 'high' : score >= 50 ? 'mid' : 'low';
    const icon = score >= 75 ? '🟢' : score >= 50 ? '🟡' : '🔴';
    return <span className={`compat-badge ${cls}`}>{icon} {score}% — {label}</span>;
}

// ── User Detail Popover (shown on member click) ────────────────
function UserDetailPopover({ u, onClose }) {
    if (!u) return null;
    const LEVEL_LABELS = ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    const skills = u.skillStrengths
        ? (u.skillStrengths instanceof Object ? Object.entries(u.skillStrengths) : [])
        : [];
    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 380 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {u.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{u.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.85rem', marginBottom: 16 }}>
                    {u.dept && <div><span style={{ color: 'var(--text-muted)' }}>Dept</span><br /><strong>{u.dept}</strong></div>}
                    {u.year && <div><span style={{ color: 'var(--text-muted)' }}>Year</span><br /><strong>{u.year}</strong></div>}
                    {u.gender && <div><span style={{ color: 'var(--text-muted)' }}>Gender</span><br /><strong>{u.gender}</strong></div>}
                    {u.preferredRoles?.length > 0 && (
                        <div style={{ gridColumn: '1 / -1' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Roles</span><br />
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                                {u.preferredRoles.map(r => <span key={r} className="badge badge-skill">{r}</span>)}
                            </div>
                        </div>
                    )}
                </div>
                {skills.length > 0 && (
                    <div style={{ fontSize: '0.85rem' }}>
                        <div style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Skills</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {skills.map(([skill, level]) => (
                                <div key={skill} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{skill}</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>{LEVEL_LABELS[level] || level}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                <button className="btn btn-outline btn-full" style={{ marginTop: 20 }} onClick={onClose}>Close</button>
            </div>
        </div>
    );
}

// ── Team Detail Modal ──────────────────────────────────────────
function TeamDetailModal({ team, user, onClose, onApply, isApplied }) {
    const [members, setMembers] = useState([]);
    const [leader, setLeader] = useState(null);
    const [loadingMembers, setLoadingMembers] = useState(true);
    const [selectedUser, setSelectedUser] = useState(null);

    useEffect(() => {
        if (!team) return;
        (async () => {
            setLoadingMembers(true);
            try {
                const data = await api(`/api/teams/${team._id}/members`);
                setLeader(data.leader);
                setMembers(data.members || []);
            } catch { /* ignore */ }
            finally { setLoadingMembers(false); }
        })();
    }, [team]);

    if (!team) return null;
    const spots = team.maxMembers - (team.members?.length || 0) - 1;

    return (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="modal" style={{ maxWidth: 480 }}>
                <h3 style={{ marginBottom: 4 }}>{team.hackathonName}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>{team.hackathonPlace}</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.85rem', marginBottom: 16 }}>
                    {team.hackathonDate && (
                        <div><span style={{ color: 'var(--text-muted)' }}>Hackathon Date</span><br />
                            <strong>{new Date(team.hackathonDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                    )}
                    {team.lastDate && (
                        <div><span style={{ color: 'var(--text-muted)' }}>Apply By</span><br />
                            <strong>{new Date(team.lastDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                    )}
                    <div><span style={{ color: 'var(--text-muted)' }}>Spots Left</span><br /><strong>{spots} / {team.maxMembers - 1}</strong></div>
                    {team.preferredGender && team.preferredGender !== 'No Preference' && (
                        <div><span style={{ color: 'var(--text-muted)' }}>Preferred</span><br /><strong>{team.preferredGender}</strong></div>
                    )}
                </div>

                {team.skillsNeeded?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skills Needed</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                            {team.skillsNeeded.map(s => <span key={s} className="badge badge-skill">{s}</span>)}
                        </div>
                    </div>
                )}

                {team.problemStatement && (
                    <div style={{ fontSize: '0.83rem', marginBottom: 16, color: 'var(--text-muted)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Problem Statement</div>
                        {team.problemStatement}
                    </div>
                )}

                {/* Leader */}
                <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Team Leader</div>
                    {loadingMembers ? <span className="spinner" /> : (
                        leader ? (
                            <button onClick={() => setSelectedUser(leader)} style={{ all: 'unset', cursor: 'pointer' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                                        {leader.name?.charAt(0)?.toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{leader.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{[leader.dept, leader.year ? `Year ${leader.year}` : null].filter(Boolean).join(' · ')}</div>
                                    </div>
                                </div>
                            </button>
                        ) : (
                            <div style={{ fontSize: '0.875rem' }}>{team.leaderName} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>(profile not set)</span></div>
                        )
                    )}
                </div>

                {/* Members */}
                {!loadingMembers && members.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Accepted Members</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {members.map(m => (
                                <button key={m.email} onClick={() => setSelectedUser(m)} style={{ all: 'unset', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f4f4f5', color: 'var(--text)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem' }}>
                                            {m.name?.charAt(0)?.toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{m.name}</div>
                                            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{[m.dept, m.year ? `Year ${m.year}` : null].filter(Boolean).join(' · ')}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                    {isApplied ? (
                        <span className="badge badge-pending" style={{ padding: '8px 16px' }}>Request sent</span>
                    ) : (
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { onApply(team); onClose(); }} disabled={spots <= 0}>
                            {spots <= 0 ? 'Team Full' : 'Apply to Team'}
                        </button>
                    )}
                    <button className="btn btn-outline" onClick={onClose}>Close</button>
                </div>
            </div>
            {selectedUser && <UserDetailPopover u={selectedUser} onClose={() => setSelectedUser(null)} />}
        </div>
    );
}

// ── Apply Modal ────────────────────────────────────────────────
function ApplyModal({ team, user, onClose, onApplied }) {
    const [message, setMessage] = useState('');
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
                    userGender: user.gender || '', message,
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
                <p style={{ marginBottom: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>Led by {team.leaderName}</p>
                {error && <div className="alert alert-error" style={{ marginBottom: 14 }}>{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group" style={{ marginBottom: 20 }}>
                        <label className="label">Message (optional)</label>
                        <textarea className="textarea" rows={3} placeholder="Tell the leader why you're a great fit…"
                            value={message} onChange={e => setMessage(e.target.value)} />
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

// ── Main ───────────────────────────────────────────────────────
export default function JoinTeam({ user }) {
    const [teams, setTeams] = useState([]);
    const [scores, setScores] = useState({});
    const [scoringLoading, setScoringLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [applied, setApplied] = useState(new Set());
    const [applyModal, setApplyModal] = useState(null);
    const [detailModal, setDetailModal] = useState(null);
    const [sortByScore, setSortByScore] = useState(true);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        try {
            // Pass both email (hide own teams) and excludeRequested (hide already-applied)
            const params = user?.email
                ? `?email=${encodeURIComponent(user.email)}&excludeRequested=${encodeURIComponent(user.email)}`
                : '';
            const data = await api(`/api/teams${params}`);
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
        } catch { /* silently skip */ }
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
        return (scores[b._id]?.score ?? -1) - (scores[a._id]?.score ?? -1);
    });

    // spots: maxMembers - 1 (leader) - members.length (accepted non-leader members)
    const spotsLeft = (t) => (t.maxMembers || 0) - 1 - (t.members?.length || 0);

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    return (
        <div className="page">
            <div className="container">
                <div className="section-head">
                    <div>
                        <h2>Browse Teams</h2>
                        <p>Click a card to see full team details.</p>
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
                        <p>Try a different search, or you've already applied to all available teams.</p>
                    </div>
                ) : (
                    <div className="teams-grid">
                        {sorted.map(team => {
                            const sc = scores[team._id];
                            const isApplied = applied.has(team._id);
                            const spots = spotsLeft(team);
                            return (
                                <div key={team._id} className="card"
                                    style={{ display: 'flex', flexDirection: 'column', gap: 10, cursor: 'pointer', opacity: isApplied ? 0.6 : 1 }}
                                    onClick={() => setDetailModal(team)}>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                        <div>
                                            <h3 className="card-title" style={{ marginBottom: 2 }}>{team.hackathonName}</h3>
                                            <p style={{ fontSize: '0.8rem', margin: 0, color: 'var(--text-muted)' }}>{team.hackathonPlace}</p>
                                        </div>
                                        {user && <CompatBadge score={sc?.score} label={sc?.label} loading={scoringLoading && !sc} />}
                                    </div>

                                    <div className="meta-row">
                                        <span className="meta-item">👤 {team.leaderName}</span>
                                        <span className="meta-item">🪑 {spots} spot{spots !== 1 ? 's' : ''} left</span>
                                    </div>

                                    {/* Both dates */}
                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {team.hackathonDate && <span>📅 Event: {fmt(team.hackathonDate)}</span>}
                                        {team.lastDate && <span>⏰ Apply by: {fmt(team.lastDate)}</span>}
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
                                        <details style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }} onClick={e => e.stopPropagation()}>
                                            <summary style={{ cursor: 'pointer', marginBottom: 6 }}>Score breakdown</summary>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 12px', paddingTop: 4 }}>
                                                {[['Skill', sc.breakdown.skillComp], ['Diversity', sc.breakdown.diversity], ['Exp.', sc.breakdown.expBalance], ['Gender', sc.breakdown.genderMatch], ['Role', sc.breakdown.roleFit]].map(([l, v]) => (
                                                    <span key={l}>{l}: <strong>{v}%</strong></span>
                                                ))}
                                            </div>
                                        </details>
                                    )}

                                    <div className="card-footer" style={{ marginTop: 'auto', paddingTop: 10 }} onClick={e => e.stopPropagation()}>
                                        {isApplied ? (
                                            <span className="badge badge-pending">Request sent</span>
                                        ) : (
                                            <button className="btn btn-primary btn-sm"
                                                onClick={e => { e.stopPropagation(); setApplyModal(team); }}
                                                disabled={spots <= 0}>
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

            {detailModal && (
                <TeamDetailModal team={detailModal} user={user}
                    onClose={() => setDetailModal(null)}
                    onApply={t => setApplyModal(t)}
                    isApplied={applied.has(detailModal._id)} />
            )}
            {applyModal && (
                <ApplyModal team={applyModal} user={user}
                    onClose={() => setApplyModal(null)}
                    onApplied={id => { setApplied(s => new Set([...s, id])); setTeams(t => t.filter(x => String(x._id) !== String(id))); }} />
            )}
        </div>
    );
}
