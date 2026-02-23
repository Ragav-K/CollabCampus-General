import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function RequestedTeams({ user }) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [withdrawing, setWithdrawing] = useState(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api(`/api/requests/user/${encodeURIComponent(user.email)}`);
            setRequests(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user.email]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleWithdraw = async (req) => {
        if (!window.confirm('Withdraw this request?')) return;
        setWithdrawing(req._id);
        try {
            await api(`/api/requests/${req.teamId}/${encodeURIComponent(user.email)}`, { method: 'DELETE' });
            setRequests((r) => r.filter((x) => x._id !== req._id));
        } catch (e) {
            console.error(e);
        } finally {
            setWithdrawing(null);
        }
    };

    const statusBadge = (status) => ({
        pending: <span className="badge badge-pending">⏳ Pending</span>,
        accepted: <span className="badge badge-accepted">✓ Accepted</span>,
        declined: <span className="badge badge-declined">✕ Declined</span>,
    }[status] || null);

    return (
        <div className="page">
            <div className="container">
                <div className="section-head">
                    <div>
                        <h2>My requests</h2>
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
                                            <div className="card-title">
                                                {team.hackathonName || 'Team listing unavailable'}
                                            </div>
                                            <div className="card-sub">
                                                {team.leaderName && `Led by ${team.leaderName}`}
                                                {team.hackathonPlace && ` · ${team.hackathonPlace}`}
                                                {team.hackathonDate && ` · ${new Date(team.hackathonDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                                            </div>
                                        </div>
                                        {statusBadge(req.status)}
                                    </div>

                                    {(req.userStrengths || req.userProblemStatement) && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
                                            {req.userStrengths && (
                                                <div style={{ fontSize: '0.83rem' }}>
                                                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>Your skills: </span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{req.userStrengths}</span>
                                                </div>
                                            )}
                                            {req.userProblemStatement && (
                                                <div style={{ fontSize: '0.83rem' }}>
                                                    <span style={{ fontWeight: 500, color: 'var(--text)' }}>Your PS: </span>
                                                    <span style={{ color: 'var(--text-muted)' }}>{req.userProblemStatement}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {team.skillsNeeded?.length > 0 && (
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '4px 0 8px' }}>
                                            {team.skillsNeeded.map((s) => <span key={s} className="badge badge-skill">{s}</span>)}
                                        </div>
                                    )}

                                    {req.status === 'accepted' && req.team?.leader && (
                                        <div className="alert alert-success" style={{ marginTop: 8, fontSize: '0.83rem' }}>
                                            🎉 You're in! Contact the team leader at <strong>{req.team.leader}</strong>
                                            {team.leaderName && ` (${team.leaderName})`}.
                                        </div>
                                    )}

                                    {req.status === 'pending' && (
                                        <div className="card-footer" style={{ paddingTop: 12, marginTop: 8 }}>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleWithdraw(req)}
                                                disabled={withdrawing === req._id}
                                            >
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
        </div>
    );
}
