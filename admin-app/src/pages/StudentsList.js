import React, { useEffect, useState } from 'react';
import { api } from '../api';

export default function StudentsList() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    useEffect(() => {
        api('/api/admin/students')
            .then(setStudents)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const filtered = students.filter(s =>
        !search || [s.name, s.email, s.dept].some(v => v?.toLowerCase().includes(search.toLowerCase()))
    );

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-page-header">
                    <div>
                        <h2 className="admin-page-title">👩‍🎓 Students</h2>
                        <p className="admin-page-sub">{students.length} verified students on the platform</p>
                    </div>
                    <input
                        className="admin-input"
                        placeholder="Search name, email, dept…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ maxWidth: 280 }}
                    />
                </div>

                {error && <div className="admin-alert admin-alert-error">{error}</div>}

                {loading ? (
                    <div className="admin-loading">Loading students…</div>
                ) : filtered.length === 0 ? (
                    <div className="admin-empty"><div>👩‍🎓</div><p>No students found.</p></div>
                ) : (
                    <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
                        <table className="admin-table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Dept</th>
                                    <th>Year</th>
                                    <th>Gender</th>
                                    <th>Roles</th>
                                    <th>Joined</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => (
                                    <tr key={s._id}>
                                        <td style={{ fontWeight: 600 }}>{s.name || '—'}</td>
                                        <td style={{ fontSize: '0.82rem' }}>{s.email}</td>
                                        <td>{s.dept || '—'}</td>
                                        <td>{s.year || '—'}</td>
                                        <td>{s.gender || '—'}</td>
                                        <td style={{ fontSize: '0.78rem' }}>{(s.preferredRoles || []).join(', ') || '—'}</td>
                                        <td style={{ fontSize: '0.78rem' }}>{fmt(s.createdAt)}</td>
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
