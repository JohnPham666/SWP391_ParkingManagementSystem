import { driverApi } from '../api/driverApi';

export const driverService = {
    loadMyVehicles: async () => {
        try {
            return await driverApi.getMyVehicles();
        } catch (error) {
            console.error("Error loading vehicles", error);
            throw error;
        }
    },
    loadVehicleTypes: async () => {
        try {
            return await driverApi.getVehicleTypes();
        } catch (error) {
            console.error("Error loading vehicle types", error);
            throw error;
        }
    },
    registerVehicle: async (vehicleData) => {
        try {
            return await driverApi.createVehicle(vehicleData);
        } catch (error) {
            console.error("Error creating vehicle", error);
            throw error;
        }
    },
    updateVehicle: async (id, vehicleData) => {
        try {
            return await driverApi.updateVehicle(id, vehicleData);
        } catch (error) {
            console.error("Error updating vehicle", error);
            throw error;
        }
    },
    removeVehicle: async (id) => {
        try {
            return await driverApi.deleteVehicle(id);
        } catch (error) {
            console.error("Error deleting vehicle", error);
            throw error;
        }
    }
};
