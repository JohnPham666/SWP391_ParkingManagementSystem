/* ===== Mock API Service Layer - No real backend calls ===== */
const MockDB = {
    user: {
        userId: 1,
        fullName: 'Nguyễn Văn Phúc',
        email: 'phuc@gmail.com',
        phoneNumber: '0912 345 678',
        role: 'Driver',
        status: 'ACTIVE',
        token: 'mock-jwt-token-driver'
    },
    vehicles: [
        { vehicleId: 1, licensePlate: '51A-12345', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', brand: 'Toyota Camry', vehicleColor: 'Trắng', manufactureYear: 2022, isDefault: true },
        { vehicleId: 2, licensePlate: '59B-67890', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', brand: 'Honda SH', vehicleColor: 'Đen', manufactureYear: 2023, isDefault: false }
    ],
    vehicleTypes: [
        { vehicleTypeId: 1, typeName: 'Ô tô' },
        { vehicleTypeId: 2, typeName: 'Xe máy' },
        { vehicleTypeId: 3, typeName: 'Xe tải' },
        { vehicleTypeId: 4, typeName: 'Xe điện' }
    ],
    buildings: [
        { buildingId: 1, buildingName: 'Tòa nhà A', address: '123 Nguyễn Huệ, Quận 1' },
        { buildingId: 2, buildingName: 'Tòa nhà B', address: '456 Lê Lợi, Quận 3' }
    ],
    floors: [
        { floorId: 1, buildingId: 1, floorName: 'Tầng B1' },
        { floorId: 2, buildingId: 1, floorName: 'Tầng B2' },
        { floorId: 3, buildingId: 2, floorName: 'Tầng 1' }
    ],
    zones: [
        { zoneId: 1, floorId: 1, zoneName: 'Khu A', description: 'Khu ô tô', vehicleTypeId: 1 },
        { zoneId: 2, floorId: 1, zoneName: 'Khu B', description: 'Khu xe máy', vehicleTypeId: 2 },
        { zoneId: 3, floorId: 2, zoneName: 'Khu C', description: 'Khu ô tô dài hạn', vehicleTypeId: 1 },
        { zoneId: 4, floorId: 3, zoneName: 'Khu D', description: 'Khu khách vãng lai', vehicleTypeId: 2 }
    ],
    slots: [
        { slotId: 1, zoneId: 1, slotCode: 'A-01', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', status: 'AVAILABLE' },
        { slotId: 2, zoneId: 1, slotCode: 'A-02', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', status: 'OCCUPIED' },
        { slotId: 3, zoneId: 1, slotCode: 'A-03', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', status: 'AVAILABLE' },
        { slotId: 4, zoneId: 1, slotCode: 'A-04', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', status: 'RESERVED' },
        { slotId: 5, zoneId: 2, slotCode: 'B-01', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', status: 'AVAILABLE' },
        { slotId: 6, zoneId: 2, slotCode: 'B-02', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', status: 'OCCUPIED' },
        { slotId: 7, zoneId: 2, slotCode: 'B-03', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', status: 'AVAILABLE' },
        { slotId: 8, zoneId: 3, slotCode: 'C-01', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', status: 'AVAILABLE' },
        { slotId: 9, zoneId: 3, slotCode: 'C-02', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', status: 'LOCKED' },
        { slotId: 10, zoneId: 4, slotCode: 'D-01', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', status: 'RESERVED' }
    ],
    reservations: [],
    sessions: [],
    payments: [],
    history: [],
    pricing: [
        { vehicleType: 'Ô tô', baseFee: 20000, unit: 'giờ', rushHourFee: 30000, dailyCap: 200000, overtimeFee: 50000, lostTicketFee: 500000 },
        { vehicleType: 'Xe máy', baseFee: 5000, unit: 'giờ', rushHourFee: 8000, dailyCap: 50000, overtimeFee: 15000, lostTicketFee: 200000 },
        { vehicleType: 'Xe tải', baseFee: 40000, unit: 'giờ', rushHourFee: 60000, dailyCap: 400000, overtimeFee: 80000, lostTicketFee: 1000000 },
        { vehicleType: 'Xe điện', baseFee: 15000, unit: 'giờ', rushHourFee: 22000, dailyCap: 150000, overtimeFee: 40000, lostTicketFee: 400000 }
    ],
    incidents: []
};

const Api = {
    baseUrl: '',
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
        if (this.token || this.user?.token) {
            return this.token || this.user.token;
        }
        const auth = this.init();
        return auth?.token || null;
    },

    setToken(token) {
        this.token = token || null;
    },

    saveAuth(data) {
        const auth = this.normalizeAuth(data);
        if (!auth?.token) {
            throw new Error('Không tìm thấy token đăng nhập trong phản hồi từ máy chủ.');
        }
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
        return String(role || '')
            .trim()
            .toUpperCase()
            .replace(/^ROLE_/, '') === 'DRIVER';
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
        if (!headers.has('Accept')) {
            headers.set('Accept', 'application/json');
        }

        const token = this.getToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }

        try {
            const response = await fetch(`${this.baseUrl}${path}`, {
                ...requestOptions,
                headers
            });

            const text = await response.text();
            let payload;
            try {
                payload = text ? JSON.parse(text) : null;
            } catch {
                payload = {
                    success: response.ok,
                    message: response.ok ? 'Yêu cầu thành công' : (text || response.statusText),
                    data: text || null
                };
            }

            if (!payload) {
                payload = { success: response.ok, message: response.statusText || '', data: null };
            }

            if (!response.ok || payload.success === false) {
                if (response.status === 401) {
                    this.clearAuth();
                }
                return {
                    success: false,
                    message: payload.message || this.getHttpErrorMessage(response.status),
                    data: payload.data ?? null,
                    status: response.status
                };
            }

            return {
                success: payload.success !== false,
                message: payload.message || 'Yêu cầu thành công',
                data: payload.data ?? null,
                status: response.status
            };
        } catch (error) {
            return {
                success: false,
                message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra Spring Boot đã chạy chưa.',
                data: null,
                error
            };
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
        if (!email || !password) {
            return { success: false, message: 'Vui lòng nhập email và mật khẩu' };
        }
        const result = await this.request('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });

        if (result.success && result.data) {
            result.data = this.normalizeAuth(result.data);
        }
        return result;
    },

    async register(data) {
        if (!data.fullName || !data.email || !data.phoneNumber || !data.password) {
            return { success: false, message: 'Vui lòng điền đầy đủ thông tin' };
        }
        const payload = {
            fullName: data.fullName,
            email: data.email,
            phoneNumber: data.phoneNumber,
            password: data.password
        };

        if (data.dateOfBirth) payload.dateOfBirth = data.dateOfBirth;
        if (data.address) payload.address = data.address;

        const result = await this.request('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (result.success && result.data) {
            result.data = this.normalizeAuth(result.data);
        }
        return result;
    },

    async getCurrentUser() {
        // Backend hiện chưa có endpoint /api/users/me hoặc /api/auth/me.
        // Tạm dùng thông tin JwtResponse đã lưu sau login/register; các feature khác vẫn mock.
        return this.user
            ? { success: true, message: 'Loaded from local auth state', data: this.user }
            : { success: false, message: 'Chưa có thông tin tài khoản', data: null };
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
