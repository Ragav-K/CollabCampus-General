import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const TABS = [
    { key: 'sent', label: '📤 Sent Requests' },
    { key: 'received', label: '📥 Received Requests' },
    { key: 'invites', label: '📨 Received Invites' },
];

// ── Sent Requests Tab ─────────────────────────────────────────
function SentRequestsTab({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [withdrawing, setWithdrawing] = useState(null);
    const [memberDetail, setMemberDetail] = useState(null);
    const [joinedMembers, setJoinedMembers] = useState({});

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

    const fetchRequests = useCallback(async () => {
        setLoading(true); setError('');
        try {
            const data = await api(`/api/requests/user/${encodeURIComponent(user.email)}`);
            setRequests(data);
            // Fetch member info for accepted requests
            const acceptedTeamIds = data.filter(r => r.status === 'accepted').map(r => r.teamId);
            if (acceptedTeamIds.length) {
                const memberData = await Promise.allSettled(acceptedTeamIds.map(id => api(`/api/teams/${id}/members`)));
                const accepted = data.filter(r => r.status === 'accepted');
                const map = {};
                accepted.forEach((req, i) => {
                    map[req._id] = memberData[i].status === 'fulfilled' ? memberData[i].value : { leader: null, members: [] };
                });
                setJoinedMembers(map);
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

    if (loading) return <div className="loading-page"><span className="spinner" /> Loading…</div>;
    if (error) return <div className="alert alert-error">{error}</div>;
    if (requests.length === 0) return (
        <div className="empty-state">
            <div className="empty-state-icon">📤</div>
            <h3>No requests sent</h3>
            <p>Find open teams and send a join request to get started.</p>
            <Link to="/join" className="btn btn-primary">Browse Teams</Link>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {requests.map((req) => {
                const team = req.team || {};
                const members = joinedMembers[req._id];
                return (
                    <div className="card" key={req._id} style={req.status === 'accepted' ? { borderLeft: '3px solid var(--success)' } : {}}>
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

                        {req.status === 'accepted' && members && (
                            <div className="alert alert-success" style={{ marginTop: 10, fontSize: '0.83rem' }}>
                                🎉 Accepted! Contact team leader: <strong>{team.leader || team.leaderName}</strong>
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

            {/* Member Detail Popover */}
            {memberDetail && (
                <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setMemberDetail(null)}>
                    <div className="modal" style={{ maxWidth: 360 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)', fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {memberDetail.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <div>
                                <div style={{ fontWeight: 700 }}>{memberDetail.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{memberDetail.email}</div>
                            </div>
                        </div>
                        <button className="btn btn-outline btn-full" onClick={() => setMemberDetail(null)}>Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Received Requests Tab ─────────────────────────────────────
function ReceivedRequestsTab({ user }) {
    const [teams, setTeams] = useState([]);
    const [requests, setRequests] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [acting, setActing] = useState(null);

    useEffect(() => {
        setLoading(true);
        api(`/api/teams/created/${encodeURIComponent(user.email)}`)
            .then(async (myTeams) => {
                setTeams(myTeams);
                const reqMap = {};
                await Promise.all(myTeams.map(async t => {
                    try {
                        const reqs = await api(`/api/requests/team/${t._id}`);
                        reqMap[t._id] = reqs.filter(r => r.status === 'pending');
                    } catch { reqMap[t._id] = []; }
                }));
                setRequests(reqMap);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [user.email]);

    const act = async (reqId, teamId, action) => {
        setActing(reqId + action);
        try {
            await api(`/api/requests/${reqId}/${action}`, { method: 'POST' });
            setRequests(prev => ({
                ...prev,
                [teamId]: prev[teamId].filter(r => r._id !== reqId),
            }));
        } catch (e) { console.error(e); }
        finally { setActing(null); }
    };

    if (loading) return <div className="loading-page"><span className="spinner" /> Loading…</div>;
    if (error) return <div className="alert alert-error">{error}</div>;

    const hasAny = teams.some(t => (requests[t._id] || []).length > 0);
    if (!hasAny) return (
        <div className="empty-state">
            <div className="empty-state-icon">📥</div>
            <h3>No pending requests</h3>
            <p>When people request to join your teams, they'll appear here.</p>
            <Link to="/created" className="btn btn-outline">My Teams</Link>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {teams.filter(t => (requests[t._id] || []).length > 0).map(team => (
                <div key={team._id} className="card">
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{team.hackathonName}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                        {(requests[team._id] || []).length} pending request{(requests[team._id] || []).length !== 1 ? 's' : ''}
                    </div>
                    <div className="request-list">
                        {(requests[team._id] || []).map(req => (
                            <div key={req._id} className="request-item">
                                <div className="request-info">
                                    <strong>{req.userName || req.userEmail}</strong>
                                    <span>{req.userEmail}</span>
                                    {req.userDept && <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                        {req.userDept}{req.userYear ? ` · Year ${req.userYear}` : ''}{req.userGender ? ` · ${req.userGender}` : ''}
                                    </span>}
                                </div>
                                <div className="request-actions">
                                    <button className="btn btn-success btn-sm"
                                        onClick={() => act(req._id, team._id, 'accept')}
                                        disabled={!!acting}>
                                        {acting === req._id + 'accept' ? <span className="spinner" /> : '✓ Accept'}
                                    </button>
                                    <button className="btn btn-danger btn-sm"
                                        onClick={() => act(req._id, team._id, 'decline')}
                                        disabled={!!acting}>
                                        {acting === req._id + 'decline' ? <span className="spinner" /> : '✕ Decline'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ── Received Invites Tab ──────────────────────────────────────
function ReceivedInvitesTab() {
    return (
        <div className="empty-state">
            <div className="empty-state-icon">📨</div>
            <h3>Invites — Coming Soon</h3>
            <p>Team leaders will soon be able to directly invite you to join their team. Stay tuned!</p>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────
export default function Requests({ user }) {
    const [activeTab, setActiveTab] = useState('sent');

    return (
        <div className="page">
            <div className="container">
                <div className="section-head" style={{ marginBottom: 24 }}>
                    <div>
                        <h2>Requests</h2>
                        <p>Manage all your team join requests and invitations in one place.</p>
                    </div>
                </div>

                <div className="tabs" style={{ marginBottom: 24 }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.key}
                            className={`tab-btn${activeTab === tab.key ? ' active' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="tab-content">
                    {activeTab === 'sent' && <SentRequestsTab user={user} />}
                    {activeTab === 'received' && <ReceivedRequestsTab user={user} />}
                    {activeTab === 'invites' && <ReceivedInvitesTab />}
                </div>
            </div>
        </div>
    );
}
