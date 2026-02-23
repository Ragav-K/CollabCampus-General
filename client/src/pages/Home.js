import React from 'react';
import { Link } from 'react-router-dom';

const FEATURES = [
    { icon: '🔍', title: 'Browse Open Teams', desc: 'Find hackathon teams actively looking for members.' },
    { icon: '⚡', title: 'Post Your Team', desc: 'Create a listing, specify skills needed and let teammates come to you.' },
    { icon: '📬', title: 'Send Join Requests', desc: 'Apply with your strengths and problem statement in seconds.' },
    { icon: '✅', title: 'Accept or Decline', desc: 'Team leaders review requests and build their crew.' },
];

export default function Home({ user }) {
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
                        <Link to="/requested" className="dash-card">
                            <div className="dash-card-icon">📌</div>
                            <div>
                                <h3>My Requests</h3>
                                <p>Track joins you've applied to</p>
                            </div>
                        </Link>
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
