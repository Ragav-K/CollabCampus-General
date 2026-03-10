const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export async function api(path, { body, method, ...opts } = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method: method || (body ? 'POST' : 'GET'),
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        ...opts,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}
