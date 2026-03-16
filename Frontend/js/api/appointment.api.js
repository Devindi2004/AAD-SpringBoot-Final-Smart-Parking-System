/**
 * ParkSmart — Appointment API Module
 * All backend calls related to /api/appointments
 *
 * Depends on: api.config.js (must be loaded first)
 */

const AppointmentAPI = {

    /**
     * Create a new appointment (driver submits slot request).
     * POST /api/appointments
     */
    create(data) {
        return apiFetch('/api/appointments', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get all appointments for slots owned by the given owner.
     * GET /api/appointments/owner/{ownerId}
     */
    getByOwner(ownerId) {
        return apiFetch(`/api/appointments/owner/${ownerId}`);
    },

    /**
     * Get all appointments placed by a driver.
     * GET /api/appointments/driver/{driverId}
     */
    getByDriver(driverId) {
        return apiFetch(`/api/appointments/driver/${driverId}`);
    },

    /**
     * Update the status of an appointment (ACTIVE / REJECTED / COMPLETED / CANCELLED).
     * PATCH /api/appointments/{id}/status?status=ACTIVE
     */
    updateStatus(id, status) {
        return apiFetch(`/api/appointments/${id}/status?status=${status}`, {
            method: 'PATCH',
        });
    },

    /**
     * Get all ACTIVE appointments for slots at a given location (time-based availability).
     * GET /api/appointments/location/{locationId}/active
     */
    getActiveByLocation(locationId) {
        return apiFetch(`/api/appointments/location/${locationId}/active`);
    },

    /**
     * Get a single appointment by ID (used for QR scan verification).
     * GET /api/appointments/{id}
     */
    getById(id) {
        return apiFetch(`/api/appointments/${id}`);
    },

};
