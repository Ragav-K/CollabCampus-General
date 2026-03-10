import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

function HackathonCard({ h }) {
    const navigate = useNavigate();
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    const handleClick = (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        navigate(`/hackathons/${h._id}`);
    };

    const viewTeamsUrl = `/join?hackathon=${encodeURIComponent(h.name)}`;
    const createTeamUrl = `/create?hackathonName=${encodeURIComponent(h.name)}&hackathonPlace=${encodeURIComponent(h.location || '')}&hackathonDate=${encodeURIComponent(h.hackathonDate || '')}`;

    return (
        <div className="hackathon-card-full" onClick={handleClick} style={{ cursor: 'pointer' }}>
            <div className="hack-poster-full hack-poster-placeholder">🏆</div>
            <div className="hack-card-body">
                <div className="hack-name">{h.name}</div>
                {h.description && (
                    <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', margin: '6px 0 8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {h.description}
                    </p>
                )}
                <div className="hack-meta">
                    {h.location && <span>📍 {h.location}</span>}
                    {h.hackathonDate && <span>📅 {fmt(h.hackathonDate)}</span>}
                    <span>⏰ Reg. by {fmt(h.regDeadline)}</span>
                    <span>👥 {h.teamCount || 0} team{h.teamCount !== 1 ? 's' : ''} formed</span>
                </div>
                <div className="hack-action-btns" style={{ marginTop: 'auto' }}>
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

export default function AllHackathons({ user }) {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        setLoading(true);
        api('/api/hackathons')
            .then(setHackathons)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = hackathons.filter(h =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        (h.location || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="page">
            <div className="container">
                <div className="section-head">
                    <div>
                        <h2>🏆 All Hackathons</h2>
                        <p>Browse all upcoming hackathons on CollabCampus</p>
                    </div>
                </div>

                <div style={{ marginBottom: 24 }}>
                    <input
                        className="input"
                        placeholder="🔍 Search by name or location…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: 400 }}
                    />
                </div>

                {loading && <div className="loading-page"><span className="spinner" /> Loading hackathons…</div>}
                {error && <div className="alert alert-error">{error}</div>}

                {!loading && !error && filtered.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-state-icon">🏆</div>
                        <h3>{search ? 'No results found' : 'No upcoming hackathons'}</h3>
                        <p>{search ? 'Try a different search term.' : 'Check back later — admins will post hackathons here.'}</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div className="hackathon-grid">
                        {filtered.map(h => <HackathonCard key={h._id} h={h} />)}
                    </div>
                )}
            </div>
        </div>
    );
}
