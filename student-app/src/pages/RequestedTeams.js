import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function RequestedTeams({ user }) {
    const [requests, setRequests] = useState([]);
    const [joinedTeams, setJoinedTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [withdrawing, setWithdrawing] = useState(null);
    const [memberDetail, setMemberDetail] = useState(null); // user object to show in popover

    const fetchRequests = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const data = await api(`/api/requests/user/${encodeURIComponent(user.email)}`);
            setRequests(data);
            // Collect teams where accepted — fetch their member details
            const acceptedTeamIds = data.filter(r => r.status === 'accepted').map(r => r.teamId);
            if (acceptedTeamIds.length) {
                const memberData = await Promise.allSettled(
                    acceptedTeamIds.map(id => api(`/api/teams/${id}/members`))
                );
                const accepted = data.filter(r => r.status === 'accepted');
                setJoinedTeams(accepted.map((req, i) => ({
                    req,
                    members: memberData[i].status === 'fulfilled' ? memberData[i].value : { leader: null, members: [] },
                })));
            }
        } catch (err) { setError(err.message); }
        finally { setLoading(false); }
    }, [user.email]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleWithdraw = async (req) => {
        if (!window.confirm('Withdraw this request?')) return;
        setWithdrawing(req._id);
        try {
            await api(`/api/requests/${req.teamId}/${encodeURIComponent(user.email)}`, { method: 'DELETE' });
            setRequests(r => r.filter(x => x._id !== req._id));
        } catch (e) { console.error(e); }
        finally { setWithdrawing(null); }
    };

    const statusBadge = (status) => ({
        pending: <span className="badge badge-pending">⏳ Pending</span>,
        accepted: <span className="badge badge-accepted">✓ Accepted</span>,
        declined: <span className="badge badge-declined">✕ Declined</span>,
    }[status] || null);

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    return (
        <div className="page">
            <div className="container">

                {/* ── Joined Teams ── */}
                {joinedTeams.length > 0 && (
                    <section style={{ marginBottom: 40 }}>
                        <div className="section-head" style={{ marginBottom: 16 }}>
                            <div>
                                <h2>🎉 Teams I've Joined</h2>
                                <p>Hackathon teams where your request was accepted.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            {joinedTeams.map(({ req, members }) => {
                                const team = req.team || {};
                                const allMembers = [
                                    members.leader ? { ...members.leader, isLeader: true } : null,
                                    ...(members.members || []),
                                ].filter(Boolean);
                                return (
                                    <div className="card" key={req._id} style={{ borderLeft: '3px solid var(--success)' }}>
                                        <div className="card-header">
                                            <div>
                                                <div className="card-title">{team.hackathonName || 'Team'}</div>
                                                <div className="card-sub">
                                                    {team.hackathonPlace && `${team.hackathonPlace} · `}
                                                    {team.hackathonDate && `Event: ${fmt(team.hackathonDate)}`}
                                                    {team.lastDate && ` · Apply by: ${fmt(team.lastDate)}`}
                                                </div>
                                            </div>
                                            <span className="badge badge-accepted">✓ Member</span>
                                        </div>

                                        {team.skillsNeeded?.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '4px 0 8px' }}>
                                                {team.skillsNeeded.map(s => <span key={s} className="badge badge-skill">{s}</span>)}
                                            </div>
                                        )}

                                        {/* Team Members */}
                                        {allMembers.length > 0 && (
                                            <div style={{ marginTop: 12 }}>
                                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Team Members</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {allMembers.map(m => (
                                                        <button key={m.email} type="button" onClick={() => setMemberDetail(m)}
                                                            style={{ all: 'unset', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '5px 10px' }}>
                                                            <div style={{ width: 26, height: 26, borderRadius: '50%', background: m.isLeader ? 'var(--accent-light)' : '#f4f4f5', color: m.isLeader ? 'var(--accent)' : 'var(--text)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' }}>
                                                                {m.name?.charAt(0)?.toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{m.name} {m.isLeader ? '👑' : ''}</div>
                                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{m.dept}{m.year ? ` · Yr ${m.year}` : ''}</div>
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="alert alert-success" style={{ marginTop: 12, fontSize: '0.83rem' }}>
                                            🎉 Contact the team leader: <strong>{team.leader || team.leaderName}</strong>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* ── All Requests ── */}
                <div className="section-head" style={{ marginBottom: 16 }}>
                    <div>
                        <h2>My Requests</h2>
                        <p>Join requests you've sent to hackathon teams.</p>
                    </div>
                    <Link to="/join" className="btn btn-outline btn-sm">Browse teams</Link>
                </div>

                {loading && <div className="loading-page"><span className="spinner" /> Loading…</div>}
                {error && <div className="alert alert-error">{error}</div>}

                {!loading && !error && requests.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">📌</div>
                        <h3>No requests sent</h3>
                        <p>Find open teams and send a join request to get started.</p>
                        <Link to="/join" className="btn btn-primary">Browse teams</Link>
                    </div>
                )}

                {!loading && requests.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {requests.map((req) => {
                            const team = req.team || {};
                            return (
                                <div className="card" key={req._id}>
                                    <div className="card-header">
                                        <div>
                                            <div className="card-title">{team.hackathonName || 'Team listing unavailable'}</div>
                                            <div className="card-sub">
                                                {team.leaderName && `Led by ${team.leaderName}`}
                                                {team.hackathonPlace && ` · ${team.hackathonPlace}`}
                                                {team.hackathonDate && ` · Event: ${fmt(team.hackathonDate)}`}
                                                {team.lastDate && ` · Apply by: ${fmt(team.lastDate)}`}
                                            </div>
                                        </div>
                                        {statusBadge(req.status)}
                                    </div>

                                    {team.skillsNeeded?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '4px 0 8px' }}>
                                            {team.skillsNeeded.map(s => <span key={s} className="badge badge-skill">{s}</span>)}
                                        </div>
                                    )}

                                    {req.status === 'pending' && (
                                        <div className="card-footer" style={{ paddingTop: 12, marginTop: 8 }}>
                                            <button className="btn btn-danger btn-sm"
                                                onClick={() => handleWithdraw(req)}
                                                disabled={withdrawing === req._id}>
                                                {withdrawing === req._id ? <span className="spinner" /> : 'Withdraw'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Member Detail Popover */}
            {memberDetail && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMemberDetail(null)}>
                    <div className="modal" style={{ maxWidth: 360 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {memberDetail.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{memberDetail.name} {memberDetail.isLeader ? '👑 (Leader)' : ''}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{memberDetail.email}</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px', fontSize: '0.85rem', marginBottom: 16 }}>
                            {memberDetail.dept && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>DEPT</div><strong>{memberDetail.dept}</strong></div>}
                            {memberDetail.year && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>YEAR</div><strong>{memberDetail.year}</strong></div>}
                            {memberDetail.gender && <div><div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>GENDER</div><strong>{memberDetail.gender}</strong></div>}
                        </div>
                        {memberDetail.preferredRoles?.length > 0 && (
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 6 }}>ROLES</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                    {memberDetail.preferredRoles.map(r => <span key={r} className="badge badge-skill">{r}</span>)}
                                </div>
                            </div>
                        )}
                        <button className="btn btn-outline btn-full" style={{ marginTop: 4 }} onClick={() => setMemberDetail(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
