import React, { useEffect, useState } from 'react';
import { api } from '../api';

const EMPTY_FORM = { name: '', description: '', location: '', hackathonDate: '', regDeadline: '' };

export default function HackathonManager() {
    const [hackathons, setHackathons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null); // hackathon object being edited
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState('');
    const [deleting, setDeleting] = useState(null);

    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    const isExpired = (h) => h.regDeadline && h.regDeadline < new Date().toISOString().split('T')[0];

    const load = () => {
        setLoading(true);
        api('/api/admin/hackathons')
            .then(setHackathons)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => { setEditing(null); setForm(EMPTY_FORM); setFormError(''); setShowForm(true); };
    const openEdit = (h) => {
        setEditing(h);
        setForm({ name: h.name, description: h.description || '', location: h.location || '', hackathonDate: h.hackathonDate || '', regDeadline: h.regDeadline || '' });
        setFormError('');
        setShowForm(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!form.name.trim()) { setFormError('Hackathon name is required'); return; }
        if (form.hackathonDate && form.regDeadline && form.regDeadline >= form.hackathonDate) {
            setFormError('Registration deadline must be before the hackathon date'); return;
        }
        setSaving(true);
        try {
            if (editing) {
                await api(`/api/admin/hackathon/${editing._id}`, { method: 'PUT', body: form });
            } else {
                await api('/api/admin/hackathon', { method: 'POST', body: form });
            }
            setShowForm(false);
            load();
        } catch (err) { setFormError(err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this hackathon? This cannot be undone.')) return;
        setDeleting(id);
        try {
            await api(`/api/admin/hackathon/${id}`, { method: 'DELETE' });
            setHackathons(prev => prev.filter(h => h._id !== id));
        } catch (err) { alert(err.message); }
        finally { setDeleting(null); }
    };

    return (
        <div className="admin-page">
            <div className="admin-container">
                <div className="admin-page-header">
                    <div>
                        <h2 className="admin-page-title">🏆 Hackathons</h2>
                        <p className="admin-page-sub">Add, edit, or delete hackathons listed on the platform</p>
                    </div>
                    <button className="admin-btn admin-btn-primary" onClick={openAdd}>+ Add Hackathon</button>
                </div>

                {error && <div className="admin-alert admin-alert-error">{error}</div>}

                {loading ? (
                    <div className="admin-loading">Loading hackathons…</div>
                ) : hackathons.length === 0 ? (
                    <div className="admin-empty">
                        <div>🏆</div>
                        <p>No hackathons yet. Click "+ Add Hackathon" to create one.</p>
                    </div>
                ) : (
                    <div className="admin-card" style={{ overflow: 'hidden', padding: 0 }}>
                        <table className="admin-table" style={{ margin: 0 }}>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Hackathon Date</th>
                                    <th>Reg. Deadline</th>
                                    <th>Teams</th>
                                    <th>Status</th>
                                    <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hackathons.map(h => (
                                    <tr key={h._id} style={{ opacity: isExpired(h) ? 0.55 : 1 }}>
                                        <td style={{ fontWeight: 600 }}>{h.name}</td>
                                        <td>{h.location || '—'}</td>
                                        <td>{fmt(h.hackathonDate)}</td>
                                        <td>{fmt(h.regDeadline)}</td>
                                        <td>{h.teamCount || 0}</td>
                                        <td>
                                            {isExpired(h) ? (
                                                <span className="admin-badge admin-badge-expired">Expired</span>
                                            ) : (
                                                <span className="admin-badge admin-badge-active">Active</span>
                                            )}
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button className="admin-btn admin-btn-sm admin-btn-outline" onClick={() => openEdit(h)}>Edit</button>
                                            <button className="admin-btn admin-btn-sm admin-btn-danger" style={{ marginLeft: 6 }}
                                                onClick={() => handleDelete(h._id)} disabled={deleting === h._id}>
                                                {deleting === h._id ? <span className="admin-spinner" /> : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="admin-modal-overlay" onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                    <div className="admin-modal">
                        <h3 style={{ marginBottom: 20 }}>{editing ? 'Edit Hackathon' : 'Add Hackathon'}</h3>
                        {formError && <div className="admin-alert admin-alert-error" style={{ marginBottom: 14 }}>{formError}</div>}
                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div className="admin-form-group">
                                <label className="admin-label">Hackathon Name *</label>
                                <input className="admin-input" placeholder="e.g. Smart India Hackathon 2025"
                                    value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Description</label>
                                <textarea className="admin-textarea" placeholder="Short description of the hackathon…"
                                    value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                            </div>
                            <div className="admin-form-group">
                                <label className="admin-label">Location / Mode</label>
                                <input className="admin-input" placeholder="Chennai / Online"
                                    value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <div className="admin-form-group">
                                    <label className="admin-label">Hackathon Date</label>
                                    <input type="date" className="admin-input"
                                        value={form.hackathonDate} onChange={e => setForm(f => ({ ...f, hackathonDate: e.target.value }))} />
                                </div>
                                <div className="admin-form-group">
                                    <label className="admin-label">Registration Deadline</label>
                                    <input type="date" className="admin-input"
                                        max={form.hackathonDate || undefined}
                                        value={form.regDeadline} onChange={e => setForm(f => ({ ...f, regDeadline: e.target.value }))} />
                                    {form.hackathonDate && form.regDeadline && form.regDeadline >= form.hackathonDate && (
                                        <p style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: 4 }}>⚠️ Must be before the hackathon date</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ flex: 1 }}>
                                    {saving ? <span className="admin-spinner" /> : (editing ? 'Save Changes' : 'Create Hackathon')}
                                </button>
                                <button type="button" className="admin-btn admin-btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
