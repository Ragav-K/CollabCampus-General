import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const FEATURES = [
    { icon: '🔍', title: 'Browse Open Teams', desc: 'Find hackathon teams actively looking for members.' },
    { icon: '⚡', title: 'Post Your Team', desc: 'Create a listing, specify skills needed and let teammates come to you.' },
    { icon: '📬', title: 'Send Join Requests', desc: 'Apply with your strengths and problem statement in seconds.' },
    { icon: '✅', title: 'Accept or Decline', desc: 'Team leaders review requests and build their crew.' },
];

function HackathonCard({ h }) {
    const navigate = useNavigate();
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const handleCardClick = (e) => {
        // Only navigate if they didn't click a button
        if (e.target.closest('button') || e.target.closest('a')) return;
        navigate(`/hackathons/${h._id}`);
    };

    const viewTeamsUrl = `/join?hackathon=${encodeURIComponent(h.name)}`;
    const createTeamUrl = `/create?hackathonName=${encodeURIComponent(h.name)}&hackathonPlace=${encodeURIComponent(h.location || '')}&hackathonDate=${encodeURIComponent(h.hackathonDate || '')}`;

    return (
        <div className="hackathon-card" onClick={handleCardClick} style={{ cursor: 'pointer' }}>
            <div className="hack-poster hack-poster-placeholder">🏆</div>
            <div className="hack-card-body">
                <div className="hack-name">{h.name}</div>
                <div className="hack-meta">
                    {h.location && <span>📍 {h.location}</span>}
                    {h.hackathonDate && <span>📅 {fmt(h.hackathonDate)}</span>}
                    <span>⏰ Reg. by {fmt(h.regDeadline)}</span>
                    <span>👥 {h.teamCount || 0} team{h.teamCount !== 1 ? 's' : ''} formed</span>
                </div>
                <div className="hack-action-btns">
                    <Link to={viewTeamsUrl} className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                        🔍 View Teams
                    </Link>
                    <Link to={createTeamUrl} className="btn btn-primary btn-sm" onClick={e => e.stopPropagation()}>
                        ⚡ Create Team
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function Home({ user }) {
    const [hackathons, setHackathons] = useState([]);
    const [loadingHacks, setLoadingHacks] = useState(false);

    useEffect(() => {
        if (!user) return;
        setLoadingHacks(true);
        api('/api/hackathons')
            .then(data => setHackathons(data.slice(0, 5)))
            .catch(() => { })
            .finally(() => setLoadingHacks(false));
    }, [user]);

    if (user) {
        return (
            <main className="page">
                <div className="container">
                    <div style={{ marginBottom: 8 }}>
                        <span className="hero-eyebrow">👋 Welcome back</span>
                    </div>
                    <h2>Hey, {user.name || user.email.split('@')[0]}.</h2>
                    <p style={{ marginTop: 6, marginBottom: 0 }}>What do you want to do today?</p>

                    <div className="dash-grid">
                        <Link to="/join" className="dash-card">
                            <div className="dash-card-icon">🔍</div>
                            <div>
                                <h3>Browse Teams</h3>
                                <p>Find open hackathon teams</p>
                            </div>
                        </Link>
                        <Link to="/create" className="dash-card">
                            <div className="dash-card-icon">⚡</div>
                            <div>
                                <h3>Create a Team</h3>
                                <p>Post your hackathon listing</p>
                            </div>
                        </Link>
                        <Link to="/created" className="dash-card">
                            <div className="dash-card-icon">📂</div>
                            <div>
                                <h3>My Teams</h3>
                                <p>Manage teams you created</p>
                            </div>
                        </Link>
                        <Link to="/requests" className="dash-card">
                            <div className="dash-card-icon">📌</div>
                            <div>
                                <h3>Requests</h3>
                                <p>Sent, received &amp; invites</p>
                            </div>
                        </Link>
                    </div>

                    {/* ── Upcoming Hackathons ── */}
                    <div className="hackathon-section">
                        <div className="hackathon-section-header">
                            <div>
                                <h3 style={{ margin: 0 }}>🏆 Upcoming Hackathons</h3>
                                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                    Discover new hackathons and find teammates instantly
                                </p>
                            </div>
                            <Link to="/hackathons" className="btn btn-outline btn-sm">View All →</Link>
                        </div>

                        {loadingHacks && (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '32px 0' }}>
                                <span className="spinner" />
                            </div>
                        )}

                        {!loadingHacks && hackathons.length === 0 && (
                            <div className="empty-state" style={{ padding: '32px 0' }}>
                                <div className="empty-state-icon">🏆</div>
                                <h3>No upcoming hackathons</h3>
                                <p>Check back later — admins will post hackathons here.</p>
                            </div>
                        )}

                        {!loadingHacks && hackathons.length > 0 && (
                            <div className="hackathon-row">
                                {hackathons.map(h => <HackathonCard key={h._id} h={h} />)}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main>
            <section className="hero">
                <div className="container">
                    <div className="hero-eyebrow">🎓 For college hackathons</div>
                    <h1>Find your<br />hackathon team.</h1>
                    <p className="hero-sub">
                        Don't hack alone. CollabCampus connects you with teammates who have the skills
                        you need — and who need yours.
                    </p>
                    <div className="hero-actions">
                        <Link to="/signup" className="btn btn-primary btn-lg">Get started free</Link>
                        <Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
                    </div>
                </div>
            </section>

            <section>
                <div className="container">
                    <div style={{ borderTop: '1px solid var(--border)', paddingTop: 40 }}>
                        <p style={{ fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 24 }}>
                            How it works
                        </p>
                        <div className="features-grid">
                            {FEATURES.map((f) => (
                                <div className="feature-card" key={f.title}>
                                    <div className="feature-card-icon">{f.icon}</div>
                                    <h3>{f.title}</h3>
                                    <p>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
