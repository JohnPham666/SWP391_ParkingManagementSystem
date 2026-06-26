import api from '../../../services/api';

export const driverApi = {
    getMyVehicles: async () => {
        const response = await api.get('/vehicles/my');
        return response.data;
    },
    getVehicleTypes: async () => {
        const response = await api.get('/vehicle-types');
        return response.data;
    },
    createVehicle: async (data) => {
        const response = await api.post('/vehicles', data);
        return response.data;
    },
    updateVehicle: async (id, data) => {
        const response = await api.put(`/vehicles/${id}`, data);
        return response.data;
    },
    deleteVehicle: async (id) => {
        const response = await api.delete(`/vehicles/${id}`);
        return response.data;
    },
    getReservations: async () => {
        const response = await api.get('/reservations');
        return response.data;
    },
    createReservation: async (data) => {
        const response = await api.post('/reservations', data);
        return response.data;
    },
    deleteReservation: async (id) => {
        const response = await api.delete(`/reservations/${id}`);
        return response.data;
    },
    getSlots: async () => {
        const response = await api.get('/slots');
        return response.data;
    },
    getSessions: async () => {
        const response = await api.get('/sessions');
        return response.data;
    }
};
