import api from '../../../services/api';

export const driverApi = {
    getMyVehicles: async () => {
        const response = await api.get('/vehicles/me');
        return response.data;
    },
    getVehicleTypes: async () => {
        const response = await api.get('/vehicle-types');
        return response.data;
    },
    createVehicle: async (data) => {
        const response = await api.post('/vehicles/me', data);
        return response.data;
    },
    updateVehicle: async (id, data) => {
        const response = await api.put(`/vehicles/me/${id}`, data);
        return response.data;
    },
    deleteVehicle: async (id) => {
        const response = await api.delete(`/vehicles/me/${id}`);
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
    },
    updateProfile: async (data) => {
        const response = await api.put('/users/me', data);
        return response.data;
    },
    changePassword: async (data) => {
        const response = await api.post('/auth/change-password', data);
        return response.data;
    },
    createPayment: async (data) => {
        const response = await api.post('/payments', data);
        return response.data;
    },
    createVnPayUrl: async (paymentId) => {
        const response = await api.post(`/payments/${paymentId}/vnpay-url`);
        return response.data;
    }
};
