import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';

export default function HackathonDetails({ user }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hackathon, setHackathon] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookmarked, setBookmarked] = useState(false);
    const [bookmarking, setBookmarking] = useState(false);
    // Reminder stored in localStorage (client-only)
    const [reminded, setReminded] = useState(false);

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    useEffect(() => {
        setLoading(true);
        api(`/api/hackathons/${id}`)
            .then(data => {
                setHackathon(data);
                // Load reminder from localStorage
                const reminders = JSON.parse(localStorage.getItem('cc_reminders') || '{}');
                setReminded(!!reminders[data._id]);
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [id]);

    useEffect(() => {
        if (!user || !hackathon) return;
        api(`/api/hackathon/bookmarks/${encodeURIComponent(user.email)}`)
            .then(ids => setBookmarked(ids.includes(hackathon._id)))
            .catch(() => { });
    }, [user, hackathon]);

    const handleBookmark = async () => {
        if (!user) return navigate('/login');
        setBookmarking(true);
        try {
            const res = await api('/api/hackathon/bookmark', {
                method: 'POST',
                body: { userEmail: user.email, hackathonId: hackathon._id },
            });
            setBookmarked(res.bookmarked);
        } catch (e) { console.error(e); }
        finally { setBookmarking(false); }
    };

    const handleReminder = () => {
        if (!hackathon) return;
        const reminders = JSON.parse(localStorage.getItem('cc_reminders') || '{}');
        if (reminded) {
            delete reminders[hackathon._id];
            setReminded(false);
        } else {
            reminders[hackathon._id] = { name: hackathon.name, deadline: hackathon.regDeadline };
            setReminded(true);
        }
        localStorage.setItem('cc_reminders', JSON.stringify(reminders));
    };

    if (loading) return <div className="loading-page"><span className="spinner" /> Loading…</div>;
    if (error) return (
        <div className="page"><div className="container">
            <div className="alert alert-error">{error}</div>
            <button className="btn btn-outline" onClick={() => navigate(-1)}>← Back</button>
        </div></div>
    );
    if (!hackathon) return null;

    const viewTeamsUrl = `/join?hackathon=${encodeURIComponent(hackathon.name)}`;
    const createTeamUrl = `/create?hackathonName=${encodeURIComponent(hackathon.name)}&hackathonPlace=${encodeURIComponent(hackathon.location || '')}&hackathonDate=${encodeURIComponent(hackathon.hackathonDate || '')}`;

    return (
        <div className="page">
            <div className="container" style={{ maxWidth: 760 }}>
                <button className="btn btn-outline btn-sm" style={{ marginBottom: 20 }} onClick={() => navigate(-1)}>
                    ← Back
                </button>


                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
                    <div>
                        <h2 style={{ margin: '0 0 6px' }}>{hackathon.name}</h2>
                        {hackathon.location && (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>📍 {hackathon.location}</div>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                        <button
                            className={`btn btn-sm ${bookmarked ? 'btn-primary' : 'btn-outline'}`}
                            onClick={handleBookmark}
                            disabled={bookmarking}
                            title={bookmarked ? 'Remove bookmark' : 'Bookmark this hackathon'}
                        >
                            {bookmarked ? '🔖 Bookmarked' : '🔖 Bookmark'}
                        </button>
                        <button
                            className={`btn btn-sm ${reminded ? 'btn-primary' : 'btn-outline'}`}
                            onClick={handleReminder}
                            title={reminded ? 'Remove reminder' : 'Set reminder'}
                        >
                            {reminded ? '🔔 Reminded' : '🔔 Remind me'}
                        </button>
                    </div>
                </div>

                {/* Info grid */}
                <div className="card" style={{ marginBottom: 20 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px 24px', padding: '4px 0' }}>
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Hackathon Date</div>
                            <div style={{ fontWeight: 600 }}>📅 {fmt(hackathon.hackathonDate)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Registration Deadline</div>
                            <div style={{ fontWeight: 600, color: 'var(--danger, #ef4444)' }}>⏰ {fmt(hackathon.regDeadline)}</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Teams Formed</div>
                            <div style={{ fontWeight: 600 }}>👥 {hackathon.teamCount || 0} team{hackathon.teamCount !== 1 ? 's' : ''}</div>
                        </div>
                        {hackathon.location && (
                            <div>
                                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Location</div>
                                <div style={{ fontWeight: 600 }}>📍 {hackathon.location}</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Description */}
                {hackathon.description && (
                    <div className="card" style={{ marginBottom: 24 }}>
                        <h3 style={{ marginTop: 0, marginBottom: 12 }}>About this Hackathon</h3>
                        <p style={{ margin: 0, lineHeight: 1.7, color: 'var(--text-muted)' }}>{hackathon.description}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <Link to={viewTeamsUrl} className="btn btn-outline" style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
                        🔍 View Teams
                    </Link>
                    <Link to={createTeamUrl} className="btn btn-primary" style={{ flex: 1, minWidth: 140, textAlign: 'center' }}>
                        ⚡ Create a Team
                    </Link>
                </div>
            </div>
        </div>
    );
}
