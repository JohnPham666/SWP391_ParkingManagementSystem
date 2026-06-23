/* ===== API Service Layer ===== */
const API_BASE = '/api';

const Api = {
    token: null,

    init() {
        const saved = localStorage.getItem('parking_auth');
        if (saved) {
            try {
                const auth = JSON.parse(saved);
                this.token = auth.token;
                return auth;
            } catch { return null; }
        }
        return null;
    },

    saveAuth(data) {
        this.token = data.token;
        localStorage.setItem('parking_auth', JSON.stringify(data));
    },

    clearAuth() {
        this.token = null;
        localStorage.removeItem('parking_auth');
    },

    headers() {
        const h = { 'Content-Type': 'application/json' };
        if (this.token) h['Authorization'] = 'Bearer ' + this.token;
        return h;
    },

    async request(method, path, body) {
        const opts = { method, headers: this.headers() };
        if (body && method !== 'GET') opts.body = JSON.stringify(body);
        try {
            const res = await fetch(API_BASE + path, opts);
            if (res.status === 401) {
                if (path !== '/auth/login') {
                    this.clearAuth();
                    location.reload();
                    return { success: false, message: 'Phiên đăng nhập hết hạn' };
                }
            } else if (res.status === 403) {
                return { success: false, message: 'Bạn không có quyền thực hiện thao tác này' };
            }
            const json = await res.json();
            return json;
        } catch (err) {
            return { success: false, message: 'Lỗi kết nối server: ' + err.message };
        }
    },

    // Auth
    login(email, password) { return this.request('POST', '/auth/login', { email, password }); },
    register(data) { return this.request('POST', '/auth/register', data); },

    // Users
    getUsers() { return this.request('GET', '/users'); },
    getUser(id) { return this.request('GET', '/users/' + id); },
    createUser(data) { return this.request('POST', '/users', data); },
    updateUser(id, data) { return this.request('PUT', '/users/' + id, data); },
    updateUserStatus(id, isActive) { return this.request('PATCH', '/users/' + id + '/status?isActive=' + isActive); },
    deleteUser(id) { return this.request('DELETE', '/users/' + id); },

    // Roles
    getRoles() { return this.request('GET', '/roles'); },

    // Sessions
    getSessions() { return this.request('GET', '/sessions'); },
    getSession(id) { return this.request('GET', '/sessions/' + id); },
    checkIn(data) { return this.request('POST', '/sessions/check-in', data); },
    walkIn(data) { return this.request('POST', '/sessions/walk-in', data); },
    checkOut(sessionId, data) { return this.request('POST', '/sessions/' + sessionId + '/check-out', data); },
    getActiveByPlate(plate) { return this.request('GET', '/sessions/active/by-license-plate?licensePlate=' + encodeURIComponent(plate)); },

    // Slots
    getSlots(zoneId, vehicleTypeId) {
        let q = [];
        if (zoneId) q.push('zoneId=' + zoneId);
        if (vehicleTypeId) q.push('vehicleTypeId=' + vehicleTypeId);
        return this.request('GET', '/slots' + (q.length ? '?' + q.join('&') : ''));
    },
    getSlot(id) { return this.request('GET', '/slots/' + id); },
    getAvailableSlots(params) {
        const q = Object.entries(params || {}).filter(([,v]) => v).map(([k,v]) => k + '=' + v).join('&');
        return this.request('GET', '/slots/available' + (q ? '?' + q : ''));
    },
    createSlot(data) { return this.request('POST', '/slots', data); },
    updateSlot(id, data) { return this.request('PUT', '/slots/' + id, data); },
    updateSlotStatus(id, data) { return this.request('PATCH', '/slots/' + id + '/status', data); },
    deleteSlot(id) { return this.request('DELETE', '/slots/' + id); },

    // Vehicles
    getVehicles() { return this.request('GET', '/vehicles'); },
    getVehicle(id) { return this.request('GET', '/vehicles/' + id); },
    createVehicle(data) { return this.request('POST', '/vehicles', data); },
    updateVehicle(id, data) { return this.request('PUT', '/vehicles/' + id, data); },
    deleteVehicle(id) { return this.request('DELETE', '/vehicles/' + id); },

    // Reservations
    getReservations() { return this.request('GET', '/reservations'); },
    getReservation(id) { return this.request('GET', '/reservations/' + id); },
    createReservation(data) { return this.request('POST', '/reservations', data); },
    updateReservation(id, data) { return this.request('PUT', '/reservations/' + id, data); },
    updateReservationStatus(id, status) { return this.request('PATCH', '/reservations/' + id + '/status?status=' + encodeURIComponent(status)); },
    cancelReservation(id) { return this.request('DELETE', '/reservations/' + id); },

    // Payments
    getPayments() { return this.request('GET', '/payments'); },
    getPayment(id) { return this.request('GET', '/payments/' + id); },
    createPayment(data) { return this.request('POST', '/payments', data); },
    confirmCash(id) { return this.request('PUT', '/payments/' + id + '/confirm-cash'); },
    createVnPayUrl(id) { return this.request('POST', '/payments/' + id + '/vnpay-url'); },

    // Incidents
    getIncidents() { return this.request('GET', '/incidents'); },
    getIncident(id) { return this.request('GET', '/incidents/' + id); },
    createIncident(data) { return this.request('POST', '/incidents', data); },
    updateIncident(id, data) { return this.request('PUT', '/incidents/' + id, data); },
    updateIncidentStatus(id, status) { return this.request('PATCH', '/incidents/' + id + '/status?status=' + encodeURIComponent(status)); },
    deleteIncident(id) { return this.request('DELETE', '/incidents/' + id); },

    // Subscriptions
    getSubscriptions() { return this.request('GET', '/subscriptions'); },
    getSubscription(id) { return this.request('GET', '/subscriptions/' + id); },
    createSubscription(data) { return this.request('POST', '/subscriptions', data); },
    updateSubscription(id, data) { return this.request('PUT', '/subscriptions/' + id, data); },
    deleteSubscription(id) { return this.request('DELETE', '/subscriptions/' + id); },

    // Monitoring
    getDashboard(params) {
        const q = Object.entries(params || {}).filter(([,v]) => v).map(([k,v]) => k + '=' + v).join('&');
        return this.request('GET', '/monitoring/dashboard' + (q ? '?' + q : ''));
    },

    // Reports
    getRevenue(from, to) { return this.request('GET', '/reports/revenue?fromDate=' + from + '&toDate=' + to); },
    getOccupancy(floorId) { return this.request('GET', '/reports/occupancy' + (floorId ? '?floorId=' + floorId : '')); },
    getPredictions() { return this.request('GET', '/reports/predictions/parking'); },

    // Vehicle Types
    getVehicleTypes() { return this.request('GET', '/vehicle-types'); },

    // Buildings
    getBuildings() { return this.request('GET', '/buildings'); },

    // Floors
    getFloors(buildingId) { return this.request('GET', '/floors' + (buildingId ? '?buildingId=' + buildingId : '')); },

    // Zones
    getZones(floorId) { return this.request('GET', '/zones' + (floorId ? '?floorId=' + floorId : '')); },
};
