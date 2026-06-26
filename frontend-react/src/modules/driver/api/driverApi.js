import axios from 'axios';

export const driverApi = {
    getMyVehicles: async () => {
        const response = await axios.get('/api/vehicles/my');
        return response.data;
    },
    getVehicleTypes: async () => {
        const response = await axios.get('/api/vehicle-types');
        return response.data;
    },
    createVehicle: async (data) => {
        const response = await axios.post('/api/vehicles', data);
        return response.data;
    },
    updateVehicle: async (id, data) => {
        const response = await axios.put(`/api/vehicles/${id}`, data);
        return response.data;
    },
    deleteVehicle: async (id) => {
        const response = await axios.delete(`/api/vehicles/${id}`);
        return response.data;
    },
    getReservations: async () => {
        const response = await axios.get('/api/reservations');
        return response.data;
    },
    createReservation: async (data) => {
        const response = await axios.post('/api/reservations', data);
        return response.data;
    },
    deleteReservation: async (id) => {
        const response = await axios.delete(`/api/reservations/${id}`);
        return response.data;
    },
    getSlots: async () => {
        const response = await axios.get('/api/slots');
        return response.data;
    },
    getSessions: async () => {
        const response = await axios.get('/api/sessions');
        return response.data;
    }
};
