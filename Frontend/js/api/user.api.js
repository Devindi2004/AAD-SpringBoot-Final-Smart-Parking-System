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
};
