/**
 * ParkSmart — Owner Verification API Module
 * All backend calls related to /api/owner-verifications
 *
 * Depends on: api.config.js (must be loaded first)
 */

const OwnerVerificationAPI = {

    /**
     * Get all owner verification records.
     * GET /api/owner-verifications
     */
    getAll() {
        return apiFetch('/api/owner-verifications');
    },

    /**
     * Get only PENDING verification requests.
     * GET /api/owner-verifications/pending
     */
    getPending() {
        return apiFetch('/api/owner-verifications/pending');
    },

    /**
     * Approve an owner — sets verification VERIFIED + user ACTIVE.
     * PATCH /api/owner-verifications/{id}/approve
     */
    approve(id) {
        return apiFetch(`/api/owner-verifications/${id}/approve`, { method: 'PATCH' });
    },

    /**
     * Reject an owner — sets verification REJECTED.
     * PATCH /api/owner-verifications/{id}/reject
     */
    reject(id) {
        return apiFetch(`/api/owner-verifications/${id}/reject`, { method: 'PATCH' });
    },

};
