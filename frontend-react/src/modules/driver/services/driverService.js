import { driverApi } from '../api/driverApi';

export const driverService = {
    loadMyVehicles: async () => {
        try {
            return await driverApi.getMyVehicles();
        } catch (error) {
            throw error;
        }
    },
    loadVehicleTypes: async () => {
        try {
            return await driverApi.getVehicleTypes();
        } catch (error) {
            throw error;
        }
    },
    registerVehicle: async (vehicleData) => {
        try {
            return await driverApi.createVehicle(vehicleData);
        } catch (error) {
            throw error;
        }
    },
    updateVehicle: async (id, vehicleData) => {
        try {
            return await driverApi.updateVehicle(id, vehicleData);
        } catch (error) {
            throw error;
        }
    },
    removeVehicle: async (id) => {
        try {
            return await driverApi.deleteVehicle(id);
        } catch (error) {
            throw error;
        }
    },
    uploadVehicleImage: async (vehicleId, file, type) => {
        try {
            return await driverApi.uploadVehicleImage(vehicleId, file, type);
        } catch (error) {
            throw error;
        }
    },
    loadReservations: async () => {
        try {
            return await driverApi.getReservations();
        } catch (error) {
            throw error;
        }
    },
    createReservation: async (data) => {
        try {
            return await driverApi.createReservation(data);
        } catch (error) {
            throw error;
        }
    },
    cancelReservation: async (id) => {
        try {
            return await driverApi.deleteReservation(id);
        } catch (error) {
            throw error;
        }
    },
    loadSlots: async () => {
        try {
            const response = await driverApi.getSlots();
            return response;
        } catch (error) {
            throw error;
        }
    },
    loadSessions: async () => {
        try {
            return await driverApi.getSessions();
        } catch (error) {
            throw error;
        }
    },

    updateProfile: async (data) => {
        try {
            return await driverApi.updateProfile(data);
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    },

    changePassword: async (data) => {
        try {
            return await driverApi.changePassword(data);
        } catch (error) {
            console.error('Failed to change password:', error);
            throw error;
        }
    },

    createPayment: async (data) => {
        return await driverApi.createPayment(data);
    },

    createVnPayUrl: async (paymentId) => {
        return await driverApi.createVnPayUrl(paymentId);
    },

    loadPricings: async () => {
        return await driverApi.getPricings();
    },

    loadIncidents: async () => {
        return await driverApi.getIncidents();
    },

    createIncident: async (data) => {
        return await driverApi.createIncident(data);
    },
    uploadIncidentImage: async (incidentId, file) => {
        return await driverApi.uploadIncidentImage(incidentId, file);
    }
};
