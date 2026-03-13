/**
 * ParkSmart — Vehicle API Module
 * All backend calls related to /api/vehicles
 *
 * Depends on: api.config.js (must be loaded first)
 */

const VehicleAPI = {

    /**
     * Create a new vehicle for the logged-in driver.
     * POST /api/vehicles
     * @param {{ vehicleNumber, type, model, color, year, driverId }} data
     * @returns {Promise<VehicleDTO>}
     */
    create(data) {
        return apiFetch('/api/vehicles', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    /**
     * Get all vehicles belonging to a specific driver.
     * GET /api/vehicles/driver/{driverId}
     * @param {number} driverId
     * @returns {Promise<VehicleDTO[]>}
     */
    getByDriver(driverId) {
        return apiFetch(`/api/vehicles/driver/${driverId}`);
    },

    /**
     * Delete a vehicle by ID.
     * DELETE /api/vehicles/{id}
     * @param {number} id
     * @returns {Promise<null>}
     */
    delete(id) {
        return apiFetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    },

};
