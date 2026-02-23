import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

function RequestRow({ req, onAccept, onDecline }) {
    const [loading, setLoading] = useState(null);

    const act = async (action) => {
        setLoading(action);
        try {
            await api(`/api/requests/${req._id}/${action}`, { method: 'POST' });
            action === 'accept' ? onAccept(req._id) : onDecline(req._id);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(null);
        }
    };

    const statusBadge = {
        pending: <span className="badge badge-pending">Pending</span>,
        accepted: <span className="badge badge-accepted">Accepted</span>,
        declined: <span className="badge badge-declined">Declined</span>,
    }[req.status] || null;

    return (
        <div className="request-item">
            <div className="request-info">
                <strong>{req.userName || req.userEmail}</strong>
                <span>{req.userEmail}</span>
                {req.userStrengths && (
                    <span style={{ marginTop: 2, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {req.userStrengths.length > 80 ? req.userStrengths.slice(0, 80) + '…' : req.userStrengths}
                    </span>
                )}
                {req.userWhatsapp && (
                    <span style={{ fontSize: '0.78rem' }}>📱 {req.userWhatsapp}</span>
                )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                {statusBadge}
                {req.status === 'pending' && (
                    <div className="request-actions">
                        <button
                            className="btn btn-success btn-sm"
                            onClick={() => act('accept')}
                            disabled={!!loading}
                        >
                            {loading === 'accept' ? <span className="spinner" /> : '✓ Accept'}
                        </button>
                        <button
                            className="btn btn-danger btn-sm"
                            onClick={() => act('decline')}
                            disabled={!!loading}
                        >
                            {loading === 'decline' ? <span className="spinner" /> : '✕ Decline'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function TeamPanel({ team, onDelete }) {
    const [open, setOpen] = useState(false);
    const [requests, setRequests] = useState([]);
    const [loadingReqs, setLoadingReqs] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const fetchRequests = useCallback(async () => {
        if (!open) return;
        setLoadingReqs(true);
        try {
            const data = await api(`/api/requests/team/${team._id}`);
            setRequests(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingReqs(false);
        }
    }, [open, team._id]);

    useEffect(() => { fetchRequests(); }, [fetchRequests]);

    const handleAccept = (id) =>
        setRequests((r) => r.map((x) => x._id === id ? { ...x, status: 'accepted' } : x));
    const handleDecline = (id) =>
        setRequests((r) => r.map((x) => x._id === id ? { ...x, status: 'declined' } : x));

    const handleDelete = async () => {
        if (!window.confirm(`Delete "${team.hackathonName}"? This cannot be undone.`)) return;
        setDeleting(true);
        try {
            await api(`/api/teams/${team._id}`, { method: 'DELETE' });
            onDelete(team._id);
        } catch (e) {
            console.error(e);
            setDeleting(false);
        }
    };

    const spotsLeft = team.maxMembers - (team.members?.length || 0);
    const pending = requests.filter((r) => r.status === 'pending').length;

    return (
        <div className="card">
            <div className="card-header">
                <div>
                    <div className="card-title">{team.hackathonName}</div>
                    <div className="card-sub">
                        {team.hackathonPlace && `${team.hackathonPlace} · `}
                        {team.hackathonDate && new Date(team.hackathonDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span style={{
                        fontSize: '0.75rem', fontWeight: 600, padding: '2px 10px', borderRadius: 100,
                        color: spotsLeft > 0 ? 'var(--success)' : 'var(--text-muted)',
                        background: spotsLeft > 0 ? 'var(--success-light)' : '#f4f4f5',
                        border: `1px solid ${spotsLeft > 0 ? '#a7f3d0' : '#e4e4e7'}`,
                    }}>
                        {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
                    </span>
                    {pending > 0 && (
                        <span className="badge badge-pending">{pending} pending</span>
                    )}
                </div>
            </div>

            {team.skillsNeeded?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {team.skillsNeeded.map((s) => <span key={s} className="badge badge-skill">{s}</span>)}
                </div>
            )}

            <div className="card-footer">
                <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setOpen((o) => !o)}
                >
                    {open ? '▲ Hide requests' : `▼ View requests${requests.length ? ` (${requests.length})` : ''}`}
                </button>
                <button className="btn btn-danger btn-sm" onClick={handleDelete} disabled={deleting} style={{ marginLeft: 'auto' }}>
                    {deleting ? <span className="spinner" /> : 'Delete'}
                </button>
            </div>

            {open && (
                <div style={{ marginTop: 16 }}>
                    {loadingReqs && <div className="loading-page" style={{ minHeight: 60 }}><span className="spinner" /></div>}
                    {!loadingReqs && requests.length === 0 && (
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                            No join requests yet.
                        </p>
                    )}
                    {!loadingReqs && requests.length > 0 && (
                        <div className="request-list">
                            {requests.map((r) => (
                                <RequestRow key={r._id} req={r} onAccept={handleAccept} onDecline={handleDecline} />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function CreatedTeams({ user }) {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await api(`/api/teams/created/${encodeURIComponent(user.email)}`);
            setTeams(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user.email]);

    useEffect(() => { fetchTeams(); }, [fetchTeams]);

    const handleDelete = (id) => setTeams((t) => t.filter((x) => x._id !== id));

    return (
        <div className="page">
            <div className="container">
                <div className="section-head">
                    <div>
                        <h2>My teams</h2>
                        <p>Teams you've created and their join requests.</p>
                    </div>
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
                        {teams.map((t) => (
                            <TeamPanel key={t._id} team={t} onDelete={handleDelete} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
