/**
 * ParkSmart — Auth API Module
 * All backend calls related to /api/auth
 *
 * Depends on: api.config.js  (must be loaded first)
 */

const AuthAPI = {

    /**
     * Login with email and password.
     * POST /api/auth/login
     * @param {{ email, password }} credentials
     * @returns {Promise<UserDTO>}  user data (password field is null)
     */
    login(credentials) {
        return apiFetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        });
    },

};

/**
 * Save logged-in user to sessionStorage and redirect to their dashboard.
 * @param {UserDTO} user
 */
function redirectToDashboard(user) {
    sessionStorage.setItem('currentUser', JSON.stringify(user));

    const dashboards = {
        DRIVER: 'pages/driver-dashboard.html',
        OWNER:  'pages/owner-dashboard.html',
        ADMIN:  'pages/admin-dashboard.html',
    };

    const target = dashboards[user.role];
    if (target) {
        window.location.href = target;
    }
}

/**
 * Get the currently logged-in user from sessionStorage.
 * Returns null if no session exists.
 * @returns {UserDTO|null}
 */
function getCurrentUser() {
    const raw = sessionStorage.getItem('currentUser');
    return raw ? JSON.parse(raw) : null;
}

/**
 * Clear session and redirect back to login page.
 */
function logout() {
    sessionStorage.removeItem('currentUser');
    window.location.href = '../index.html';
}
