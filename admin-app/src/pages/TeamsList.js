import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function TeamsList() {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        api('/api/admin/teams')
            .then(setTeams)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = teams.filter(t =>
        !search || [t.hackathonName, t.leaderName, t.hackathonPlace].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-page-header">
                    <div>
                        <h2 className="admin-page-title">👥 Teams</h2>
                        <p className="admin-page-sub">{teams.length} teams created on the platform</p>
                    </div>
                    <input
                        className="admin-input"
                        placeholder="Search hackathon, leader…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: 280 }}
                    />
                </div>

                {error && <div className="admin-alert admin-alert-error">{error}</div>}

                {loading ? (
                    <div className="admin-loading">Loading teams…</div>
                ) : filtered.length === 0 ? (
                    <div className="admin-empty"><div>👥</div><p>No teams found.</p></div>
                ) : (
                    <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
                        <table className="admin-table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th>Hackathon</th>
                                    <th>Leader</th>
                                    <th>Location</th>
                                    <th>Event Date</th>
                                    <th>Apply By</th>
                                    <th>Size</th>
                                    <th>Skills Needed</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(t => (
                                    <tr key={t._id}>
                                        <td style={{ fontWeight: 600 }}>{t.hackathonName}</td>
                                        <td>{t.leaderName}</td>
                                        <td>{t.hackathonPlace || '—'}</td>
                                        <td>{fmt(t.hackathonDate)}</td>
                                        <td>{fmt(t.lastDate)}</td>
                                        <td style={{ textAlign: 'center' }}>{t.maxMembers}</td>
                                        <td style={{ fontSize: '0.78rem' }}>{(t.skillsNeeded || []).join(', ') || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
