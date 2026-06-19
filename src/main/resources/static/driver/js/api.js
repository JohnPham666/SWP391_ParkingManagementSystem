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
    token: null,
    user: null,

    init() {
        const saved = localStorage.getItem('driver_auth');
        if (!saved) return null;
        try {
            const auth = JSON.parse(saved);
            this.token = auth.token;
            this.user = auth;
            return auth;
        } catch {
            return null;
        }
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

    async login(email, password) {
        await this._delay(250);
        if (!email || !password) {
            return { success: false, message: 'Vui lòng nhập email và mật khẩu' };
        }
        return { success: true, data: { ...MockDB.user, email } };
    },

    async register(data) {
        await this._delay(250);
        if (!data.fullName || !data.email || !data.password) {
            return { success: false, message: 'Vui lòng điền đầy đủ thông tin' };
        }
        return {
            success: true,
            data: {
                ...MockDB.user,
                fullName: data.fullName,
                email: data.email,
                phoneNumber: data.phoneNumber
            }
        };
    },

    async forgotPassword(email) {
        try {
            const res = await fetch('http://localhost:8080/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            return { success: res.ok, message: data.message || 'Lỗi hệ thống' };
        } catch (e) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    async resetPassword(token, newPassword) {
        try {
            const res = await fetch('http://localhost:8080/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword })
            });
            const data = await res.json();
            return { success: res.ok, message: data.message || 'Lỗi hệ thống' };
        } catch (e) {
            return { success: false, message: 'Không thể kết nối đến server' };
        }
    },

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};
