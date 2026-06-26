import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api', // Đảm bảo cổng này khớp với Spring Boot
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const saved = localStorage.getItem('parking_auth');
    if (saved) {
      const auth = JSON.parse(saved);
      if (auth.token) {
        config.headers.Authorization = `Bearer ${auth.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        localStorage.removeItem('parking_auth');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- CÁC HÀM GỌI API ---

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
};

export const userApi = {
  getUsers: () => api.get('/users'),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (data) => api.post('/users', data),
  updateUser: (id, data) => api.put(`/users/${id}`, data),
  updateUserStatus: (id, isActive) => api.patch(`/users/${id}/status?isActive=${isActive}`),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export const roleApi = {
  getRoles: () => api.get('/roles'),
};

export const sessionApi = {
  getSessions: () => api.get('/sessions'),
  getSession: (id) => api.get(`/sessions/${id}`),
  checkIn: (data) => api.post('/sessions/check-in', data),
  walkIn: (data) => api.post('/sessions/walk-in', data),
  checkOut: (sessionId, data) => api.post(`/sessions/${sessionId}/check-out`, data),
  getActiveByPlate: (plate) => api.get(`/sessions/active/by-license-plate?licensePlate=${encodeURIComponent(plate)}`),
  uploadSessionImage: (sessionId, file, type) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/sessions/${sessionId}/image?type=${type}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export const vehicleApi = {
  getVehicles: () => api.get('/vehicles'),
  getVehicle: (id) => api.get(`/vehicles/${id}`),
  createVehicle: (data) => api.post('/vehicles', data),
  updateVehicle: (id, data) => api.put(`/vehicles/${id}`, data),
  deleteVehicle: (id) => api.delete(`/vehicles/${id}`),
  approveVehicle: (id, isApproved) => api.put(`/vehicles/${id}/approve?isApproved=${isApproved}`),
};

export const reservationApi = {
  getReservations: () => api.get('/reservations'),
  getReservation: (id) => api.get(`/reservations/${id}`),
  createReservation: (data) => api.post('/reservations', data),
  updateReservation: (id, data) => api.put(`/reservations/${id}`, data),
  updateReservationStatus: (id, status) => api.patch(`/reservations/${id}/status?status=${status}`),
  cancelReservation: (id) => api.delete(`/reservations/${id}`),
};

export const paymentApi = {
  getPayments: () => api.get('/payments'),
  getPayment: (id) => api.get(`/payments/${id}`),
  createPayment: (data) => api.post('/payments', data),
  confirmCash: (id) => api.put(`/payments/${id}/confirm-cash`),
  createVnPayUrl: (id) => api.post(`/payments/${id}/vnpay-url`),
};

export const incidentApi = {
  getIncidents: () => api.get('/incidents'),
  getIncident: (id) => api.get(`/incidents/${id}`),
  createIncident: (data) => api.post('/incidents', data),
  updateIncident: (id, data) => api.put(`/incidents/${id}`, data),
  updateIncidentStatus: (id, status) => api.patch(`/incidents/${id}/status?status=${status}`),
  deleteIncident: (id) => api.delete(`/incidents/${id}`),
};

export const subscriptionApi = {
  getSubscriptions: () => api.get('/subscriptions'),
  getSubscription: (id) => api.get(`/subscriptions/${id}`),
  createSubscription: (data) => api.post('/subscriptions', data),
  updateSubscription: (id, data) => api.put(`/subscriptions/${id}`, data),
  deleteSubscription: (id) => api.delete(`/subscriptions/${id}`),
};

export const buildingApi = {
  getBuildings: () => api.get('/buildings'),
  createBuilding: (data) => api.post('/buildings', data),
  updateBuilding: (id, data) => api.put(`/buildings/${id}`, data),
  deleteBuilding: (id) => api.delete(`/buildings/${id}`),
};

export const floorApi = {
  getFloors: (buildingId) => api.get('/floors' + (buildingId ? `?buildingId=${buildingId}` : '')),
  createFloor: (data) => api.post('/floors', data),
  updateFloor: (id, data) => api.put(`/floors/${id}`, data),
  deleteFloor: (id) => api.delete(`/floors/${id}`),
};

export const zoneApi = {
  getZones: (floorId) => api.get('/zones' + (floorId ? `?floorId=${floorId}` : '')),
  createZone: (data) => api.post('/zones', data),
  updateZone: (id, data) => api.put(`/zones/${id}`, data),
  deleteZone: (id) => api.delete(`/zones/${id}`),
};

export const pricingApi = {
  getPricingRules: () => api.get('/pricings'),
  createPricingRule: (data) => api.post('/pricings', data),
  updatePricingRule: (id, data) => api.put(`/pricings/${id}`, data),
  deletePricingRule: (id) => api.delete(`/pricings/${id}`),
};

export const reportApi = {
  getRevenueReport: (fromDate, toDate) => api.get('/reports/revenue', { params: { fromDate, toDate } }),
  getOccupancyReport: (floorId) => api.get('/reports/occupancy', { params: { floorId } }),
  getRevenueTrend: (fromDate, toDate) => api.get('/reports/revenue/trend', { params: { fromDate, toDate } }),
  getOccupancyBreakdown: () => api.get('/reports/occupancy/breakdown'),
  getFloorOccupancyBreakdown: () => api.get('/reports/occupancy/floor-breakdown'),
  getParkingPrediction: () => api.get('/reports/predictions/parking'),
  getRevenueSummary: (startDate, endDate) => api.get(`/reports/revenue-summary?startDate=${startDate}&endDate=${endDate}`),
  getOccupancyRate: () => api.get('/reports/occupancy-rate'),
  getPredictions: () => api.get('/reports/predictions'),
};

export const monitoringApi = {
  getDashboard: (params) => {
    const q = Object.entries(params || {}).filter(([,v]) => v).map(([k,v]) => `${k}=${v}`).join('&');
    return api.get(`/monitoring/dashboard${q ? '?' + q : ''}`);
  }
};

export const slotApi = {
  getSlots: () => api.get('/slots'),
  updateSlotStatus: (id, status) => api.patch(`/slots/${id}/status`, { status }),
};

export default api;
