/**
 * ParkSmart — Location API Module
 * All backend calls related to /api/locations
 *
 * Depends on: api.config.js (must be loaded first)
 */

const LocationAPI = {

    create(data) {
        return apiFetch('/api/locations', { method: 'POST', body: JSON.stringify(data) });
    },

    getAll() {
        return apiFetch('/api/locations');
    },

    getByOwner(ownerId) {
        return apiFetch(`/api/locations/owner/${ownerId}`);
    },

    getById(id) {
        return apiFetch(`/api/locations/${id}`);
    },

    update(id, data) {
        return apiFetch(`/api/locations/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    },

    toggleActive(id) {
        return apiFetch(`/api/locations/${id}/toggle`, { method: 'PATCH' });
    },

    delete(id) {
        return apiFetch(`/api/locations/${id}`, { method: 'DELETE' });
    },

};
