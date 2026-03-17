/**
 * ParkSmart — User API Module
 * All backend calls related to /api/users
 *
 * Depends on: api.config.js  (must be loaded first)
 *
 * UserDTO fields:
 *   id, firstName, lastName, email, phone, password, role, status
 *
 * UserRole  : DRIVER | OWNER | ADMIN
 * UserStatus: ACTIVE | INACTIVE
 */

const UserAPI = {

    /**
     * Register a new user (Driver or Owner).
     * POST /api/users
     * @param {{ firstName, lastName, email, phone, password, role, status }} data
     * @returns {Promise<UserDTO>}
     */
    register(data) {
        return apiFetch('/api/users', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Fetch all users.
     * GET /api/users
     * @returns {Promise<UserDTO[]>}
     */
    getAll() {
        return apiFetch('/api/users');
    },

    /**
     * Fetch a single user by ID.
     * GET /api/users/{id}
     * @param {number} id
     * @returns {Promise<UserDTO>}
     */
    getById(id) {
        return apiFetch(`/api/users/${id}`);
    },

    /**
     * Delete a user by ID.
     * DELETE /api/users/{id}
     * @param {number} id
     * @returns {Promise<null>}
     */
    delete(id) {
        return apiFetch(`/api/users/${id}`, {
            method: 'DELETE',
        });
    },

    /**
     * Toggle a user's status between ACTIVE and INACTIVE.
     * PATCH /api/users/{id}/status?status=ACTIVE|INACTIVE
     * @param {number} id
     * @param {'ACTIVE'|'INACTIVE'} status
     * @returns {Promise<UserDTO>}
     */
    updateStatus(id, status) {
        return apiFetch(`/api/users/${id}/status?status=${status}`, {
            method: 'PATCH',
        });
    },
};
