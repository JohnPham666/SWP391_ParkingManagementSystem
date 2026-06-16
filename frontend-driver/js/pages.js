/* ===== Driver Pages - mock data and local state only ===== */
const Pages = {
    state: {
        vehicles: [
            { vehicleId: 1, licensePlate: '51A-12345', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', brand: 'Toyota Camry', vehicleColor: 'Trắng', manufactureYear: 2022, isDefault: true },
            { vehicleId: 2, licensePlate: '59B-67890', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', brand: 'Honda SH', vehicleColor: 'Đen', manufactureYear: 2023, isDefault: false }
        ],
        vehicleTypes: [
            { vehicleTypeId: 1, typeName: 'Ô tô' },
            { vehicleTypeId: 2, typeName: 'Xe máy' },
            { vehicleTypeId: 3, typeName: 'Xe tải' }
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
            { zoneId: 1, floorId: 1, zoneName: 'Khu A', description: 'Gần cổng vào' },
            { zoneId: 2, floorId: 1, zoneName: 'Khu B', description: 'Khu xe máy' },
            { zoneId: 3, floorId: 2, zoneName: 'Khu C', description: 'Khu ô tô dài hạn' },
            { zoneId: 4, floorId: 3, zoneName: 'Khu D', description: 'Khu khách vãng lai' }
        ],
        slots: [
            { slotId: 1, zoneId: 1, slotCode: 'A-01', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', capacity: 1, currentOccupancy: 0, status: 'AVAILABLE', isActive: true },
            { slotId: 2, zoneId: 1, slotCode: 'A-02', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', capacity: 1, currentOccupancy: 1, status: 'OCCUPIED', isActive: true },
            { slotId: 3, zoneId: 1, slotCode: 'A-03', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', capacity: 1, currentOccupancy: 0, status: 'AVAILABLE', isActive: true },
            { slotId: 4, zoneId: 1, slotCode: 'A-04', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', capacity: 1, currentOccupancy: 0, status: 'RESERVED', isActive: true },
            { slotId: 5, zoneId: 2, slotCode: 'B-01', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', capacity: 4, currentOccupancy: 1, status: 'AVAILABLE', isActive: true },
            { slotId: 6, zoneId: 2, slotCode: 'B-02', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', capacity: 4, currentOccupancy: 4, status: 'OCCUPIED', isActive: true },
            { slotId: 7, zoneId: 2, slotCode: 'B-03', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', capacity: 4, currentOccupancy: 0, status: 'AVAILABLE', isActive: true },
            { slotId: 8, zoneId: 3, slotCode: 'C-01', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', capacity: 1, currentOccupancy: 0, status: 'AVAILABLE', isActive: true },
            { slotId: 9, zoneId: 3, slotCode: 'C-02', vehicleTypeId: 1, vehicleTypeName: 'Ô tô', capacity: 1, currentOccupancy: 0, status: 'LOCKED', isActive: false },
            { slotId: 10, zoneId: 4, slotCode: 'D-01', vehicleTypeId: 2, vehicleTypeName: 'Xe máy', capacity: 4, currentOccupancy: 0, status: 'RESERVED', isActive: true }
        ],
        reservations: [
            { reservationId: 1, vehicleId: 1, licensePlate: '51A-12345', vehicleTypeName: 'Ô tô', slotId: 4, slotCode: 'A-04', buildingName: 'Tòa nhà A', floorName: 'Tầng B1', zoneName: 'Khu A', reservationStart: nextIso(2), reservationEnd: nextIso(5), status: 'CONFIRMED', paymentStatus: 'PAID', paymentMethod: 'VNPay', amount: 60000 },
            { reservationId: 2, vehicleId: 2, licensePlate: '59B-67890', vehicleTypeName: 'Xe máy', slotId: null, slotCode: 'Tự động', buildingName: '-', floorName: '-', zoneName: '-', reservationStart: nextIso(26), reservationEnd: nextIso(30), status: 'DRAFT', paymentStatus: 'UNPAID', paymentMethod: null, amount: 20000 }
        ],
        sessions: [
            { sessionId: 1, vehicleId: 1, licensePlate: '51A-12345', slotId: 2, slotCode: 'A-02', buildingName: 'Tòa nhà A', floorName: 'Tầng B1', zoneName: 'Khu A', entryTime: nextIso(-3), entryGate: 'Cổng A', status: 'ACTIVE', estimatedFee: 60000 }
        ],
        payments: [
            { paymentId: 1, reservationId: 2, sessionId: null, historyId: null, licensePlate: '59B-67890', description: 'Đặt chỗ #2', amount: 20000, status: 'UNPAID', method: null, transactionId: null, createdAt: nextIso(-2) }
        ],
        pricingPolicies: [
            { pricingId: 1, vehicleTypeId: 1, vehicleTypeName: 'Ô tô', normalPrice: 20000, rushPrice: 30000, offPeakPrice: 15000, dailyCap: 200000, overtimeFee: 50000, lostTicketFee: 500000 },
            { pricingId: 2, vehicleTypeId: 2, vehicleTypeName: 'Xe máy', normalPrice: 5000, rushPrice: 8000, offPeakPrice: 3000, dailyCap: 50000, overtimeFee: 15000, lostTicketFee: 200000 },
            { pricingId: 3, vehicleTypeId: 3, vehicleTypeName: 'Xe tải', normalPrice: 40000, rushPrice: 60000, offPeakPrice: 30000, dailyCap: 400000, overtimeFee: 80000, lostTicketFee: 1000000 }
        ],
        history: [
            { historyId: 1, receiptNumber: 'RC-20250613-001', licensePlate: '51A-12345', vehicleTypeName: 'Ô tô', slotCode: 'A-01', buildingName: 'Tòa nhà A', floorName: 'Tầng B1', zoneName: 'Khu A', entryTime: nextIso(-72), exitTime: nextIso(-69), duration: '3 giờ 0 phút', totalFee: 60000, paymentMethod: 'VNPay', paymentStatus: 'PAID', transactionId: 'TXN-20250613-001', status: 'COMPLETED' },
            { historyId: 2, receiptNumber: 'RC-20250612-002', licensePlate: '59B-67890', vehicleTypeName: 'Xe máy', slotCode: 'B-02', buildingName: 'Tòa nhà A', floorName: 'Tầng B1', zoneName: 'Khu B', entryTime: nextIso(-96), exitTime: nextIso(-94), duration: '2 giờ 0 phút', totalFee: 10000, paymentMethod: 'MoMo', paymentStatus: 'PAID', transactionId: 'TXN-20250612-002', status: 'COMPLETED' }
        ],
        incidents: [
            { incidentId: 1, referenceNumber: 'INC-20250614-001', type: 'Chỗ đỗ hư hỏng', related: 'Phiên #1 - 51A-12345', location: 'A-02, Tầng B1, Tòa nhà A', description: 'Chắn bảo vệ bị cong, cần kiểm tra.', status: 'OPEN', createdAt: nextIso(-18) }
        ],
        parkingFilters: { buildingId: 'all', floorId: 'all', zoneId: 'all', vehicleTypeId: 'all', status: 'all' },
        historyFilters: { vehicleId: 'all', status: 'all', paymentStatus: 'all', fromDate: '', toDate: '' },
        pricingFilter: 'all',
        nextVehicleId: 3,
        nextReservationId: 3,
        nextSessionId: 2,
        nextPaymentId: 2,
        nextHistoryId: 3,
        nextIncidentId: 2
    },

    async home(container) {
        const summary = this.getParkingSummary();
        const activeReservations = this.state.reservations.filter(r => ['PENDING', 'CONFIRMED'].includes(r.status));
        const pendingPayments = this.state.payments.filter(p => p.status === 'UNPAID').length;
        container.innerHTML = `
            <div class="stats-grid">
                ${this.statCard('orange', iconCar(), this.state.vehicles.length, 'Xe của tôi')}
                ${this.statCard('blue', iconCalendar(), activeReservations.length, 'Đặt chỗ')}
                ${this.statCard('green', iconMapPin(), summary.availableSlots, 'Chỗ trống')}
                ${this.statCard('red', iconClock(), this.state.sessions.length, 'Đang đỗ')}
            </div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconMapPin()} Tổng quan bãi xe</span><button class="btn btn-outline btn-sm" onclick="App.navigate('parking')">Tìm chỗ</button></div>
                <div class="card-body">
                    <div class="progress-ring" style="margin:auto">${Math.round(summary.occupancyRate)}%</div>
                    <div class="stats-grid" style="margin-top:16px">
                        <div><strong>${summary.totalSlots}</strong><br> Tổng slot</div>
                        <div><strong>${summary.availableSlots}</strong><br> Trống</div>
                        <div><strong>${summary.occupiedSlots}</strong><br> Đang đỗ</div>
                        <div><strong>${summary.reservedSlots}</strong><br> Đã đặt</div>
                    </div>
                </div>
            </div>
            <div class="quick-actions">
                ${this.featureButton('parking', iconMapPin(), 'Tìm chỗ đỗ xe')}
                ${this.featureButton('reservations', iconCalendar(), 'Đặt chỗ')}
                ${this.featureButton('session', iconClock(), 'Phiên gửi xe')}
                ${this.featureButton('payment', iconWallet(), `Thanh toán (${pendingPayments})`)}
                ${this.featureButton('pricing', iconTag(), 'Chính sách giá')}
                ${this.featureButton('history', iconReceipt(), 'Lịch sử')}
                ${this.featureButton('incident', iconAlert(), 'Báo cáo sự cố')}
                ${this.featureButton('account', iconUser(), 'Hồ sơ cá nhân')}
            </div>
        `;
    },

    async parking(container) {
        const f = this.state.parkingFilters;
        const slots = this.filteredSlots();
        container.innerHTML = `
            <div class="page-header"><h2>Tìm chỗ đỗ xe</h2><p>Kiểm tra tình trạng chỗ trống theo tòa nhà, tầng và khu vực.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconFilter()} Bộ lọc</span><button class="btn btn-outline btn-sm" onclick="Pages.resetParkingFilters()">Đặt lại</button></div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-group"><label>Tòa nhà</label><select id="filter-building" onchange="Pages.updateParkingFilter('buildingId', this.value)"><option value="all">Tất cả</option>${this.state.buildings.map(b => `<option value="${b.buildingId}" ${String(b.buildingId) === f.buildingId ? 'selected' : ''}>${this.escape(b.buildingName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Tầng</label><select id="filter-floor" onchange="Pages.updateParkingFilter('floorId', this.value)"><option value="all">Tất cả</option>${this.state.floors.map(fl => `<option value="${fl.floorId}" ${String(fl.floorId) === f.floorId ? 'selected' : ''}>${this.escape(fl.floorName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Khu vực</label><select id="filter-zone" onchange="Pages.updateParkingFilter('zoneId', this.value)"><option value="all">Tất cả</option>${this.state.zones.map(z => `<option value="${z.zoneId}" ${String(z.zoneId) === f.zoneId ? 'selected' : ''}>${this.escape(z.zoneName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Loại xe</label><select id="filter-vehicle-type" onchange="Pages.updateParkingFilter('vehicleTypeId', this.value)"><option value="all">Tất cả</option>${this.state.vehicleTypes.map(t => `<option value="${t.vehicleTypeId}" ${String(t.vehicleTypeId) === f.vehicleTypeId ? 'selected' : ''}>${this.escape(t.typeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Trạng thái</label><select id="filter-status" onchange="Pages.updateParkingFilter('status', this.value)"><option value="all">Tất cả</option><option value="AVAILABLE" ${f.status === 'AVAILABLE' ? 'selected' : ''}>Trống</option><option value="OCCUPIED" ${f.status === 'OCCUPIED' ? 'selected' : ''}>Đang đỗ</option><option value="RESERVED" ${f.status === 'RESERVED' ? 'selected' : ''}>Đã đặt</option><option value="LOCKED" ${f.status === 'LOCKED' ? 'selected' : ''}>Khóa</option></select></div>
                    </div>
                </div>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">${iconMapPin()} Danh sách slot (${slots.length})</span></div><div class="card-body">${this.renderSlotGroups(slots)}</div></div>
        `;
    },

    async reservations(container) {
        container.innerHTML = `
            <div class="page-header"><h2>Đặt chỗ</h2><p>Tạo yêu cầu đặt chỗ và thanh toán bằng dữ liệu mô phỏng.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconCalendar()} Tạo đặt chỗ mới</span></div>
                <form class="card-body" onsubmit="Pages.createReservation(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Xe</label><select id="reservation-vehicle" required>${this.state.vehicles.map(v => `<option value="${v.vehicleId}">${this.escape(v.licensePlate)} - ${this.escape(v.vehicleTypeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Chọn slot</label><select id="reservation-slot"><option value="">Tự động chọn slot trống</option>${this.state.slots.filter(s => s.status === 'AVAILABLE').map(s => `<option value="${s.slotId}">${this.escape(s.slotCode)} - ${this.escape(this.slotLocationText(s))}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Giờ bắt đầu</label><input id="reservation-start" type="datetime-local" value="${localDateTimeValue(new Date(Date.now() + 3600000))}" required></div>
                        <div class="form-group"><label>Giờ kết thúc</label><input id="reservation-end" type="datetime-local" value="${localDateTimeValue(new Date(Date.now() + 10800000))}" required></div>
                    </div>
                    <button class="btn btn-primary btn-full" type="submit">Xác nhận đặt chỗ</button>
                </form>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Danh sách đặt chỗ</span></div><div class="card-body">${this.state.reservations.map(r => this.renderReservation(r)).join('') || this.emptyState(iconCalendar(), 'Không có dữ liệu đặt chỗ.')}</div></div>
        `;
    },

    async vehicles(container) {
        container.innerHTML = `
            <div class="page-header"><h2>Quản lý xe</h2><p>Thêm, sửa, xóa phương tiện của tài khoản tài xế.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconCar()} Xe của tôi</span><button class="btn btn-primary btn-sm" onclick="Pages.showVehicleModal()">Thêm xe</button></div>
                <div class="card-body">${this.state.vehicles.map(v => this.renderVehicle(v)).join('')}</div>
            </div>
        `;
    },

    async account(container) {
        const u = App.state.user || Api.user || { fullName: 'Tài xế', email: 'driver@example.com', phoneNumber: '' };
        container.innerHTML = `
            <div class="page-header"><h2>Hồ sơ cá nhân</h2><p>Thông tin tài khoản đang dùng trong prototype.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconUser()} Thông tin tài khoản</span></div>
                <div class="card-body">
                    ${this.infoRow('Họ tên', u.fullName)}
                    ${this.infoRow('Email', u.email)}
                    ${this.infoRow('Số điện thoại', u.phoneNumber || 'Chưa cập nhật')}
                    ${this.infoRow('Vai trò', 'Tài xế')}
                    <div class="button-row">
                        <button class="btn btn-primary" onclick="Pages.showProfileModal()">Sửa hồ sơ</button>
                        <button class="btn btn-outline" onclick="Pages.changePassword()">Đổi mật khẩu</button>
                        <button class="btn btn-outline" onclick="App.logout()">Đăng xuất</button>
                    </div>
                </div>
            </div>
        `;
    },

    async session(container) {
        const session = this.state.sessions.find(s => s.status === 'ACTIVE');
        container.innerHTML = `
            <div class="page-header"><h2>Phiên gửi xe</h2><p>Bắt đầu hoặc kết thúc phiên gửi xe bằng dữ liệu mô phỏng.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconClock()} Bắt đầu phiên gửi xe</span></div>
                <form class="card-body" onsubmit="Pages.startSession(event)">
                    <div class="qr-placeholder">Khu vực quét mã QR</div>
                    <div class="form-grid">
                        <div class="form-group"><label>Mã đặt chỗ</label><input id="session-reservation-code" placeholder="VD: 1 hoặc để trống"></div>
                        <div class="form-group"><label>Xe đi thẳng</label><select id="session-walkin-vehicle">${this.state.vehicles.map(v => `<option value="${v.vehicleId}">${this.escape(v.licensePlate)} - ${this.escape(v.vehicleTypeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Cổng vào</label><input id="session-entry-gate" value="Cổng A"></div>
                    </div>
                    <button class="btn btn-primary btn-full" type="submit">Bắt đầu phiên</button>
                </form>
            </div>
            ${session ? this.renderActiveSession(session) : this.emptyState(iconClock(), 'Chưa có phiên gửi xe đang hoạt động.')}
        `;
    },

    async payment(container) {
        const unpaid = this.state.payments.filter(p => p.status === 'UNPAID');
        const paid = this.state.payments.filter(p => p.status === 'PAID');
        container.innerHTML = `
            <div class="page-header"><h2>Thanh toán</h2><p>Thanh toán mô phỏng, không kết nối cổng thanh toán thật.</p></div>
            <div class="card"><div class="card-header"><span class="card-title">${iconWallet()} Khoản cần thanh toán</span></div><div class="card-body">${unpaid.map(p => this.renderPayableCard(p)).join('') || this.emptyState(iconWallet(), 'Không có khoản cần thanh toán.')}</div></div>
            <div class="card"><div class="card-header"><span class="card-title">Đã thanh toán</span></div><div class="card-body">${paid.map(p => this.renderPaidPaymentCard(p)).join('') || this.emptyState(iconReceipt(), 'Chưa có giao dịch thành công.')}</div></div>
        `;
    },

    async pricing(container) {
        const filter = this.state.pricingFilter;
        const policies = this.state.pricingPolicies.filter(p => filter === 'all' || String(p.vehicleTypeId) === filter);
        container.innerHTML = `
            <div class="page-header"><h2>Chính sách giá</h2><p>Xem giá theo loại xe, giờ cao điểm và phí phát sinh.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconTag()} Bảng giá</span></div>
                <div class="card-body">
                    <div class="form-group"><label>Lọc theo loại xe</label><select onchange="Pages.setPricingFilter(this.value)"><option value="all">Tất cả</option>${this.state.vehicleTypes.map(t => `<option value="${t.vehicleTypeId}" ${String(t.vehicleTypeId) === filter ? 'selected' : ''}>${this.escape(t.typeName)}</option>`).join('')}</select></div>
                    <div class="pricing-grid">${policies.map(p => this.renderPricingCard(p)).join('')}</div>
                </div>
            </div>
        `;
    },

    async history(container) {
        const filters = this.state.historyFilters;
        const list = this.filteredHistory();
        container.innerHTML = `
            <div class="page-header"><h2>Lịch sử gửi xe</h2><p>Xem lịch sử và biên lai thanh toán.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconFilter()} Bộ lọc lịch sử</span></div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-group"><label>Từ ngày</label><input type="date" value="${filters.fromDate}" onchange="Pages.updateHistoryFilter('fromDate', this.value)"></div>
                        <div class="form-group"><label>Đến ngày</label><input type="date" value="${filters.toDate}" onchange="Pages.updateHistoryFilter('toDate', this.value)"></div>
                        <div class="form-group"><label>Xe</label><select onchange="Pages.updateHistoryFilter('vehicleId', this.value)"><option value="all">Tất cả</option>${this.state.vehicles.map(v => `<option value="${v.vehicleId}" ${String(v.vehicleId) === filters.vehicleId ? 'selected' : ''}>${this.escape(v.licensePlate)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Trạng thái</label><select onchange="Pages.updateHistoryFilter('status', this.value)"><option value="all">Tất cả</option><option value="COMPLETED" ${filters.status === 'COMPLETED' ? 'selected' : ''}>Hoàn tất</option></select></div>
                        <div class="form-group"><label>Thanh toán</label><select onchange="Pages.updateHistoryFilter('paymentStatus', this.value)"><option value="all">Tất cả</option><option value="PAID" ${filters.paymentStatus === 'PAID' ? 'selected' : ''}>Đã thanh toán</option><option value="UNPAID" ${filters.paymentStatus === 'UNPAID' ? 'selected' : ''}>Chưa thanh toán</option></select></div>
                    </div>
                </div>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">${iconReceipt()} Danh sách lịch sử (${list.length})</span></div><div class="card-body">${list.map(h => this.renderHistoryItem(h)).join('') || this.emptyState(iconReceipt(), 'Không có dữ liệu phù hợp.')}</div></div>
        `;
    },

    async incident(container) {
        container.innerHTML = `
            <div class="page-header"><h2>Báo cáo sự cố</h2><p>Gửi báo cáo sự cố trong bãi xe bằng trạng thái mô phỏng.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconAlert()} Tạo báo cáo</span></div>
                <form class="card-body" onsubmit="Pages.submitIncident(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Loại sự cố *</label><select id="incident-type" required><option value="">Chọn loại sự cố</option><option>Chỗ đỗ hư hỏng</option><option>Xe bị chắn lối</option><option>Vấn đề thanh toán</option><option>Mất vé</option><option>Điều kiện không an toàn</option><option>Khác</option></select></div>
                        <div class="form-group"><label>Liên quan đến</label><select id="incident-related">${this.incidentRelatedOptions().map(x => `<option>${this.escape(x)}</option>`).join('')}</select></div>
                        <div class="form-group full-width"><label>Vị trí *</label><input id="incident-location" placeholder="VD: A-02, Tầng B1, Tòa nhà A" required></div>
                        <div class="form-group full-width"><label>Mô tả *</label><textarea id="incident-description" rows="4" placeholder="Mô tả ngắn gọn sự cố" required></textarea></div>
                    </div>
                    <div class="qr-placeholder">Khu vực tải bằng chứng mô phỏng</div>
                    <button class="btn btn-primary btn-full" type="submit">Gửi báo cáo</button>
                </form>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Sự cố đã gửi</span></div><div class="card-body">${this.state.incidents.map(i => this.renderIncident(i)).join('') || this.emptyState(iconAlert(), 'Chưa có báo cáo sự cố.')}</div></div>
        `;
    },

    updateParkingFilter(key, value) {
        this.state.parkingFilters[key] = value;
        App.navigate('parking');
    },

    resetParkingFilters() {
        this.state.parkingFilters = { buildingId: 'all', floorId: 'all', zoneId: 'all', vehicleTypeId: 'all', status: 'all' };
        App.navigate('parking');
    },

    createReservation(event) {
        event.preventDefault();
        const vehicle = this.findVehicle(Number(document.getElementById('reservation-vehicle').value));
        const selectedSlotId = Number(document.getElementById('reservation-slot').value);
        const slot = selectedSlotId
            ? this.state.slots.find(s => s.slotId === selectedSlotId)
            : this.state.slots.find(s => s.status === 'AVAILABLE' && s.vehicleTypeId === vehicle.vehicleTypeId);
        if (!slot) {
            App.showToast('Không còn slot trống phù hợp, vui lòng chọn thời gian hoặc cơ sở khác.', 'error');
            return;
        }
        const location = this.getSlotLocation(slot);
        slot.status = 'RESERVED';
        const reservation = {
            reservationId: this.state.nextReservationId++,
            vehicleId: vehicle.vehicleId,
            licensePlate: vehicle.licensePlate,
            vehicleTypeName: vehicle.vehicleTypeName,
            slotId: slot.slotId,
            slotCode: slot.slotCode,
            buildingName: location.buildingName,
            floorName: location.floorName,
            zoneName: location.zoneName,
            reservationStart: new Date(document.getElementById('reservation-start').value).toISOString(),
            reservationEnd: new Date(document.getElementById('reservation-end').value).toISOString(),
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            paymentMethod: null,
            amount: this.estimateReservationFee(vehicle)
        };
        this.state.reservations.unshift(reservation);
        this.state.payments.unshift({
            paymentId: this.state.nextPaymentId++,
            reservationId: reservation.reservationId,
            sessionId: null,
            historyId: null,
            licensePlate: reservation.licensePlate,
            description: `Đặt chỗ #${reservation.reservationId}`,
            amount: reservation.amount,
            status: 'UNPAID',
            method: null,
            transactionId: null,
            createdAt: new Date().toISOString()
        });
        App.showToast('Đã tạo đặt chỗ, slot được chuyển sang trạng thái đã đặt.', 'success');
        App.navigate('reservations');
    },

    confirmReservation(reservationId, method) {
        const reservation = this.state.reservations.find(r => r.reservationId === reservationId);
        if (!reservation) return;
        reservation.status = 'CONFIRMED';
        reservation.paymentStatus = 'PAID';
        reservation.paymentMethod = method;
        const payment = this.state.payments.find(p => p.reservationId === reservationId);
        if (payment) {
            payment.status = 'PAID';
            payment.method = method;
            payment.transactionId = `TXN-${Date.now()}`;
            payment.paidAt = new Date().toISOString();
        }
        App.showToast(method === 'Cash' ? 'Đã xác nhận thanh toán tiền mặt.' : 'Thanh toán mô phỏng thành công.', 'success');
        App.navigate('reservations');
    },

    cancelReservation(reservationId) {
        const reservation = this.state.reservations.find(r => r.reservationId === reservationId);
        if (!reservation) return;
        reservation.status = 'CANCELLED';
        if (reservation.slotId) {
            const slot = this.state.slots.find(s => s.slotId === reservation.slotId);
            if (slot) slot.status = 'AVAILABLE';
        }
        App.showToast('Đã hủy đặt chỗ.', 'success');
        App.navigate('reservations');
    },

    showVehicleModal(vehicleId = null) {
        const vehicle = vehicleId ? this.findVehicle(vehicleId) : null;
        this.openModal(`
            <form onsubmit="Pages.saveVehicle(event, ${vehicleId || 'null'})">
                <div class="modal-header"><h3>${vehicle ? 'Sửa xe' : 'Thêm xe'}</h3><button class="modal-close" type="button" onclick="Pages.closeModal()">${iconClose()}</button></div>
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group"><label>Biển số *</label><input id="vehicle-plate" value="${this.escapeAttr(vehicle?.licensePlate || '')}" required></div>
                        <div class="form-group"><label>Loại xe *</label><select id="vehicle-type">${this.state.vehicleTypes.map(t => `<option value="${t.vehicleTypeId}" ${vehicle?.vehicleTypeId === t.vehicleTypeId ? 'selected' : ''}>${this.escape(t.typeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Hãng xe</label><input id="vehicle-brand" value="${this.escapeAttr(vehicle?.brand || '')}"></div>
                        <div class="form-group"><label>Màu xe</label><input id="vehicle-color" value="${this.escapeAttr(vehicle?.vehicleColor || '')}"></div>
                        <div class="form-group"><label>Năm sản xuất</label><input id="vehicle-year" type="number" value="${vehicle?.manufactureYear || new Date().getFullYear()}"></div>
                    </div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="Pages.closeModal()">Hủy</button><button class="btn btn-primary" type="submit">Lưu</button></div>
            </form>
        `);
    },

    saveVehicle(event, vehicleId) {
        event.preventDefault();
        const type = this.state.vehicleTypes.find(t => t.vehicleTypeId === Number(document.getElementById('vehicle-type').value));
        const data = {
            licensePlate: document.getElementById('vehicle-plate').value.trim().toUpperCase(),
            vehicleTypeId: type.vehicleTypeId,
            vehicleTypeName: type.typeName,
            brand: document.getElementById('vehicle-brand').value.trim(),
            vehicleColor: document.getElementById('vehicle-color').value.trim(),
            manufactureYear: Number(document.getElementById('vehicle-year').value)
        };
        if (vehicleId) {
            Object.assign(this.findVehicle(vehicleId), data);
            App.showToast('Đã cập nhật xe.', 'success');
        } else {
            this.state.vehicles.push({ vehicleId: this.state.nextVehicleId++, ...data, isDefault: this.state.vehicles.length === 0 });
            App.showToast('Đã thêm xe.', 'success');
        }
        this.closeModal();
        App.navigate('vehicles');
    },

    setDefaultVehicle(vehicleId) {
        this.state.vehicles.forEach(v => v.isDefault = v.vehicleId === vehicleId);
        App.showToast('Đã đặt làm xe mặc định.', 'success');
        App.navigate('vehicles');
    },

    deleteVehicle(vehicleId) {
        this.openConfirm('Xóa xe', 'Bạn có chắc muốn xóa xe này khỏi danh sách?', () => {
            this.state.vehicles = this.state.vehicles.filter(v => v.vehicleId !== vehicleId);
            App.showToast('Đã xóa xe.', 'success');
            App.navigate('vehicles');
        });
    },

    showProfileModal() {
        const u = App.state.user || Api.user;
        this.openModal(`
            <form onsubmit="Pages.saveProfile(event)">
                <div class="modal-header"><h3>Sửa hồ sơ</h3><button type="button" class="modal-close" onclick="Pages.closeModal()">${iconClose()}</button></div>
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group full-width"><label>Họ tên</label><input id="profile-name" value="${this.escapeAttr(u.fullName || '')}" required></div>
                        <div class="form-group full-width"><label>Email</label><input id="profile-email" value="${this.escapeAttr(u.email || '')}" required></div>
                        <div class="form-group full-width"><label>Số điện thoại</label><input id="profile-phone" value="${this.escapeAttr(u.phoneNumber || '')}"></div>
                    </div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="Pages.closeModal()">Hủy</button><button class="btn btn-primary" type="submit">Lưu</button></div>
            </form>
        `);
    },

    saveProfile(event) {
        event.preventDefault();
        const data = {
            fullName: document.getElementById('profile-name').value.trim(),
            email: document.getElementById('profile-email').value.trim(),
            phoneNumber: document.getElementById('profile-phone').value.trim()
        };
        Object.assign(App.state.user, data);
        Api.saveAuth(App.state.user);
        this.closeModal();
        App.showToast('Đã cập nhật hồ sơ.', 'success');
        App.showApp();
    },

    changePassword() {
        this.openConfirm('Đổi mật khẩu demo', 'Chức năng này đang dùng dữ liệu mô phỏng và không gửi dữ liệu lên server.', () => {
            App.showToast('Đã giả lập đổi mật khẩu.', 'success');
        });
    },

    startSession(event) {
        event.preventDefault();
        if (this.state.sessions.some(s => s.status === 'ACTIVE')) {
            App.showToast('Đang có phiên hoạt động, hãy checkout trước.', 'error');
            return;
        }
        const reservationCode = document.getElementById('session-reservation-code').value.trim();
        const reservation = reservationCode ? this.state.reservations.find(r => String(r.reservationId) === reservationCode && r.status === 'CONFIRMED') : null;
        const vehicle = reservation ? this.findVehicle(reservation.vehicleId) : this.findVehicle(Number(document.getElementById('session-walkin-vehicle').value));
        const slot = reservation ? this.state.slots.find(s => s.slotId === reservation.slotId) : this.state.slots.find(s => s.status === 'AVAILABLE' && s.vehicleTypeId === vehicle.vehicleTypeId);
        if (!slot) {
            App.showToast('Không còn slot trống phù hợp.', 'error');
            return;
        }
        const location = this.getSlotLocation(slot);
        slot.status = 'OCCUPIED';
        const session = {
            sessionId: this.state.nextSessionId++,
            vehicleId: vehicle.vehicleId,
            licensePlate: vehicle.licensePlate,
            slotId: slot.slotId,
            slotCode: slot.slotCode,
            buildingName: location.buildingName,
            floorName: location.floorName,
            zoneName: location.zoneName,
            entryTime: new Date().toISOString(),
            entryGate: document.getElementById('session-entry-gate').value || 'Cổng A',
            status: 'ACTIVE',
            estimatedFee: this.estimateReservationFee(vehicle)
        };
        if (reservation) reservation.status = 'COMPLETED';
        this.state.sessions.unshift(session);
        App.showToast('Đã bắt đầu phiên gửi xe.', 'success');
        App.navigate('session');
    },

    showCheckoutModal(sessionId) {
        const session = this.state.sessions.find(s => s.sessionId === sessionId);
        if (!session) return;
        const fee = this.estimateSessionFee(session);
        this.openModal(`
            <div class="modal-header"><h3>Tóm tắt checkout</h3><button class="modal-close" onclick="Pages.closeModal()">${iconClose()}</button></div>
            <div class="modal-body">
                ${this.infoRow('Biển số', session.licensePlate)}
                ${this.infoRow('Vị trí', `${session.slotCode} - ${session.zoneName}, ${session.floorName}, ${session.buildingName}`)}
                ${this.infoRow('Thời lượng', this.calculateDuration(session.entryTime))}
                ${this.infoRow('Phí tạm tính', this.money(fee))}
            </div>
            <div class="modal-footer"><button class="btn btn-outline" onclick="Pages.closeModal()">Hủy</button><button class="btn btn-primary" onclick="Pages.confirmCheckout(${session.sessionId})">Xác nhận checkout</button></div>
        `);
    },

    confirmCheckout(sessionId) {
        const session = this.state.sessions.find(s => s.sessionId === sessionId);
        if (!session) return;
        const exitTime = new Date().toISOString();
        const fee = this.estimateSessionFee(session);
        session.status = 'COMPLETED';
        session.exitTime = exitTime;
        const slot = this.state.slots.find(s => s.slotId === session.slotId);
        if (slot) slot.status = 'AVAILABLE';
        const history = {
            historyId: this.state.nextHistoryId++,
            receiptNumber: `RC-${Date.now()}`,
            licensePlate: session.licensePlate,
            vehicleTypeName: this.findVehicle(session.vehicleId)?.vehicleTypeName || '-',
            slotCode: session.slotCode,
            buildingName: session.buildingName,
            floorName: session.floorName,
            zoneName: session.zoneName,
            entryTime: session.entryTime,
            exitTime,
            duration: this.calculateDuration(session.entryTime, exitTime),
            totalFee: fee,
            paymentMethod: null,
            paymentStatus: 'UNPAID',
            transactionId: null,
            status: 'COMPLETED'
        };
        this.state.history.unshift(history);
        this.state.payments.unshift({
            paymentId: this.state.nextPaymentId++,
            reservationId: null,
            sessionId: session.sessionId,
            historyId: history.historyId,
            licensePlate: session.licensePlate,
            description: `Phiên gửi xe #${session.sessionId}`,
            amount: fee,
            status: 'UNPAID',
            method: null,
            transactionId: null,
            createdAt: new Date().toISOString()
        });
        this.closeModal();
        App.showToast('Checkout hoàn tất, vui lòng thanh toán.', 'success');
        App.navigate('payment');
    },

    payNow(paymentId) {
        const payment = this.state.payments.find(p => p.paymentId === paymentId);
        if (!payment) return;
        const method = document.getElementById(`payment-method-${paymentId}`).value;
        payment.status = 'PAID';
        payment.method = method;
        payment.transactionId = `TXN-${Date.now()}`;
        payment.paidAt = new Date().toISOString();
        if (payment.reservationId) {
            const reservation = this.state.reservations.find(r => r.reservationId === payment.reservationId);
            if (reservation) {
                reservation.status = 'CONFIRMED';
                reservation.paymentStatus = 'PAID';
                reservation.paymentMethod = method;
            }
        }
        if (payment.historyId) {
            const history = this.state.history.find(h => h.historyId === payment.historyId);
            if (history) {
                history.paymentStatus = 'PAID';
                history.paymentMethod = method;
                history.transactionId = payment.transactionId;
            }
        }
        App.showToast(`Thanh toán thành công: ${payment.transactionId}`, 'success');
        App.navigate('payment');
    },

    setPricingFilter(value) {
        this.state.pricingFilter = value;
        App.navigate('pricing');
    },

    updateHistoryFilter(key, value) {
        this.state.historyFilters[key] = value;
        App.navigate('history');
    },

    viewHistoryDetail(historyId) {
        const item = this.state.history.find(h => h.historyId === historyId);
        if (!item) return;
        this.openModal(`
            <div class="modal-header"><h3>Chi tiết gửi xe</h3><button class="modal-close" onclick="Pages.closeModal()">${iconClose()}</button></div>
            <div class="modal-body">${this.receiptRows(item)}</div>
            <div class="modal-footer"><button class="btn btn-outline" onclick="Pages.closeModal()">Đóng</button><button class="btn btn-primary" onclick="Pages.viewReceipt(${item.historyId})">Xem biên lai</button></div>
        `);
    },

    viewReceiptByPayment(paymentId) {
        const payment = this.state.payments.find(p => p.paymentId === paymentId);
        const item = payment?.historyId ? this.state.history.find(h => h.historyId === payment.historyId) : this.state.history.find(h => h.licensePlate === payment?.licensePlate && h.paymentStatus === 'PAID');
        if (item) this.viewReceipt(item.historyId);
        else App.showToast('Biên lai sẽ được tạo sau khi checkout hoàn tất.', 'info');
    },

    viewReceipt(historyId) {
        const item = this.state.history.find(h => h.historyId === historyId);
        if (!item) return;
        this.openModal(`
            <div class="modal-header"><h3>Biên lai</h3><button class="modal-close" onclick="Pages.closeModal()">${iconClose()}</button></div>
            <div class="modal-body">${this.receiptRows(item)}</div>
            <div class="modal-footer"><button class="btn btn-outline" onclick="Pages.mockAction('Tải PDF')">Tải PDF</button><button class="btn btn-outline" onclick="Pages.mockAction('In')">In</button></div>
        `);
    },

    mockAction(name) {
        App.showToast(`${name} mô phỏng`, 'info');
    },

    submitIncident(event) {
        event.preventDefault();
        const type = document.getElementById('incident-type').value;
        const related = document.getElementById('incident-related').value;
        const location = document.getElementById('incident-location').value.trim();
        const description = document.getElementById('incident-description').value.trim();
        if (!type || !location || !description) {
            App.showToast('Vui lòng nhập đầy đủ loại sự cố, vị trí và mô tả.', 'error');
            return;
        }
        const incident = {
            incidentId: this.state.nextIncidentId++,
            referenceNumber: `INC-${Date.now()}`,
            type,
            related,
            location,
            description,
            status: 'OPEN',
            createdAt: new Date().toISOString()
        };
        this.state.incidents.unshift(incident);
        event.target.reset();
        App.showToast(`Đã gửi báo cáo: ${incident.referenceNumber}`, 'success');
        App.navigate('incident');
    },

    renderSlotGroups(slots) {
        if (!slots.length) return this.emptyState(iconMapPin(), 'Không có slot phù hợp với bộ lọc.');
        return this.state.buildings.map(building => {
            const buildingSlots = slots.filter(slot => this.getSlotLocation(slot).buildingId === building.buildingId);
            if (!buildingSlots.length) return '';
            return `
                <div class="zone-group">
                    <h3>${this.escape(building.buildingName)}</h3>
                    <div class="slot-grid">${buildingSlots.map(slot => this.renderSlot(slot)).join('')}</div>
                </div>
            `;
        }).join('');
    },

    renderSlot(slot) {
        const label = { AVAILABLE: 'Trống', OCCUPIED: 'Đang đỗ', RESERVED: 'Đã đặt', LOCKED: 'Khóa' }[slot.status] || slot.status;
        const cls = slot.status.toLowerCase();
        const action = slot.status === 'AVAILABLE'
            ? `onclick="Pages.occupySlot(${slot.slotId})" title="Bấm để giả lập xe vào"`
            : slot.status === 'OCCUPIED'
                ? `onclick="Pages.releaseSlot(${slot.slotId})" title="Bấm để trả slot"`
                : '';
        return `<button class="slot-tile ${cls}" ${action}><strong>${this.escape(slot.slotCode)}</strong><span>${label}</span><small>${this.escape(slot.vehicleTypeName)}</small></button>`;
    },

    occupySlot(slotId) {
        const slot = this.state.slots.find(s => s.slotId === slotId);
        if (slot) {
            slot.status = 'OCCUPIED';
            slot.currentOccupancy = slot.capacity;
            App.showToast(`Slot ${slot.slotCode} chuyển sang đang đỗ.`, 'success');
            App.navigate('parking');
        }
    },

    releaseSlot(slotId) {
        const slot = this.state.slots.find(s => s.slotId === slotId);
        if (slot) {
            slot.status = 'AVAILABLE';
            slot.currentOccupancy = 0;
            App.showToast(`Slot ${slot.slotCode} đã trống.`, 'success');
            App.navigate('parking');
        }
    },

    renderVehicle(v) {
        return `
            <div class="vehicle-card">
                <div class="vehicle-icon">${iconCar()}</div>
                <div class="vehicle-info">
                    <h3>${this.escape(v.licensePlate)} ${v.isDefault ? '<span class="badge badge-orange">Mặc định</span>' : ''}</h3>
                    <div class="vehicle-meta">${this.escape(v.vehicleTypeName)} - ${this.escape(v.brand || 'Chưa rõ hãng')} - ${this.escape(v.vehicleColor || 'Chưa rõ màu')}</div>
                    <div class="button-row">
                        <button class="btn btn-outline btn-sm" onclick="Pages.showVehicleModal(${v.vehicleId})">Sửa</button>
                        <button class="btn btn-outline btn-sm" onclick="Pages.setDefaultVehicle(${v.vehicleId})">Mặc định</button>
                        <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="Pages.deleteVehicle(${v.vehicleId})">Xóa</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderReservation(r) {
        const statusBadge = {
            DRAFT: '<span class="badge badge-gray">Bản nháp</span>',
            PENDING: '<span class="badge badge-yellow">Chờ thanh toán</span>',
            CONFIRMED: '<span class="badge badge-green">Đã xác nhận</span>',
            COMPLETED: '<span class="badge badge-blue">Đã dùng</span>',
            CANCELLED: '<span class="badge badge-red">Đã hủy</span>'
        }[r.status] || `<span class="badge badge-gray">${this.escape(r.status)}</span>`;
        const paymentBadge = r.paymentStatus === 'PAID'
            ? `<span class="badge badge-green">${this.escape(r.paymentMethod || 'Đã thanh toán')}</span>`
            : '<span class="badge badge-yellow">Chưa thanh toán</span>';
        const canPay = ['DRAFT', 'PENDING'].includes(r.status) && r.paymentStatus !== 'PAID';
        return `
            <div class="list-item">
                <div class="list-info">
                    <h4>${this.escape(r.licensePlate)} - ${this.escape(r.slotCode || 'Tự động')}</h4>
                    <p>${this.escape(r.zoneName)}, ${this.escape(r.floorName)}, ${this.escape(r.buildingName)}</p>
                    <p>Từ ${this.formatDateTime(r.reservationStart)} đến ${this.formatDateTime(r.reservationEnd)}</p>
                    <p>Phí tạm tính: <strong>${this.money(r.amount)}</strong></p>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${statusBadge}${paymentBadge}</div>
                <div class="button-row">
                    ${canPay ? `<button class="btn btn-primary btn-sm" onclick="Pages.confirmReservation(${r.reservationId}, 'VNPay')">Thanh toán online</button>` : ''}
                    ${canPay ? `<button class="btn btn-outline btn-sm" onclick="Pages.confirmReservation(${r.reservationId}, 'Cash')">Tiền mặt</button>` : ''}
                    ${['DRAFT', 'PENDING', 'CONFIRMED'].includes(r.status) ? `<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="Pages.cancelReservation(${r.reservationId})">Hủy</button>` : ''}
                </div>
            </div>
        `;
    },

    renderActiveSession(session) {
        const duration = this.calculateDuration(session.entryTime);
        const fee = this.estimateSessionFee(session);
        return `
            <div class="card">
                <div class="card-header"><span class="card-title">${iconClock()} Phiên đang hoạt động</span><span class="badge badge-green">Đang đỗ</span></div>
                <div class="card-body">
                    <div class="stats-grid">
                        ${this.statCard('orange', iconCar(), session.licensePlate, 'Biển số')}
                        ${this.statCard('blue', iconMapPin(), session.slotCode, 'Mã slot')}
                        ${this.statCard('green', iconClock(), duration, 'Thời lượng hiện tại')}
                        ${this.statCard('red', iconWallet(), this.money(fee), 'Phí tạm tính')}
                    </div>
                    ${this.infoRow('Vị trí', `${session.zoneName}, ${session.floorName}, ${session.buildingName}`)}
                    ${this.infoRow('Giờ vào', this.formatDateTime(session.entryTime))}
                    <div class="button-row">
                        <button class="btn btn-primary" onclick="Pages.showCheckoutModal(${session.sessionId})">Kết thúc phiên</button>
                        <button class="btn btn-outline" onclick="App.navigate('incident')">Báo cáo sự cố</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderPayableCard(payment) {
        return `
            <div class="payment-card">
                <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start">
                    <div><strong>${this.escape(payment.description)}</strong><p style="font-size:.78rem;color:var(--text-muted);margin-top:3px">${this.escape(payment.licensePlate)}</p></div>
                    <span class="badge badge-yellow">Chưa thanh toán</span>
                </div>
                <div style="font-size:1.35rem;font-weight:800;color:var(--accent);margin:12px 0">${this.money(payment.amount)}</div>
                <div class="form-group">
                    <label>Phương thức thanh toán</label>
                    <select id="payment-method-${payment.paymentId}">
                        <option value="VNPay">VNPay</option>
                        <option value="MoMo">MoMo</option>
                        <option value="Banking">Chuyển khoản ngân hàng</option>
                        <option value="Tiền mặt tại quầy">Tiền mặt tại quầy</option>
                    </select>
                </div>
                <button class="btn btn-primary btn-full" style="margin-top:12px" onclick="Pages.payNow(${payment.paymentId})">Thanh toán ngay</button>
            </div>
        `;
    },

    renderPaidPaymentCard(payment) {
        return `
            <div class="payment-card">
                <div style="display:flex;justify-content:space-between;gap:12px">
                    <div><strong>${this.escape(payment.description)}</strong><p style="font-size:.78rem;color:var(--text-muted);margin-top:3px">${this.escape(payment.transactionId || '-')}</p></div>
                    <span class="badge badge-green">Đã thanh toán</span>
                </div>
                <div class="button-row" style="margin-top:12px">
                    <span style="font-weight:800;color:var(--accent)">${this.money(payment.amount)}</span>
                    <button class="btn btn-outline btn-sm" onclick="Pages.viewReceiptByPayment(${payment.paymentId})">Xem biên lai</button>
                </div>
            </div>
        `;
    },

    renderPricingCard(p) {
        return `
            <div class="pricing-card">
                <h3>${this.escape(p.vehicleTypeName)}</h3>
                ${this.infoRow('Giờ thường', this.money(p.normalPrice))}
                ${this.infoRow('Giờ cao điểm', this.money(p.rushPrice))}
                ${this.infoRow('Giờ thấp điểm', this.money(p.offPeakPrice))}
                ${this.infoRow('Giới hạn ngày', this.money(p.dailyCap))}
                ${this.infoRow('Phí quá giờ', this.money(p.overtimeFee))}
                ${this.infoRow('Phí mất vé', this.money(p.lostTicketFee))}
            </div>
        `;
    },

    renderHistoryItem(item) {
        return `
            <div class="list-item">
                <div class="list-info">
                    <h4>${this.escape(item.licensePlate)} - ${this.escape(item.slotCode)}</h4>
                    <p>${this.escape(item.zoneName)}, ${this.escape(item.floorName)}, ${this.escape(item.buildingName)}</p>
                    <p>${this.formatDateTime(item.entryTime)} đến ${this.formatDateTime(item.exitTime)}</p>
                    <p>Thời lượng: ${this.escape(item.duration)} - Tổng phí: <strong>${this.money(item.totalFee)}</strong></p>
                </div>
                <span class="badge ${item.paymentStatus === 'PAID' ? 'badge-green' : 'badge-yellow'}">${item.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                <div class="button-row"><button class="btn btn-outline btn-sm" onclick="Pages.viewHistoryDetail(${item.historyId})">Xem chi tiết</button><button class="btn btn-primary btn-sm" onclick="Pages.viewReceipt(${item.historyId})">Xem biên lai</button></div>
            </div>
        `;
    },

    renderIncident(item) {
        return `
            <div class="list-item">
                <div class="list-info">
                    <h4>${this.escape(item.referenceNumber)} - ${this.escape(item.type)}</h4>
                    <p>${this.escape(item.location)}</p>
                    <p>${this.escape(item.description)}</p>
                    <p style="font-size:.75rem;color:var(--text-muted);margin-top:8px">${this.escape(item.related || 'Không có')} - ${this.formatDateTime(item.createdAt)}</p>
                </div>
                <span class="badge badge-yellow">Đang mở</span>
            </div>
        `;
    },

    filteredSlots() {
        const f = this.state.parkingFilters;
        return this.state.slots.filter(slot => {
            const loc = this.getSlotLocation(slot);
            if (f.buildingId !== 'all' && String(loc.buildingId) !== f.buildingId) return false;
            if (f.floorId !== 'all' && String(loc.floorId) !== f.floorId) return false;
            if (f.zoneId !== 'all' && String(slot.zoneId) !== f.zoneId) return false;
            if (f.vehicleTypeId !== 'all' && String(slot.vehicleTypeId) !== f.vehicleTypeId) return false;
            if (f.status !== 'all' && slot.status !== f.status) return false;
            return true;
        });
    },

    filteredHistory() {
        const f = this.state.historyFilters;
        return this.state.history.filter(item => {
            const vehicle = this.state.vehicles.find(v => v.licensePlate === item.licensePlate);
            if (f.vehicleId !== 'all' && String(vehicle?.vehicleId) !== f.vehicleId) return false;
            if (f.status !== 'all' && item.status !== f.status) return false;
            if (f.paymentStatus !== 'all' && item.paymentStatus !== f.paymentStatus) return false;
            if (f.fromDate && new Date(item.entryTime) < new Date(f.fromDate)) return false;
            if (f.toDate && new Date(item.entryTime) > new Date(`${f.toDate}T23:59:59`)) return false;
            return true;
        });
    },

    getParkingSummary() {
        const totalSlots = this.state.slots.length;
        const availableSlots = this.state.slots.filter(s => s.status === 'AVAILABLE').length;
        const occupiedSlots = this.state.slots.filter(s => s.status === 'OCCUPIED').length;
        const reservedSlots = this.state.slots.filter(s => s.status === 'RESERVED').length;
        return { totalSlots, availableSlots, occupiedSlots, reservedSlots, occupancyRate: totalSlots ? ((occupiedSlots + reservedSlots) / totalSlots) * 100 : 0 };
    },

    getSlotLocation(slot) {
        const zone = this.state.zones.find(z => z.zoneId === slot.zoneId) || {};
        const floor = this.state.floors.find(f => f.floorId === zone.floorId) || {};
        const building = this.state.buildings.find(b => b.buildingId === floor.buildingId) || {};
        return {
            zoneId: zone.zoneId,
            zoneName: zone.zoneName || '-',
            floorId: floor.floorId,
            floorName: floor.floorName || '-',
            buildingId: building.buildingId,
            buildingName: building.buildingName || '-'
        };
    },

    slotLocationText(slot) {
        const loc = this.getSlotLocation(slot);
        return `${loc.zoneName}, ${loc.floorName}, ${loc.buildingName}`;
    },

    findVehicle(vehicleId) {
        return this.state.vehicles.find(v => v.vehicleId === vehicleId);
    },

    calculateDuration(startValue, endValue = new Date().toISOString()) {
        const diffMs = Math.max(new Date(endValue) - new Date(startValue), 0);
        const totalMinutes = Math.max(Math.round(diffMs / 60000), 1);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours} giờ ${minutes} phút`;
    },

    estimateReservationFee(vehicle) {
        const policy = this.state.pricingPolicies.find(p => p.vehicleTypeId === vehicle?.vehicleTypeId) || this.state.pricingPolicies[0];
        return policy.normalPrice;
    },

    estimateSessionFee(session) {
        const vehicle = this.findVehicle(session.vehicleId);
        const policy = this.state.pricingPolicies.find(p => p.vehicleTypeId === vehicle?.vehicleTypeId) || this.state.pricingPolicies[0];
        const hours = Math.max(Math.ceil((Date.now() - new Date(session.entryTime).getTime()) / 3600000), 1);
        return Math.min(hours * policy.normalPrice, policy.dailyCap);
    },

    incidentRelatedOptions() {
        const sessions = this.state.sessions.map(s => `Phiên #${s.sessionId} - ${s.licensePlate}`);
        const reservations = this.state.reservations.map(r => `Đặt chỗ #${r.reservationId} - ${r.licensePlate}`);
        return ['Không có', ...sessions, ...reservations];
    },

    receiptRows(item) {
        return `
            ${this.infoRow('Số biên lai', item.receiptNumber)}
            ${this.infoRow('Biển số xe', item.licensePlate)}
            ${this.infoRow('Vị trí gửi xe', `${item.slotCode} - ${item.zoneName}, ${item.floorName}, ${item.buildingName}`)}
            ${this.infoRow('Giờ vào', this.formatDateTime(item.entryTime))}
            ${this.infoRow('Giờ ra', this.formatDateTime(item.exitTime))}
            ${this.infoRow('Thời lượng', item.duration)}
            ${this.infoRow('Tổng phí', this.money(item.totalFee))}
            ${this.infoRow('Phương thức thanh toán', item.paymentMethod || '-')}
            ${this.infoRow('Trạng thái thanh toán', item.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán')}
            ${this.infoRow('Mã giao dịch', item.transactionId || '-')}
        `;
    },

    statCard(color, icon, value, label) {
        return `<div class="stat-card stat-${color}"><div class="stat-icon">${icon}</div><div class="stat-info"><div class="stat-value">${this.escape(String(value))}</div><div class="stat-label">${this.escape(label)}</div></div></div>`;
    },

    featureButton(page, icon, label) {
        return `<button class="feature-card" onclick="App.navigate('${page}')"><div class="feature-card-icon">${icon}</div><span>${this.escape(label)}</span></button>`;
    },

    infoRow(label, value) {
        return `<div class="list-item"><div class="list-info"><h4>${this.escape(label)}</h4><p>${this.escape(String(value ?? ''))}</p></div></div>`;
    },

    emptyState(icon, message) {
        return `<div class="empty-state">${icon}<p>${this.escape(message)}</p></div>`;
    },

    openConfirm(title, message, onConfirm) {
        this.openModal(`
            <div class="modal-header"><h3>${this.escape(title)}</h3><button class="modal-close" onclick="Pages.closeModal()">${iconClose()}</button></div>
            <div class="modal-body"><p>${this.escape(message)}</p></div>
            <div class="modal-footer"><button class="btn btn-outline" onclick="Pages.closeModal()">Hủy</button><button class="btn btn-primary" id="confirm-action-btn">Xác nhận</button></div>
        `);
        document.getElementById('confirm-action-btn').onclick = () => {
            this.closeModal();
            onConfirm();
        };
    },

    openModal(content) {
        this.closeModal();
        const modal = document.createElement('div');
        modal.id = 'page-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal-content">${content}</div>`;
        document.body.appendChild(modal);
    },

    closeModal() {
        const modal = document.getElementById('page-modal');
        if (modal) modal.remove();
    },

    formatDateTime(value) {
        return new Date(value).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
    },

    money(value) {
        return Number(value || 0).toLocaleString('vi-VN') + ' đ';
    },

    escape(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
    },

    escapeAttr(value) {
        return this.escape(value);
    }
};

function nextIso(hours) {
    return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function localDateTimeValue(date) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function iconSvg(path) {
    return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${path}</svg>`;
}

function iconCar() { return iconSvg('<path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>'); }
function iconCalendar() { return iconSvg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'); }
function iconMapPin() { return iconSvg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>'); }
function iconClock() { return iconSvg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'); }
function iconWallet() { return iconSvg('<path d="M20 7H5a2 2 0 010-4h14v4z"/><path d="M5 7h16v14H5a2 2 0 01-2-2V5"/><path d="M16 14h2"/>'); }
function iconTag() { return iconSvg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1"/>'); }
function iconReceipt() { return iconSvg('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2H4z"/><path d="M8 7h8M8 11h8M8 15h5"/>'); }
function iconAlert() { return iconSvg('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'); }
function iconUser() { return iconSvg('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>'); }
function iconFilter() { return iconSvg('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'); }
function iconClose() { return iconSvg('<path d="M18 6L6 18M6 6l12 12"/>'); }
