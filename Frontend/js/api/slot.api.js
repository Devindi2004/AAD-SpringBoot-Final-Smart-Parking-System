/**
 * ParkSmart — Slot API Module
 * All backend calls related to /api/slots
 *
 * Depends on: api.config.js (must be loaded first)
 */

const SlotAPI = {

    create(data) {
        return apiFetch('/api/slots', { method: 'POST', body: JSON.stringify(data) });
    },

    getAll() {
        return apiFetch('/api/slots');
    },

    getByLocation(locationId) {
        return apiFetch(`/api/slots/location/${locationId}`);
    },

    getByOwner(ownerId) {
        return apiFetch(`/api/slots/owner/${ownerId}`);
    },

    getById(id) {
        return apiFetch(`/api/slots/${id}`);
    },

    updateStatus(id, status) {
        return apiFetch(`/api/slots/${id}/status?status=${status}`, { method: 'PATCH' });
    },

    delete(id) {
        return apiFetch(`/api/slots/${id}`, { method: 'DELETE' });
    },

};
