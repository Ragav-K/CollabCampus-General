import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function Dashboard() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        api('/api/admin/stats')
            .then(setStats)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="admin-loading">Loading dashboard…</div>;
    if (error) return <div className="admin-alert admin-alert-error">{error}</div>;

    return (
        <div className="admin-page">
            <div className="admin-container">
                <h2 className="admin-page-title">📊 Dashboard</h2>
                <p className="admin-page-sub">Platform overview at a glance</p>

                <div className="stat-grid">
                    <div className="stat-card">
                        <div className="stat-icon">👩‍🎓</div>
                        <div className="stat-value">{stats.totalStudents}</div>
                        <div className="stat-label">Verified Students</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">👥</div>
                        <div className="stat-value">{stats.totalTeams}</div>
                        <div className="stat-label">Teams Created</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon">🏆</div>
                        <div className="stat-value">{stats.activeHackathons}</div>
                        <div className="stat-label">Active Hackathons</div>
                    </div>
                </div>

                {stats.teamsPerHackathon?.length > 0 && (
                    <div className="admin-card" style={{ marginTop: 32 }}>
                        <h3 className="admin-card-title">Teams per Hackathon</h3>
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>Hackathon</th>
                                    <th style={{ textAlign: 'right' }}>Teams</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.teamsPerHackathon.map(h => (
                                    <tr key={h.hackathonId}>
                                        <td>{h.hackathonName}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 600 }}>{h.teamCount}</td>
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
