/**
 * ParkSmart — API Configuration
 * Shared base URL and fetch wrapper for all API modules.
 */

const API_BASE = 'http://localhost:8080';

/**
 * Central fetch wrapper.
 * Handles JSON headers, error parsing, and throws a
 * consistent Error object so callers only need try/catch.
 *
 * @param {string} endpoint   e.g. '/api/users'
 * @param {object} options    standard fetch options (method, body, etc.)
 * @returns {Promise<any>}    parsed JSON response, or null for 204 No Content
 */
async function apiFetch(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);

    // 204 No Content (e.g. DELETE) — nothing to parse
    if (response.status === 204 || response.headers.get('content-length') === '0') {
        return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = data?.message || data?.error || `Error ${response.status}: ${response.statusText}`;
        throw new Error(message);
    }

    return data;
}
