/**
 * ParkSmart — Transaction API Module
 * All backend calls related to /api/transactions
 *
 * Depends on: api.config.js (must be loaded first)
 */

const TransactionAPI = {

    /**
     * Get all transactions (admin use).
     * GET /api/transactions
     */
    getAll() {
        return apiFetch('/api/transactions');
    },

    /**
     * Process payment for an approved appointment.
     * POST /api/transactions/pay/{appointmentId}
     */
    makePayment(appointmentId) {
        return apiFetch(`/api/transactions/pay/${appointmentId}`, { method: 'POST' });
    },

    /**
     * Get the transaction record for a specific appointment.
     * GET /api/transactions/appointment/{appointmentId}
     */
    getByAppointmentId(appointmentId) {
        return apiFetch(`/api/transactions/appointment/${appointmentId}`);
    },

    /**
     * Get all transactions for slots owned by the given owner.
     * GET /api/transactions/owner/{ownerId}
     */
    getByOwnerId(ownerId) {
        return apiFetch(`/api/transactions/owner/${ownerId}`);
    },

};
