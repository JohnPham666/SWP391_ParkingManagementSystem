const Api = {
    authStorageKey: 'driver_auth',
    token: null,
    user: null,

    init() {
        const saved = localStorage.getItem(this.authStorageKey);
        if (!saved) return null;
        try {
            const auth = this.normalizeAuth(JSON.parse(saved));
            if (!auth?.token) {
                this.clearAuth();
                return null;
            }
            this.token = auth.token;
            this.user = auth;
            return auth;
        } catch {
            this.clearAuth();
            return null;
        }
    },

    getToken() {
        if (this.token || this.user?.token) return this.token || this.user.token;
        const auth = this.init();
        return auth?.token || null;
    },

    setToken(token) { this.token = token || null; },

    saveAuth(data) {
        const auth = this.normalizeAuth(data);
        if (!auth?.token) throw new Error('Không tìm thấy token đăng nhập trong phản hồi từ máy chủ.');
        this.token = auth.token;
        this.user = auth;
        localStorage.setItem(this.authStorageKey, JSON.stringify(auth));
        return auth;
    },

    clearAuth() {
        this.token = null;
        this.user = null;
        localStorage.removeItem(this.authStorageKey);
    },

    normalizeAuth(data) {
        if (!data) return null;
        const role = data.role || data.roleName || 'Driver';
        return {
            ...data,
            token: data.token,
            userId: data.userId,
            fullName: data.fullName || 'Tài xế',
            email: data.email,
            role,
            roleName: role,
            status: data.status || 'ACTIVE'
        };
    },

    isDriverRole(role) {
        return String(role || '').trim().toUpperCase().replace(/^ROLE_/, '') === 'DRIVER';
    },

    async request(path, options = {}) {
        const headers = new Headers(options.headers || {});
        const isFormData = options.body instanceof FormData;
        const requestOptions = { ...options };

        if (requestOptions.body && !isFormData && typeof requestOptions.body !== 'string') {
            requestOptions.body = JSON.stringify(requestOptions.body);
        }

        if (!isFormData && requestOptions.body && !headers.has('Content-Type')) {
            headers.set('Content-Type', 'application/json');
        }
        if (!headers.has('Accept')) headers.set('Accept', 'application/json');

        const token = this.getToken();
        if (token) headers.set('Authorization', `Bearer ${token}`);

        try {
            const response = await fetch(path, { ...requestOptions, headers });
            
            // For VNPay URL redirects
            if(response.redirected) {
                return { success: true, message: 'Redirecting...', data: { paymentUrl: response.url }, status: response.status };
            }

            const text = await response.text();
            let payload;
            try {
                payload = text ? JSON.parse(text) : null;
            } catch {
                payload = { success: response.ok, message: response.ok ? 'Yêu cầu thành công' : (text || response.statusText), data: text || null };
            }

            if (!payload) payload = { success: response.ok, message: response.statusText || '', data: null };

            if (!response.ok || payload.success === false) {
                if (response.status === 401) {
                    this.clearAuth();
                    if(window.App && typeof App.showLogin === 'function') App.showLogin();
                }
                return { success: false, message: payload.message || this.getHttpErrorMessage(response.status), data: payload.data ?? null, status: response.status };
            }

            return { success: payload.success !== false, message: payload.message || 'Yêu cầu thành công', data: payload.data ?? null, status: response.status };
        } catch (error) {
            return { success: false, message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.', data: null, error };
        }
    },

    getHttpErrorMessage(status) {
        switch (status) {
            case 400: return 'Dữ liệu gửi lên không hợp lệ. Vui lòng kiểm tra lại.';
            case 401: return 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.';
            case 403: return 'Bạn không có quyền thực hiện thao tác này.';
            case 404: return 'Không tìm thấy tài nguyên yêu cầu.';
            case 500: return 'Máy chủ đang gặp lỗi. Vui lòng thử lại sau.';
            default: return `Yêu cầu thất bại (${status})`;
        }
    },

    async login(email, password) {
        if (!email || !password) return { success: false, message: 'Vui lòng nhập email và mật khẩu' };
        const result = await this.request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
        if (result.success && result.data) result.data = this.normalizeAuth(result.data);
        return result;
    },

    async register(data) {
        const payload = { fullName: data.fullName, email: data.email, phoneNumber: data.phoneNumber, password: data.password };
        const result = await this.request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
        if (result.success && result.data) result.data = this.normalizeAuth(result.data);
        return result;
    },

    async getCurrentUser() {
        return this.user ? { success: true, message: 'Loaded from local auth state', data: this.user } : { success: false, message: 'Chưa có thông tin tài khoản', data: null };
    },

    async forgotPassword(email) {
        return this.request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) });
    },

    async resetPassword(token, newPassword) {
        return this.request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) });
    },

    async getMyVehicles() { return this.request('/api/vehicles/me'); },
    async createMyVehicle(data) { return this.request('/api/vehicles/me', { method: 'POST', body: data }); },
    async updateMyVehicle(id, data) { return this.request(`/api/vehicles/me/${id}`, { method: 'PUT', body: data }); },
    async deleteMyVehicle(id) { return this.request(`/api/vehicles/me/${id}`, { method: 'DELETE' }); },
    async getVehicleTypes() { return this.request('/api/vehicle-types'); },

    async getAvailableSlots(params = {}) {
        const query = new URLSearchParams(params).toString();
        return this.request(`/api/slots/available?${query}`);
    },
    async getSlotById(id) { return this.request(`/api/slots/${id}`); },

    async getReservations() { return this.request('/api/reservations'); },
    async createReservation(data) { return this.request('/api/reservations', { method: 'POST', body: data }); },
    async cancelReservation(id) { return this.request(`/api/reservations/${id}`, { method: 'DELETE' }); },

    async getPayments() { return this.request('/api/payments'); },
    async getPaymentBySession(sessionId) { return this.request(`/api/payments/session/${sessionId}`); },
    async createPayment(data) { return this.request('/api/payments', { method: 'POST', body: data }); },
    async createVnPayUrl(id) { return this.request(`/api/payments/${id}/vnpay-url`, { method: 'POST' }); },

    async getActiveSession(licensePlate) { return this.request(`/api/sessions/active/by-license-plate?licensePlate=${encodeURIComponent(licensePlate)}`); },

    async getPricingPolicies() { return this.request('/api/pricings'); },

    async getIncidents() { return this.request('/api/incidents'); },
    async createIncident(data) { return this.request('/api/incidents', { method: 'POST', body: data }); },
    async getIncidentById(id) { return this.request(`/api/incidents/${id}`); },

    _delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
};
