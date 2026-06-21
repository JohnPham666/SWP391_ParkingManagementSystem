/* ===== Driver Pages - API Integrated ===== */
const Pages = {
    state: {
        parkingFilters: { buildingName: 'all', floorName: 'all', zoneName: 'all', vehicleTypeName: 'all', status: 'all', startTime: '', endTime: '' },
        historyFilters: { vehicleId: 'all', status: 'all', paymentStatus: 'all', fromDate: '', toDate: '' },
        pricingFilter: 'all',
        vehicles: [],
        vehicleTypes: [],
        slots: [],
        reservations: [],
        incidents: [],
        pendingReservationSlotId: null
    },

    async home(container) {
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        const [slotsRes, vehiclesRes, resRes] = await Promise.all([
            Api.getAvailableSlots(), // Note: Driver can get available slots or all slots? We use getAvailableSlots for now, wait getAvailableSlots returns only AVAILABLE. Let's use request('/api/slots')
            Api.getMyVehicles(),
            Api.getReservations()
        ]);

        const slots = await Api.request('/api/slots').then(res => res.data || []);
        const vehicles = vehiclesRes.success ? (vehiclesRes.data || []) : [];
        const reservations = resRes.success ? (resRes.data || []) : [];

        const totalSlots = slots.length;
        const availableSlots = slots.filter(s => s.status === 'AVAILABLE').length;
        const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
        const reservedSlots = slots.filter(s => s.status === 'RESERVED').length;
        const occupancyRate = totalSlots ? ((occupiedSlots + reservedSlots) / totalSlots) * 100 : 0;

        const activeReservations = reservations.filter(r => ['PENDING', 'CONFIRMED'].includes(r.status));
        const upcomingReservation = activeReservations[0];

        let activeSession = null;
        for(let v of vehicles) {
            const sRes = await Api.getActiveSession(v.licensePlate);
            if(sRes.success && sRes.data) {
                activeSession = sRes.data;
                break;
            }
        }

        container.innerHTML = `
            <section class="dashboard-hero-card">
                <div>
                    <span class="landing-kicker">Driver Dashboard</span>
                    <h2>Xin chào, ${this.escape(App.state.user?.fullName || 'Tài xế')}</h2>
                    <p>Theo dõi chỗ trống, đặt chỗ, phiên gửi xe và thanh toán trong một giao diện duy nhất.</p>
                </div>
                <div class="dashboard-hero-actions">
                    <button class="btn btn-primary" onclick="App.navigate('parking')">Tìm chỗ ngay</button>
                    <button class="btn btn-outline" onclick="App.navigate('reservations')">Tạo đặt chỗ</button>
                </div>
            </section>
            <div class="stats-grid">
                ${this.statCard('orange', iconCar(), vehicles.length, 'Xe của tôi')}
                ${this.statCard('blue', iconCalendar(), activeReservations.length, 'Đặt chỗ sắp tới')}
                ${this.statCard('green', iconClock(), activeSession ? 1 : 0, 'Phiên đang hoạt động')}
                ${this.statCard('red', iconMapPin(), availableSlots, 'Chỗ trống')}
            </div>
            <div class="dashboard-info-grid">
                <div class="card dashboard-mini-card">
                    <div class="card-header"><span class="card-title">${iconClock()} Phiên hiện tại</span></div>
                    <div class="card-body">${activeSession ? `${this.infoRow('Xe', activeSession.licensePlate)}${this.infoRow('Slot', activeSession.slotCode || 'Vãng lai')}` : this.emptyState(iconClock(), 'Chưa có phiên gửi xe đang hoạt động.')}</div>
                </div>
                <div class="card dashboard-mini-card">
                    <div class="card-header"><span class="card-title">${iconCalendar()} Đặt chỗ sắp tới</span></div>
                    <div class="card-body">${upcomingReservation ? `${this.infoRow('Xe', upcomingReservation.licensePlate)}${this.infoRow('Vị trí', upcomingReservation.slotCode ? upcomingReservation.slotCode + ', ' + upcomingReservation.floorName : 'Chưa xếp')}${this.infoRow('Thời gian', this.formatDateTime(upcomingReservation.reservationStart))}` : this.emptyState(iconCalendar(), 'Không có đặt chỗ sắp tới.')}</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconMapPin()} Tổng quan bãi xe</span><button class="btn btn-outline btn-sm" onclick="App.navigate('parking')">Tìm chỗ</button></div>
                <div class="card-body">
                    <div class="progress-ring" style="margin:auto">${Math.round(occupancyRate)}%</div>
                    <div class="stats-grid" style="margin-top:16px">
                        <div><strong>${totalSlots}</strong><br> Tổng slot</div>
                        <div><strong>${availableSlots}</strong><br> Trống</div>
                        <div><strong>${occupiedSlots}</strong><br> Đang đỗ</div>
                        <div><strong>${reservedSlots}</strong><br> Đã đặt</div>
                    </div>
                </div>
            </div>
            <div class="quick-actions">
                ${this.featureButton('parking', iconMapPin(), 'Tìm chỗ đỗ xe')}
                ${this.featureButton('reservations', iconCalendar(), 'Đặt chỗ')}
                ${this.featureButton('session', iconClock(), 'Phiên gửi xe')}
                ${this.featureButton('payment', iconWallet(), 'Thanh toán')}
                ${this.featureButton('pricing', iconTag(), 'Chính sách giá')}
                ${this.featureButton('history', iconReceipt(), 'Lịch sử')}
                ${this.featureButton('incident', iconAlert(), 'Báo cáo sự cố')}
                ${this.featureButton('account', iconUser(), 'Hồ sơ cá nhân')}
            </div>
        `;
    },

    async parking(container) {
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        const res = await Api.request('/api/slots');
        if(!res.success) {
             container.innerHTML = `<div class="page-header"><h2>Tìm chỗ đỗ xe</h2></div>` + this.emptyState(iconMapPin(), res.message);
             return;
        }
        
        const allSlots = res.data || [];
        this.state.slots = allSlots;
        
        const buildings = new Set();
        const floors = new Set();
        const zones = new Set();
        const vTypes = new Set();
        
        allSlots.forEach(s => {
            if(s.buildingName) buildings.add(s.buildingName);
            if(s.floorName) floors.add(s.floorName);
            if(s.zoneName) zones.add(s.zoneName);
            if(s.vehicleTypeName) vTypes.add(s.vehicleTypeName);
        });

        const f = this.state.parkingFilters;
        
        const filtered = allSlots.filter(s => {
            if (f.buildingName !== 'all' && s.buildingName !== f.buildingName) return false;
            if (f.floorName !== 'all' && s.floorName !== f.floorName) return false;
            if (f.zoneName !== 'all' && s.zoneName !== f.zoneName) return false;
            if (f.vehicleTypeName !== 'all' && s.vehicleTypeName !== f.vehicleTypeName) return false;
            if (f.status !== 'all' && s.status !== f.status) return false;
            return true;
        });

        container.innerHTML = `
            <div class="page-header"><h2>Tìm chỗ đỗ xe</h2><p>Kiểm tra tình trạng chỗ trống.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconFilter()} Bộ lọc</span><button class="btn btn-outline btn-sm" onclick="Pages.resetParkingFilters()">Đặt lại</button></div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-group"><label>Tòa nhà</label><select onchange="Pages.updateParkingFilter('buildingName', this.value)"><option value="all">Tất cả</option>${[...buildings].map(b => `<option value="${b}" ${b === f.buildingName ? 'selected' : ''}>${this.escape(b)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Tầng</label><select onchange="Pages.updateParkingFilter('floorName', this.value)"><option value="all">Tất cả</option>${[...floors].map(fl => `<option value="${fl}" ${fl === f.floorName ? 'selected' : ''}>${this.escape(fl)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Khu vực</label><select onchange="Pages.updateParkingFilter('zoneName', this.value)"><option value="all">Tất cả</option>${[...zones].map(z => `<option value="${z}" ${z === f.zoneName ? 'selected' : ''}>${this.escape(z)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Loại xe</label><select onchange="Pages.updateParkingFilter('vehicleTypeName', this.value)"><option value="all">Tất cả</option>${[...vTypes].map(t => `<option value="${t}" ${t === f.vehicleTypeName ? 'selected' : ''}>${this.escape(t)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Trạng thái</label><select onchange="Pages.updateParkingFilter('status', this.value)"><option value="all">Tất cả</option><option value="AVAILABLE" ${f.status === 'AVAILABLE' ? 'selected' : ''}>Trống</option><option value="OCCUPIED" ${f.status === 'OCCUPIED' ? 'selected' : ''}>Đang sử dụng</option><option value="RESERVED" ${f.status === 'RESERVED' ? 'selected' : ''}>Đã đặt</option><option value="LOCKED" ${f.status === 'LOCKED' ? 'selected' : ''}>Khóa</option></select></div>
                    </div>
                </div>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">${iconMapPin()} Danh sách slot (${filtered.length})</span></div><div class="card-body">${this.renderSlotGroups(filtered)}</div></div>
        `;
    },

    async reservations(container) {
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        const [rRes, vRes, sRes] = await Promise.all([
            Api.getReservations(),
            Api.getMyVehicles(),
            Api.getAvailableSlots()
        ]);
        
        if(!rRes.success) {
            container.innerHTML = `<div class="page-header"><h2>Đặt chỗ</h2></div>` + this.emptyState(iconCalendar(), rRes.message);
            return;
        }
        
        this.state.reservations = rRes.data || [];
        this.state.vehicles = vRes.success ? (vRes.data || []) : [];
        const availableSlots = sRes.success ? (sRes.data || []) : [];
        
        container.innerHTML = `
            <div class="page-header"><h2>Đặt chỗ</h2><p>Tạo yêu cầu đặt chỗ và theo dõi trạng thái.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconCalendar()} Tạo đặt chỗ mới</span></div>
                <form class="card-body" onsubmit="Pages.createReservationSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Xe</label><select id="reservation-vehicle" required>${this.state.vehicles.map(v => `<option value="${v.vehicleId}">${this.escape(v.licensePlate)} - ${this.escape(v.vehicleTypeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Chọn slot</label><select id="reservation-slot"><option value="">Tự động xếp chỗ</option>${availableSlots.map(s => `<option value="${s.slotId}" ${this.state.pendingReservationSlotId === s.slotId ? 'selected' : ''}>${this.escape(s.slotCode)} - ${this.escape(s.zoneName)}, ${this.escape(s.floorName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Giờ bắt đầu</label><input id="reservation-start" type="datetime-local" value="${localDateTimeValue(new Date(Date.now() + 3600000))}" required></div>
                        <div class="form-group"><label>Giờ kết thúc</label><input id="reservation-end" type="datetime-local" value="${localDateTimeValue(new Date(Date.now() + 10800000))}" required></div>
                    </div>
                    <button class="btn btn-primary btn-full" type="submit">Xác nhận đặt chỗ</button>
                </form>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Danh sách đặt chỗ</span></div><div class="card-body">${this.state.reservations.map(r => this.renderReservation(r)).join('') || this.emptyState(iconCalendar(), 'Không có dữ liệu đặt chỗ.')}</div></div>
        `;
        
        // Reset pending slot after render
        this.state.pendingReservationSlotId = null;
    },

    async createReservationSubmit(event) {
        event.preventDefault();
        const data = {
            vehicleId: Number(document.getElementById('reservation-vehicle').value),
            reservationStart: new Date(document.getElementById('reservation-start').value).toISOString(),
            reservationEnd: new Date(document.getElementById('reservation-end').value).toISOString()
        };
        const slotId = document.getElementById('reservation-slot').value;
        if(slotId) data.slotId = Number(slotId);

        const res = await Api.createReservation(data);
        if(res.success) {
            App.showToast('Tạo đặt chỗ thành công.', 'success');
            App.navigate('reservations');
        } else {
            App.showToast(res.message, 'error');
        }
    },

    async cancelReservationSubmit(id) {
        if(!confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return;
        const res = await Api.cancelReservation(id);
        if(res.success) {
            App.showToast('Đã hủy đặt chỗ.', 'success');
            App.navigate('reservations');
        } else {
            App.showToast(res.message, 'error');
        }
    },

    async vehicles(container) {
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        const [vRes, tRes] = await Promise.all([
            Api.getMyVehicles(),
            Api.getVehicleTypes()
        ]);
        
        if(!vRes.success) {
            container.innerHTML = `<div class="page-header"><h2>Quản lý xe</h2></div>` + this.emptyState(iconCar(), vRes.message);
            return;
        }
        
        this.state.vehicles = vRes.data || [];
        this.state.vehicleTypes = tRes.success ? (tRes.data || []) : [];
        
        container.innerHTML = `
            <div class="page-header"><h2>Quản lý xe</h2><p>Thêm, sửa, xóa phương tiện của bạn.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconCar()} Xe của tôi</span><button class="btn btn-primary btn-sm" onclick="Pages.showVehicleModal()">Thêm xe</button></div>
                <div class="card-body">${this.state.vehicles.length ? this.state.vehicles.map(v => this.renderVehicle(v)).join('') : this.emptyState(iconCar(), 'Chưa có phương tiện nào.')}</div>
            </div>
        `;
    },

    showVehicleModal(vehicleId = null) {
        const vehicle = vehicleId ? this.state.vehicles.find(v => v.vehicleId === vehicleId) : null;
        this.openModal(`
            <form onsubmit="Pages.saveVehicle(event, ${vehicleId || 'null'})">
                <div class="modal-header"><h3>${vehicle ? 'Sửa xe' : 'Thêm xe'}</h3><button class="modal-close" type="button" onclick="Pages.closeModal()">${iconClose()}</button></div>
                <div class="modal-body">
                    <div id="vehicle-error" class="alert alert-error" style="display:none; color: var(--red, red); margin-bottom: 10px; padding: 10px; border-radius: 4px; background: rgba(255,0,0,0.1);"></div>
                    <div class="form-grid">
                        <div class="form-group"><label>Biển số xe *</label><input id="vehicle-plate" value="${this.escapeAttr(vehicle?.licensePlate || '')}" placeholder="Vui lòng nhập biển số xe"></div>
                        <div class="form-group"><label>Loại xe *</label><select id="vehicle-type"><option value="">Vui lòng chọn loại xe</option>${this.state.vehicleTypes.map(t => `<option value="${t.vehicleTypeId}" ${vehicle?.vehicleTypeId === t.vehicleTypeId ? 'selected' : ''}>${this.escape(t.typeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Tên chủ xe *</label><input id="vehicle-ownerName" value="${this.escapeAttr(vehicle?.ownerName || '')}" placeholder="Vui lòng nhập tên chủ xe"></div>
                        <div class="form-group"><label>Số điện thoại chủ xe *</label><input id="vehicle-ownerPhone" value="${this.escapeAttr(vehicle?.ownerPhone || '')}" placeholder="Vui lòng nhập số điện thoại chủ xe"></div>
                        <div class="form-group"><label>Hãng xe *</label><input id="vehicle-brand" value="${this.escapeAttr(vehicle?.brand || '')}" placeholder="Vui lòng nhập hãng xe"></div>
                        <div class="form-group"><label>Màu xe *</label><input id="vehicle-color" value="${this.escapeAttr(vehicle?.vehicleColor || '')}" placeholder="Vui lòng nhập màu xe"></div>
                        <div class="form-group"><label>Số máy *</label><input id="vehicle-engine" value="${this.escapeAttr(vehicle?.engineNumber || '')}" placeholder="Vui lòng nhập số máy"></div>
                        <div class="form-group"><label>Số khung *</label><input id="vehicle-chassis" value="${this.escapeAttr(vehicle?.chassisNumber || '')}" placeholder="Vui lòng nhập số khung"></div>
                        <div class="form-group"><label>Năm sản xuất *</label><input id="vehicle-year" type="number" value="${vehicle?.manufactureYear || new Date().getFullYear()}" placeholder="Vui lòng nhập năm sản xuất"></div>
                    </div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="Pages.closeModal()">Hủy</button><button class="btn btn-primary" type="submit">Lưu</button></div>
            </form>
        `);
    },

    async saveVehicle(event, vehicleId) {
        event.preventDefault();
        
        const errorEl = document.getElementById('vehicle-error');
        if (errorEl) {
            errorEl.style.display = 'none';
            errorEl.innerText = '';
        }

        const showError = (msg) => {
            if (errorEl) {
                errorEl.innerText = msg;
                errorEl.style.display = 'block';
            } else {
                App.showToast(msg, 'error');
            }
        };

        const licensePlate = document.getElementById('vehicle-plate').value.trim().toUpperCase();
        const vehicleTypeIdVal = document.getElementById('vehicle-type').value;
        const ownerName = document.getElementById('vehicle-ownerName').value.trim();
        const ownerPhone = document.getElementById('vehicle-ownerPhone').value.trim();
        const brand = document.getElementById('vehicle-brand').value.trim();
        const vehicleColor = document.getElementById('vehicle-color').value.trim();
        const engineNumber = document.getElementById('vehicle-engine').value.trim();
        const chassisNumber = document.getElementById('vehicle-chassis').value.trim();
        const manufactureYearVal = document.getElementById('vehicle-year').value;

        if (!licensePlate) return showError('Vui lòng nhập biển số xe.');
        if (!vehicleTypeIdVal) return showError('Vui lòng chọn loại xe.');
        if (!ownerName) return showError('Vui lòng nhập tên chủ xe.');
        if (!ownerPhone) return showError('Vui lòng nhập số điện thoại chủ xe.');
        
        const phoneRegex = /^[0-9]{9,15}$/;
        if (!phoneRegex.test(ownerPhone)) return showError('Số điện thoại chủ xe không hợp lệ.');
        
        if (!brand) return showError('Vui lòng nhập hãng xe.');
        if (!vehicleColor) return showError('Vui lòng nhập màu xe.');
        if (!engineNumber) return showError('Vui lòng nhập số máy.');
        if (!chassisNumber) return showError('Vui lòng nhập số khung.');
        if (!manufactureYearVal) return showError('Vui lòng nhập năm sản xuất.');

        const manufactureYear = Number(manufactureYearVal);
        const currentYear = new Date().getFullYear();
        if (isNaN(manufactureYear) || manufactureYear < 1900 || manufactureYear > currentYear) {
            return showError('Năm sản xuất không hợp lệ.');
        }

        const data = {
            licensePlate,
            vehicleTypeId: Number(vehicleTypeIdVal),
            ownerName,
            ownerPhone,
            brand,
            vehicleColor,
            engineNumber,
            chassisNumber,
            manufactureYear
        };
        
        const res = vehicleId ? await Api.updateMyVehicle(vehicleId, data) : await Api.createMyVehicle(data);
        if(res.success) {
            App.showToast(vehicleId ? 'Đã cập nhật xe.' : 'Đã thêm xe.', 'success');
            this.closeModal();
            App.navigate('vehicles');
        } else {
            showError(res.message);
        }
    },

    async deleteVehicleSubmit(vehicleId) {
        if(!confirm('Bạn có chắc muốn xóa xe này?')) return;
        const res = await Api.deleteMyVehicle(vehicleId);
        if(res.success) {
            App.showToast('Đã xóa xe.', 'success');
            App.navigate('vehicles');
        } else {
            App.showToast(res.message, 'error');
        }
    },

    async account(container) {
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        const res = await Api.getCurrentUser();
        
        if (!res.success) {
            container.innerHTML = `
                <div class="page-header"><h2>Hồ sơ cá nhân</h2></div>
                ${this.emptyState(iconUser(), res.message || 'Không thể tải thông tin người dùng.')}
            `;
            return;
        }

        const u = res.data;
        container.innerHTML = `
            <div class="page-header"><h2>Hồ sơ cá nhân</h2><p>Thông tin tài khoản từ hệ thống.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconUser()} Thông tin cơ bản</span></div>
                <div class="card-body">
                    ${this.infoRow('Mã người dùng', u.userId || '-')}
                    ${this.infoRow('Họ tên', u.fullName || '-')}
                    ${this.infoRow('Email', u.email || '-')}
                    ${this.infoRow('Vai trò', u.roleName || u.role || 'Driver')}
                    ${this.infoRow('Trạng thái tài khoản', u.status || '-')}
                    
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 12px;">Chức năng chỉnh sửa hồ sơ hiện chưa có API dành cho Driver.</p>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="btn btn-outline" disabled style="opacity: 0.5; cursor: not-allowed;" title="Tính năng chưa hỗ trợ">Chỉnh sửa thông tin</button>
                            <button class="btn btn-outline" disabled style="opacity: 0.5; cursor: not-allowed;" title="Tính năng chưa hỗ trợ">Đổi mật khẩu</button>
                        </div>
                    </div>

                    <div class="button-row" style="margin-top:20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-outline" style="color:var(--red);border-color:var(--red)" onclick="App.logout()">Đăng xuất</button>
                    </div>
                </div>
            </div>
        `;
    },

    async session(container) {
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        const resVehicles = await Api.getMyVehicles();
        const vehicles = resVehicles.success ? (resVehicles.data || []) : [];
        
        let activeSession = null;
        for(let v of vehicles) {
            const sessionRes = await Api.getActiveSession(v.licensePlate);
            if(sessionRes.success && sessionRes.data) {
                activeSession = sessionRes.data;
                break;
            }
        }

        container.innerHTML = `
            <div class="page-header"><h2>Phiên gửi xe</h2><p>Chỉ xem phiên gửi xe đang hoạt động. Check-in / Check-out do nhân viên thực hiện.</p></div>
            ${activeSession ? this.renderActiveSession(activeSession) : this.emptyState(iconClock(), 'Không có phiên gửi xe nào đang hoạt động.')}
        `;
    },

    async payment(container) {
        container.innerHTML = `
            <div class="page-header"><h2>Thanh toán</h2><p>Danh sách thanh toán.</p></div>
            <div class="card">
                <div class="card-body">
                    <p style="text-align:center;">Để thanh toán, vui lòng xem trong chi tiết <strong>Đặt chỗ</strong> hoặc yêu cầu nhân viên thanh toán khi <strong>Check-out</strong>. Backend chưa hỗ trợ API lấy danh sách thanh toán theo Driver.</p>
                </div>
            </div>
        `;
    },

    async createVnPayUrl(paymentId) {
        const res = await Api.createVnPayUrl(paymentId);
        if(res.success && res.data && res.data.paymentUrl) {
            window.location.href = res.data.paymentUrl;
        } else {
            App.showToast(res.message || 'Không thể tạo link thanh toán VNPay', 'error');
        }
    },

    async pricing(container) {
        container.innerHTML = `
            <div class="page-header"><h2>Chính sách giá</h2><p>Bảng giá hiện chưa có API dành cho Driver (Yêu cầu quyền Admin/Manager).</p></div>
            <div class="empty-state">${iconTag()}<p>Bảng giá hiện chưa có API dành cho Driver.</p></div>
        `;
    },

    async history(container) {
        container.innerHTML = `
            <div class="page-header"><h2>Lịch sử gửi xe</h2><p>Lịch sử gửi xe.</p></div>
            <div class="empty-state">${iconReceipt()}<p>Chưa có API Lịch sử gửi xe cho Driver. Vui lòng xem ở Đặt chỗ.</p></div>
        `;
    },

    async incident(container) {
        container.innerHTML = `<div class="loading-spinner"><div class="spinner"></div></div>`;
        const res = await Api.getIncidents();
        
        if(!res.success) {
            container.innerHTML = `<div class="page-header"><h2>Báo cáo sự cố</h2></div>` + this.emptyState(iconAlert(), res.message);
            return;
        }
        
        this.state.incidents = res.data || [];
        
        container.innerHTML = `
            <div class="page-header"><h2>Báo cáo sự cố</h2><p>Gửi báo cáo sự cố trong bãi xe.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${iconAlert()} Tạo báo cáo</span></div>
                <form class="card-body" onsubmit="Pages.submitIncident(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Loại sự cố *</label><select id="incident-type" required><option value="">Chọn loại sự cố</option><option>Chỗ đỗ hư hỏng</option><option>Xe bị chắn lối</option><option>Vấn đề thanh toán</option><option>Mất vé</option><option>Điều kiện không an toàn</option><option>Khác</option></select></div>
                        <div class="form-group full-width"><label>Mô tả chi tiết *</label><textarea id="incident-description" rows="4" placeholder="Mô tả ngắn gọn sự cố" required></textarea></div>
                    </div>
                    <button class="btn btn-primary btn-full" type="submit" style="margin-top:10px;">Gửi báo cáo</button>
                </form>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Sự cố đã gửi</span></div><div class="card-body">${this.state.incidents.length ? this.state.incidents.map(i => this.renderIncident(i)).join('') : this.emptyState(iconAlert(), 'Chưa có báo cáo sự cố.')}</div></div>
        `;
    },

    async submitIncident(event) {
        event.preventDefault();
        const data = {
            incidentType: document.getElementById('incident-type').value,
            description: document.getElementById('incident-description').value.trim()
        };
        const res = await Api.createIncident(data);
        if(res.success) {
            App.showToast('Gửi báo cáo thành công', 'success');
            App.navigate('incident');
        } else {
            App.showToast(res.message, 'error');
        }
    },

    updateParkingFilter(key, value) {
        this.state.parkingFilters[key] = value;
        App.navigate('parking');
    },

    resetParkingFilters() {
        this.state.parkingFilters = { buildingName: 'all', floorName: 'all', zoneName: 'all', vehicleTypeName: 'all', status: 'all', startTime: '', endTime: '' };
        App.navigate('parking');
    },

    renderSlotGroups(slots) {
        if (!slots.length) return this.emptyState(iconMapPin(), 'Không có slot phù hợp với bộ lọc.');
        const buildings = [...new Set(slots.map(s => s.buildingName || 'Khu vực chung'))];
        return buildings.map(bName => {
            const bSlots = slots.filter(s => (s.buildingName || 'Khu vực chung') === bName);
            if (!bSlots.length) return '';
            return `
                <div class="zone-group">
                    <h3>${this.escape(bName)}</h3>
                    <div class="slot-grid">${bSlots.map(slot => this.renderSlot(slot)).join('')}</div>
                </div>
            `;
        }).join('');
    },

    renderSlot(slot) {
        const cls = slot.status ? slot.status.toLowerCase() : 'unknown';
        const occupancy = `${slot.currentOccupancy || 0}/${slot.capacity || 1}`;
        return `
            <div class="slot-tile ${cls}" onclick="Pages.showSlotDetail(${slot.slotId})" style="cursor: pointer;">
                <strong>${this.escape(slot.slotCode)}</strong>
                ${this.statusBadge(slot.status)}
                <small>${this.escape(slot.zoneName || '-')}, ${this.escape(slot.floorName || '-')}</small>
                <small>${this.escape(slot.vehicleTypeName || '-')} - ${occupancy}</small>
            </div>
        `;
    },

    showSlotDetail(slotId) {
        const slot = this.state.slots.find(s => s.slotId === slotId);
        if (!slot) return;
        
        let actionArea = '';
        if (slot.status === 'AVAILABLE') {
            actionArea = `<button type="button" class="btn btn-primary btn-full" style="margin-bottom: 12px;" onclick="Pages.reserveSlot(${slot.slotId})">Đặt chỗ slot này</button>`;
        } else {
            actionArea = `<div class="alert alert-warning" style="margin-bottom: 12px; font-size: 0.85rem; text-align: center; color: var(--yellow, #f59e0b); background: var(--yellow-bg, #fffbeb); padding: 10px; border-radius: 6px;">Slot này hiện không thể đặt chỗ.</div>`;
        }

        this.openModal(`
            <div class="modal-header">
                <h3>Chi tiết Slot</h3>
                <button class="modal-close" type="button" onclick="Pages.closeModal()">${iconClose()}</button>
            </div>
            <div class="modal-body slot-detail-modal-body">
                <div class="card" style="box-shadow: none; border: 1px solid var(--border-color); margin: 0;">
                    <div class="card-body">
                        ${this.infoRow('Mã slot', slot.slotCode)}
                        <div class="list-item">
                            <div class="list-info"><h4>Trạng thái</h4></div>
                            <div>${this.statusBadge(slot.status)}</div>
                        </div>
                        ${this.infoRow('Tòa nhà', slot.buildingName || '-')}
                        ${this.infoRow('Tầng', slot.floorName || '-')}
                        ${this.infoRow('Khu vực', slot.zoneName || '-')}
                        ${this.infoRow('Loại xe', slot.vehicleTypeName || '-')}
                        ${this.infoRow('Diện tích', slot.area ? slot.area + ' m²' : '-')}
                        ${this.infoRow('Sức chứa', slot.capacity || 0)}
                        ${this.infoRow('Đang sử dụng', slot.currentOccupancy || 0)}
                        ${this.infoRow('Hoạt động', slot.isActive === false ? 'Không' : 'Có')}
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="flex-direction: column;">
                ${actionArea}
                <button type="button" class="btn btn-outline btn-full" onclick="Pages.closeModal()">Đóng</button>
            </div>
        `);
    },

    reserveSlot(slotId) {
        this.closeModal();
        this.state.pendingReservationSlotId = slotId;
        App.navigate('reservations');
    },

    renderVehicle(v) {
        return `
            <div class="vehicle-card clickable-card" onclick="Pages.showVehicleDetail(${v.vehicleId})">
                <div class="vehicle-icon">${iconCar()}</div>
                <div class="vehicle-info">
                    <h3>${this.escape(v.licensePlate)}</h3>
                    <div class="vehicle-meta">${this.escape(v.vehicleTypeName)} - ${this.escape(v.brand || 'Chưa rõ hãng')} - ${this.escape(v.vehicleColor || 'Chưa rõ màu')}</div>
                    <div class="button-row">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); Pages.showVehicleModal(${v.vehicleId})">Sửa</button>
                        <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="event.stopPropagation(); Pages.deleteVehicleSubmit(${v.vehicleId})">Xóa</button>
                    </div>
                </div>
            </div>
        `;
    },

    showVehicleDetail(vehicleId) {
        const v = this.state.vehicles.find(x => x.vehicleId === vehicleId);
        if(!v) return;
        
        let imgHtml = '';
        if (v.vehicleImage) {
            imgHtml = `<div class="list-item"><div class="list-info"><h4>Hình ảnh xe</h4><div style="margin-top: 8px;"><img src="${this.escapeAttr(v.vehicleImage)}" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color);" alt="Hình ảnh xe"></div></div></div>`;
        } else {
            imgHtml = this.infoRow('Hình ảnh xe', 'Chưa có thông tin');
        }

        this.openModal(`
            <div class="modal-header">
                <h3>Chi tiết xe</h3>
                <button class="modal-close" type="button" onclick="Pages.closeModal()">${iconClose()}</button>
            </div>
            <div class="modal-body">
                <div class="card" style="box-shadow: none; border: 1px solid var(--border-color); margin: 0;">
                    <div class="card-body">
                        ${this.infoRow('Mã xe', v.vehicleId || 'Chưa có thông tin')}
                        ${this.infoRow('Biển số xe', v.licensePlate || 'Chưa có thông tin')}
                        ${this.infoRow('Loại xe', v.vehicleTypeName || 'Chưa có thông tin')}
                        ${this.infoRow('Tên chủ xe', v.ownerName || 'Chưa có thông tin')}
                        ${this.infoRow('Số điện thoại chủ xe', v.ownerPhone || 'Chưa có thông tin')}
                        ${this.infoRow('Hãng xe', v.brand || 'Chưa có thông tin')}
                        ${this.infoRow('Màu xe', v.vehicleColor || 'Chưa có thông tin')}
                        ${this.infoRow('Số máy', v.engineNumber || 'Chưa có thông tin')}
                        ${this.infoRow('Số khung', v.chassisNumber || 'Chưa có thông tin')}
                        ${this.infoRow('Năm sản xuất', v.manufactureYear || 'Chưa có thông tin')}
                        ${imgHtml}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline btn-full" onclick="Pages.closeModal()">Đóng</button>
            </div>
        `);
    },

    renderReservation(r) {
        const statusBadge = this.statusBadge(r.status);
        const paymentBadge = r.paymentStatus === 'PAID'
            ? `<span class="badge badge-green">${this.escape(r.paymentMethod || 'Đã thanh toán')}</span>`
            : '<span class="badge badge-yellow">Chưa thanh toán</span>';
        
        let actions = '';
        if (['PENDING', 'DRAFT'].includes(r.status)) {
            // Note: driver can't pay directly if we don't have payment id, 
            // but we can add a fake prompt or fetch payment by reservation?
            // Actually, backend has createVnPayUrl by paymentId. 
            // Without /api/payments/reservation we can't easily get payment id. 
            actions += `<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="Pages.cancelReservationSubmit(${r.reservationId})">Hủy</button>`;
        } else if(r.status === 'CONFIRMED') {
            actions += `<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="Pages.cancelReservationSubmit(${r.reservationId})">Hủy</button>`;
        }
        
        return `
            <div class="list-item">
                <div class="list-info">
                    <h4>${this.escape(r.licensePlate)} - ${this.escape(r.slotCode || 'Tự xếp chỗ')}</h4>
                    <p>${this.escape(r.zoneName || '-')}, ${this.escape(r.floorName || '-')}, ${this.escape(r.buildingName || '-')}</p>
                    <p>Từ ${this.formatDateTime(r.reservationStart)} đến ${this.formatDateTime(r.reservationEnd)}</p>
                    <p>Phí dự kiến: <strong>${this.money(r.amount || r.estimatedFee)}</strong></p>
                </div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${statusBadge}${paymentBadge}</div>
                <div class="button-row" style="margin-top:10px;">${actions}</div>
            </div>
        `;
    },

    renderActiveSession(session) {
        return `
            <div class="card">
                <div class="card-header"><span class="card-title">${iconClock()} Phiên đang hoạt động</span><span class="badge badge-green">Đang đỗ</span></div>
                <div class="card-body">
                    <div class="stats-grid">
                        ${this.statCard('orange', iconCar(), session.licensePlate, 'Biển số')}
                        ${this.statCard('blue', iconMapPin(), session.slotCode, 'Mã slot')}
                    </div>
                    ${this.infoRow('Vị trí', `${session.zoneName || '-'}, ${session.floorName || '-'}, ${session.buildingName || '-'}`)}
                    ${this.infoRow('Giờ vào', this.formatDateTime(session.entryTime))}
                    ${this.infoRow('Trạng thái', this.statusText(session.status))}
                </div>
            </div>
        `;
    },

    renderIncident(item) {
        return `
            <div class="list-item">
                <div class="list-info">
                    <h4>ID: ${item.incidentId} - ${this.escape(item.incidentType || item.type)}</h4>
                    <p>${this.escape(item.description)}</p>
                    <p style="font-size:.75rem;color:var(--text-muted);margin-top:8px">${this.formatDateTime(item.createdAt)} - Báo cáo bởi: ${this.escape(item.reportedByName || '-')}</p>
                </div>
                <span class="badge badge-yellow">${this.escape(item.status)}</span>
            </div>
        `;
    },

    statusText(status) {
        return {
            AVAILABLE: 'Trống', RESERVED: 'Đã đặt', OCCUPIED: 'Đang sử dụng', LOCKED: 'Khóa',
            ACTIVE: 'Đang hoạt động', COMPLETED: 'Hoàn tất', PENDING: 'Chờ thanh toán',
            CONFIRMED: 'Đã xác nhận', CANCELLED: 'Đã hủy', PAID: 'Đã thanh toán', UNPAID: 'Chưa thanh toán'
        }[status] || status;
    },

    statusBadge(status) {
        const cls = {
            AVAILABLE: 'badge-green', RESERVED: 'badge-yellow', OCCUPIED: 'badge-red',
            LOCKED: 'badge-gray', PAID: 'badge-green', UNPAID: 'badge-yellow',
            CONFIRMED: 'badge-green', PENDING: 'badge-yellow', CANCELLED: 'badge-gray'
        }[status] || 'badge-gray';
        return `<span class="badge ${cls}">${this.escape(this.statusText(status))}</span>`;
    },

    statCard(color, icon, value, label) {
        return `<div class="stat-card stat-${color}"><div class="stat-icon">${icon}</div><div class="stat-info"><div class="stat-value">${this.escape(String(value))}</div><div class="stat-label">${this.escape(label)}</div></div></div>`;
    },

    featureButton(page, icon, label) {
        return `<button class="feature-card" onclick="App.navigate('${page}')"><div class="feature-card-icon">${icon}</div><span>${this.escape(label)}</span></button>`;
    },

    infoRow(label, value) {
        return `<div class="list-item"><div class="list-info"><h4>${this.escape(label)}</h4><p>${this.escape(String(value ?? '-'))}</p></div></div>`;
    },

    emptyState(icon, message) {
        return `<div class="empty-state">${icon}<p>${this.escape(message)}</p></div>`;
    },

    openModal(content) {
        this.closeModal();
        const modal = document.createElement('div');
        modal.id = 'page-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal-content">${content}</div>`;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    },

    closeModal() {
        const modal = document.getElementById('page-modal');
        if (modal) {
            modal.remove();
            document.body.style.overflow = '';
        }
    },

    formatDateTime(value) {
        if(!value) return '-';
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

function localDateTimeValue(date) {
    const offset = date.getTimezoneOffset();
    return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function iconSvg(path) { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${path}</svg>`; }
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

window.Pages = Pages;
