const BASE = process.env.REACT_APP_API_URL || '';

export async function api(path, { body, method, ...opts } = {}) {
    const res = await fetch(`${BASE}${path}`, {
        method: method || (body ? 'POST' : 'GET'),
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
        ...opts,
    });
    const resClone = res.clone();
    let data;
    try {
        data = await res.json();
    } catch (e) {
        const text = await resClone.text();
        console.error('API Parse Error:', text);
        throw new Error(`Invalid JSON response from server (Status: ${res.status})`);
    }
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
}
