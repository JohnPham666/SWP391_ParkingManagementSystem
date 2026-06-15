/* ===== API Service Layer ===== */
const API_BASE = 'http://localhost:8080/api';

const Api = {
    token: null,
    user: null,

    init() {
        const saved = localStorage.getItem('driver_auth');
        if (saved) {
            try {
                const auth = JSON.parse(saved);
                this.token = auth.token;
                this.user = auth;
                return auth;
            } catch { return null; }
        }
        return null;
    },

    saveAuth(data) {
        this.token = data.token;
        this.user = data;
        localStorage.setItem('driver_auth', JSON.stringify(data));
    },

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem('driver_auth');
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
                if (!path.includes('/auth/')) {
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

    // My Vehicles (driver self-service)
    getMyVehicles() { return this.request('GET', '/vehicles/me'); },
    createMyVehicle(data) { return this.request('POST', '/vehicles/me', data); },
    updateMyVehicle(id, data) { return this.request('PUT', '/vehicles/me/' + id, data); },
    deleteMyVehicle(id) { return this.request('DELETE', '/vehicles/me/' + id); },

    // Vehicle Types
    getVehicleTypes() { return this.request('GET', '/vehicle-types'); },

    // Buildings
    getBuildings() { return this.request('GET', '/buildings'); },

    // Floors
    getFloors(buildingId) { return this.request('GET', '/floors' + (buildingId ? '?buildingId=' + buildingId : '')); },

    // Zones
    getZones(floorId) { return this.request('GET', '/zones' + (floorId ? '?floorId=' + floorId : '')); },

    // Slots
    getAvailableSlots(params) {
        const q = Object.entries(params || {}).filter(([,v]) => v).map(([k,v]) => k + '=' + v).join('&');
        return this.request('GET', '/slots/available' + (q ? '?' + q : ''));
    },
    getSlots(zoneId, vehicleTypeId) {
        let q = [];
        if (zoneId) q.push('zoneId=' + zoneId);
        if (vehicleTypeId) q.push('vehicleTypeId=' + vehicleTypeId);
        return this.request('GET', '/slots' + (q.length ? '?' + q.join('&') : ''));
    },

    // Sessions
    getActiveSession(licensePlate) {
        return this.request('GET', '/sessions/active/by-license-plate?licensePlate=' + encodeURIComponent(licensePlate));
    },

    // Reservations
    getReservations() { return this.request('GET', '/reservations'); },
    createReservation(data) { return this.request('POST', '/reservations', data); },
    cancelReservation(id) { return this.request('DELETE', '/reservations/' + id); },

    // Subscriptions (by user)
    getMySubscriptions(userId) { return this.request('GET', '/subscriptions/user/' + userId); },

    // Payments
    getPayment(id) { return this.request('GET', '/payments/' + id); },
    getPaymentBySession(sessionId) { return this.request('GET', '/payments/session/' + sessionId); },
    createVnPayUrl(paymentId) { return this.request('POST', '/payments/' + paymentId + '/vnpay-url'); },

    // Monitoring (public dashboard)
    getDashboard(params) {
        const q = Object.entries(params || {}).filter(([,v]) => v).map(([k,v]) => k + '=' + v).join('&');
        return this.request('GET', '/monitoring/dashboard' + (q ? '?' + q : ''));
    },

    // Pricing
    getPricing() { return this.request('GET', '/pricing'); },
};
