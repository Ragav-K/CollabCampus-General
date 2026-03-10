// admin-app/src/api.js
const BASE = process.env.REACT_APP_API_URL || '';

export async function api(path, opts = {}) {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(BASE + path, {
        method: opts.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'x-admin-token': token } : {}),
            ...(opts.headers || {}),
        },
        body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}
