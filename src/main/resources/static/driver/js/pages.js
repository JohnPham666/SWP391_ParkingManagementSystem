/* ===== Driver Pages - API Integrated ===== */
// ===============================
// Quản lý trạng thái và giao diện chính
// ===============================
// Pages đóng vai trò là controller chính của ứng dụng Driver, 
// gọi API, quản lý render và xử lý sự kiện người dùng.

const Pages = {
    // Không còn state nội bộ, sử dụng DriverState thay thế

    // ===============================
    // Helper hiển thị và xử lý nội bộ
    // ===============================
    resolveReservationLocation(r, slots) {
        if (r.buildingName && r.floorName && r.zoneName) {
            return `${DriverUtils.escapeHtml(r.buildingName)} - ${DriverUtils.escapeHtml(r.floorName)} - ${DriverUtils.escapeHtml(r.zoneName)}`;
        }
        if (r.slotId && slots && slots.length) {
            const slot = slots.find(s => s.slotId === r.slotId);
            if (slot && slot.buildingName && slot.floorName && slot.zoneName) {
                return `${DriverUtils.escapeHtml(slot.buildingName)} - ${DriverUtils.escapeHtml(slot.floorName)} - ${DriverUtils.escapeHtml(slot.zoneName)}`;
            }
        }
        return 'Chưa có thông tin vị trí';
    },

    resolveReservationFee(r) {
        let fee = DriverConditions.getReservationFee(r);
        return DriverUtils.formatCurrency(fee);
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
        return DriverRender.renderBadge(this.statusText(status), cls);
    },

    statCard(color, icon, value, label) {
        return `<div class="stat-card stat-${color}"><div class="stat-icon">${icon}</div><div class="stat-info"><div class="stat-value">${DriverUtils.escapeHtml(String(value))}</div><div class="stat-label">${DriverUtils.escapeHtml(label)}</div></div></div>`;
    },

    featureButton(page, icon, label) {
        return `<button class="feature-card" onclick="App.navigate('${page}')"><div class="feature-card-icon">${icon}</div><span>${DriverUtils.escapeHtml(label)}</span></button>`;
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

    // ===============================
    // Block: Trang Chủ (Dashboard)
    // ===============================
    // Tổng hợp thông tin cơ bản: xe của tôi, đặt chỗ sắp tới, phiên đang hoạt động.
    async home(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const [slotsRes, vehiclesRes, resRes] = await Promise.all([
            window.Api.getAvailableSlots(), 
            window.Api.getMyVehicles(),
            window.Api.getReservations()
        ]);

        const slots = await window.Api.request('/api/slots').then(res => res.data || []);
        const vehicles = vehiclesRes.success ? (vehiclesRes.data || []) : [];
        const reservations = resRes.success ? (resRes.data || []) : [];

        const totalSlots = slots.length;
        const availableSlots = slots.filter(s => DriverConditions.isSlotAvailable(s)).length;
        const occupiedSlots = slots.filter(s => s.status === 'OCCUPIED').length;
        const reservedSlots = slots.filter(s => s.status === 'RESERVED').length;
        const occupancyRate = totalSlots ? ((occupiedSlots + reservedSlots) / totalSlots) * 100 : 0;

        const activeReservations = reservations.filter(r => ['PENDING', 'CONFIRMED'].includes(r.status));
        const upcomingReservation = activeReservations[0];

        let activeSession = null;
        for(let v of vehicles) {
            const sRes = await window.Api.getActiveSession(v.licensePlate);
            if(sRes.success && sRes.data) {
                activeSession = sRes.data;
                break;
            }
        }

        container.innerHTML = `
            <section class="dashboard-hero-card">
                <div>
                    <span class="landing-kicker">Driver Dashboard</span>
                    <h2>Xin chào, ${DriverUtils.escapeHtml(App.state.user?.fullName || 'Tài xế')}</h2>
                    <p>Theo dõi chỗ trống, đặt chỗ, phiên gửi xe và thanh toán trong một giao diện duy nhất.</p>
                </div>
                <div class="dashboard-hero-actions">
                    <button class="btn btn-primary" onclick="App.navigate('parking')">Tìm chỗ ngay</button>
                    <button class="btn btn-outline" onclick="App.navigate('reservations')">Tạo đặt chỗ</button>
                </div>
            </section>
            <div class="stats-grid">
                ${this.statCard('orange', DriverRender.iconCar(), vehicles.length, 'Xe của tôi')}
                ${this.statCard('blue', DriverRender.iconCalendar(), activeReservations.length, 'Đặt chỗ sắp tới')}
                ${this.statCard('green', DriverRender.iconClock(), activeSession ? 1 : 0, 'Phiên đang hoạt động')}
                ${this.statCard('red', DriverRender.iconMapPin(), availableSlots, 'Chỗ trống')}
            </div>
            <div class="dashboard-info-grid">
                <div class="card dashboard-mini-card">
                    <div class="card-header"><span class="card-title">${DriverRender.iconClock()} Phiên hiện tại</span></div>
                    <div class="card-body">${activeSession ? `${DriverRender.renderInfoRow('Xe', activeSession.licensePlate)}${DriverRender.renderInfoRow('Slot', activeSession.slotCode || 'Vãng lai')}` : DriverRender.renderEmptyState(DriverRender.iconClock(), 'Chưa có phiên gửi xe đang hoạt động.')}</div>
                </div>
                <div class="card dashboard-mini-card">
                    <div class="card-header"><span class="card-title">${DriverRender.iconCalendar()} Đặt chỗ sắp tới</span></div>
                    <div class="card-body">${upcomingReservation ? `${DriverRender.renderInfoRow('Xe', upcomingReservation.licensePlate)}${DriverRender.renderInfoRow('Vị trí', upcomingReservation.slotCode ? upcomingReservation.slotCode + ', ' + upcomingReservation.floorName : 'Chưa xếp')}${DriverRender.renderInfoRow('Thời gian', DriverUtils.formatDateTime(upcomingReservation.reservationStart))}` : DriverRender.renderEmptyState(DriverRender.iconCalendar(), 'Không có đặt chỗ sắp tới.')}</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconMapPin()} Tổng quan bãi xe</span><button class="btn btn-outline btn-sm" onclick="App.navigate('parking')">Tìm chỗ</button></div>
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
                ${this.featureButton('vehicles', DriverRender.iconCar(), 'Xe của tôi')}
                ${this.featureButton('parking', DriverRender.iconMapPin(), 'Tìm chỗ đỗ xe')}
                ${this.featureButton('reservations', DriverRender.iconCalendar(), 'Đặt chỗ')}
                ${this.featureButton('session', DriverRender.iconClock(), 'Phiên gửi xe')}
                ${this.featureButton('payment', DriverRender.iconWallet(), 'Thanh toán')}
                ${this.featureButton('pricing', DriverRender.iconTag(), 'Chính sách giá')}
                ${this.featureButton('history', DriverRender.iconReceipt(), 'Lịch sử')}
                ${this.featureButton('incident', DriverRender.iconAlert(), 'Báo cáo sự cố')}
            </div>
            ${vehicles.length ? `
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconCar()} Xe của tôi</span><button class="btn btn-primary btn-sm" onclick="App.navigate('vehicles')">Quản lý xe</button></div>
                <div class="card-body">${vehicles.slice(0, 3).map(v => `
                    <div class="list-item">
                        <div class="list-info">
                            <h4>${DriverUtils.escapeHtml(v.licensePlate)}</h4>
                            <p>${DriverUtils.escapeHtml(v.vehicleTypeName || '-')} - ${DriverUtils.escapeHtml(v.brand || 'Chưa rõ hãng')} - ${DriverUtils.escapeHtml(v.vehicleColor || '')}</p>
                        </div>
                    </div>
                `).join('')}${vehicles.length > 3 ? `<p style="text-align:center;margin-top:8px;font-size:0.85rem;color:var(--text-muted)">... và ${vehicles.length - 3} xe khác</p>` : ''}</div>
            </div>` : `
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconCar()} Xe của tôi</span></div>
                <div class="card-body">${DriverRender.renderEmptyState(DriverRender.iconCar(), 'Chưa có phương tiện nào.')}<button class="btn btn-primary btn-full" style="margin-top:12px" onclick="App.navigate('vehicles')">Đăng ký xe ngay</button></div>
            </div>`}
        `;
    },

    // ===============================
    // Block: Tìm Chỗ (Parking)
    // ===============================
    // Lấy danh sách toàn bộ slot trong bãi đỗ và hiển thị giao diện lọc, 
    // xem tình trạng slot để tài xế dễ dàng tìm kiếm.
    async parking(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const res = await window.Api.request('/api/slots');
        if(!res.success) {
             container.innerHTML = `<div class="page-header"><h2>Tìm chỗ đỗ xe</h2></div>` + DriverRender.renderEmptyState(DriverRender.iconMapPin(), res.message);
             return;
        }
        
        const allSlots = res.data || [];
        DriverState.slots = allSlots;
        
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

        const f = DriverState.parkingFilters;
        
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
                <div class="card-header"><span class="card-title">${DriverRender.iconFilter()} Bộ lọc</span><button class="btn btn-outline btn-sm" onclick="Pages.resetParkingFilters()">Đặt lại</button></div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-group"><label>Tòa nhà</label><select onchange="Pages.updateParkingFilter('buildingName', this.value)"><option value="all">Tất cả</option>${[...buildings].map(b => `<option value="${b}" ${b === f.buildingName ? 'selected' : ''}>${DriverUtils.escapeHtml(b)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Tầng</label><select onchange="Pages.updateParkingFilter('floorName', this.value)"><option value="all">Tất cả</option>${[...floors].map(fl => `<option value="${fl}" ${fl === f.floorName ? 'selected' : ''}>${DriverUtils.escapeHtml(fl)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Khu vực</label><select onchange="Pages.updateParkingFilter('zoneName', this.value)"><option value="all">Tất cả</option>${[...zones].map(z => `<option value="${z}" ${z === f.zoneName ? 'selected' : ''}>${DriverUtils.escapeHtml(z)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Loại xe</label><select onchange="Pages.updateParkingFilter('vehicleTypeName', this.value)"><option value="all">Tất cả</option>${[...vTypes].map(t => `<option value="${t}" ${t === f.vehicleTypeName ? 'selected' : ''}>${DriverUtils.escapeHtml(t)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Trạng thái</label><select onchange="Pages.updateParkingFilter('status', this.value)"><option value="all">Tất cả</option><option value="AVAILABLE" ${f.status === 'AVAILABLE' ? 'selected' : ''}>Trống</option><option value="OCCUPIED" ${f.status === 'OCCUPIED' ? 'selected' : ''}>Đang sử dụng</option><option value="RESERVED" ${f.status === 'RESERVED' ? 'selected' : ''}>Đã đặt</option><option value="LOCKED" ${f.status === 'LOCKED' ? 'selected' : ''}>Khóa</option></select></div>
                    </div>
                </div>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">${DriverRender.iconMapPin()} Danh sách slot (${filtered.length})</span></div><div class="card-body">${this.renderSlotGroups(filtered)}</div></div>
        `;
    },

    updateParkingFilter(key, value) {
        DriverState.parkingFilters[key] = value;
        App.navigate('parking');
    },

    resetParkingFilters() {
        DriverState.parkingFilters = { buildingName: 'all', floorName: 'all', zoneName: 'all', vehicleTypeName: 'all', status: 'all', startTime: '', endTime: '' };
        App.navigate('parking');
    },

    renderSlotGroups(slots) {
        if (!slots.length) return DriverRender.renderEmptyState(DriverRender.iconMapPin(), 'Không có slot phù hợp với bộ lọc.');
        const buildings = [...new Set(slots.map(s => s.buildingName || 'Khu vực chung'))];
        return buildings.map(bName => {
            const bSlots = slots.filter(s => (s.buildingName || 'Khu vực chung') === bName);
            if (!bSlots.length) return '';
            return `
                <div class="zone-group">
                    <h3>${DriverUtils.escapeHtml(bName)}</h3>
                    <div class="slot-grid">${bSlots.map(slot => this.renderSlot(slot)).join('')}</div>
                </div>
            `;
        }).join('');
    },

    renderSlot(slot) {
        const cls = slot.status ? slot.status.toLowerCase() : 'unknown';
        const isMotorbike = DriverConditions.isMotorbikeSlot(slot);
        const iconSvg = isMotorbike 
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="opacity: 0.8; margin-bottom: 4px;"><circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M15 6h5M12.5 12.5l3.5-6.5M5.5 13L9 6h3"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="opacity: 0.8; margin-bottom: 4px;"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`;
        
        return `
            <div class="slot-tile ${cls}" onclick="Pages.showSlotDetail(${slot.slotId})" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; gap: 4px;">
                ${iconSvg}
                <strong style="font-size: 1.1rem;">${DriverUtils.escapeHtml(slot.slotCode)}</strong>
                <small style="font-weight: 500; opacity: 0.9; text-align: center;">${DriverUtils.escapeHtml(slot.vehicleTypeName || '-')}<br/>${slot.currentOccupancy || 0} / ${slot.capacity || 1}</small>
                ${this.statusBadge(slot.status)}
            </div>
        `;
    },

    showSlotDetail(slotId) {
        const slot = DriverState.slots.find(s => s.slotId === slotId);
        if (!slot) return;
        
        let actionArea = '';
        if (!DriverConditions.isSlotAvailable(slot)) {
            actionArea = `<div class="alert alert-warning" style="margin-bottom: 12px; font-size: 0.85rem; text-align: center; color: var(--yellow, #f59e0b); background: var(--yellow-bg, #fffbeb); padding: 10px; border-radius: 6px;">Slot này hiện không thể đặt chỗ.</div>`;
        } else if (DriverConditions.isMotorbikeSlot(slot)) {
            actionArea = `<div class="alert alert-warning" style="margin-bottom: 12px; font-size: 0.85rem; text-align: center; color: var(--yellow, #f59e0b); background: var(--yellow-bg, #fffbeb); padding: 10px; border-radius: 6px;">Slot xe máy không hỗ trợ đặt trước.</div>`;
        } else {
            actionArea = DriverRender.renderActionButton('Đặt chỗ slot này', `Pages.reserveSlot(${slot.slotId})`, 'btn-primary btn-full', 'margin-bottom: 12px;');
        }

        this.openModal(`
            <div class="modal-header">
                <h3>Chi tiết Slot</h3>
                <button class="modal-close" type="button" onclick="Pages.closeModal()">${DriverRender.iconClose()}</button>
            </div>
            <div class="modal-body slot-detail-modal-body">
                <div class="card" style="box-shadow: none; border: 1px solid var(--border-color); margin: 0;">
                    <div class="card-body">
                        ${DriverRender.renderInfoRow('Mã slot', slot.slotCode)}
                        <div class="list-item">
                            <div class="list-info"><h4>Trạng thái</h4></div>
                            <div>${this.statusBadge(slot.status)}</div>
                        </div>
                        ${DriverRender.renderInfoRow('Tòa nhà', slot.buildingName || '-')}
                        ${DriverRender.renderInfoRow('Tầng', slot.floorName || '-')}
                        ${DriverRender.renderInfoRow('Khu vực', slot.zoneName || '-')}
                        ${DriverRender.renderInfoRow('Loại xe', slot.vehicleTypeName || '-')}
                        ${DriverRender.renderInfoRow('Diện tích', slot.area ? slot.area + ' m²' : '-')}
                        ${DriverRender.renderInfoRow('Sức chứa', slot.capacity || 0)}
                        ${DriverRender.renderInfoRow('Đang sử dụng', slot.currentOccupancy || 0)}
                        ${DriverRender.renderInfoRow('Hoạt động', slot.isActive === false ? 'Không' : 'Có')}
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
        DriverState.pendingReservationSlotId = slotId;
        App.navigate('reservations');
    },

    // ===============================
    // Block: Đặt Chỗ (Reservations)
    // ===============================
    // Quản lý việc đặt trước chỗ đỗ xe. Form tạo đặt chỗ và danh sách đặt chỗ.
    async reservations(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const [rRes, vRes, sRes, allSlotsRes] = await Promise.all([
            window.Api.getReservations(),
            window.Api.getMyVehicles(),
            window.Api.getAvailableSlots(),
            window.Api.request('/api/slots')
        ]);
        
        if(!rRes.success) {
            container.innerHTML = `<div class="page-header"><h2>Đặt chỗ</h2></div>` + DriverRender.renderEmptyState(DriverRender.iconCalendar(), rRes.message);
            return;
        }
        
        DriverState.reservations = rRes.data || [];
        DriverState.vehicles = vRes.success ? (vRes.data || []) : [];
        const reservableVehicles = DriverState.vehicles.filter(v => DriverConditions.isReservableVehicleType(v.vehicleTypeName));
        const availableSlots = sRes.success ? (sRes.data || []).filter(s => DriverConditions.canReserveSlot(s)) : [];
        DriverState.availableSlots = availableSlots;
        DriverState.allSlots = allSlotsRes.success ? (allSlotsRes.data || []) : [];
        
        container.innerHTML = `
            <div class="page-header"><h2>Đặt chỗ</h2><p>Tạo yêu cầu đặt chỗ và theo dõi trạng thái.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconCalendar()} Tạo đặt chỗ mới</span></div>
                ${reservableVehicles.length === 0 ? `
                <div class="card-body">
                    ${DriverRender.renderEmptyState(DriverRender.iconCar(), 'Bạn chưa có phương tiện phù hợp (ô tô) để đặt chỗ trước.')}
                    <div style="margin-top: 16px; text-align: center;">
                        <button type="button" class="btn btn-primary" onclick="App.navigate('vehicles')">Đăng ký xe ngay</button>
                    </div>
                </div>
                ` : `
                <form class="card-body" onsubmit="Pages.createReservationSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Xe</label><select id="reservation-vehicle" required>${reservableVehicles.map(v => `<option value="${v.vehicleId}">${DriverUtils.escapeHtml(v.licensePlate)} - ${DriverUtils.escapeHtml(v.vehicleTypeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Chọn slot</label><select id="reservation-slot">${availableSlots.length === 0 ? '<option value="">Hiện chưa có slot phù hợp để đặt trước.</option>' : '<option value="">Tự động xếp chỗ</option>' + availableSlots.map(s => `<option value="${s.slotId}" ${DriverState.pendingReservationSlotId === s.slotId ? 'selected' : ''}>${DriverUtils.escapeHtml(s.slotCode)} - ${DriverUtils.escapeHtml(s.buildingName || '')} - ${DriverUtils.escapeHtml(s.floorName)} - ${DriverUtils.escapeHtml(s.zoneName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Giờ bắt đầu</label><input id="reservation-start" type="datetime-local" value="${DriverUtils.localDateTimeValue(new Date(Date.now() + 3600000))}" required></div>
                        <div class="form-group"><label>Giờ kết thúc</label><input id="reservation-end" type="datetime-local" value="${DriverUtils.localDateTimeValue(new Date(Date.now() + 10800000))}" required></div>
                    </div>
                    <div class="button-row" style="margin-top:16px"><button class="btn btn-primary btn-full" type="submit" ${availableSlots.length === 0 ? 'disabled' : ''}>Đặt chỗ</button></div>
                </form>
                `}
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Danh sách đặt chỗ</span></div><div class="card-body">${DriverState.reservations.map(r => this.renderReservation(r)).join('') || DriverRender.renderEmptyState(DriverRender.iconCalendar(), 'Không có dữ liệu đặt chỗ.')}</div></div>
        `;
        
        // Reset pending slot after render
        DriverState.pendingReservationSlotId = null;
    },

    async createReservationSubmit(event) {
        event.preventDefault();
        
        const userId = App.state.user?.userId || window.Api.user?.userId;
        if (!userId) {
            App.showToast('Không tìm thấy thông tin người dùng.', 'error');
            return;
        }

        const vehicleIdVal = document.getElementById('reservation-vehicle').value;
        if (!vehicleIdVal) {
            App.showToast('Vui lòng chọn xe.', 'error');
            return;
        }
        const vehicleId = Number(vehicleIdVal);
        const selectedVehicle = DriverState.vehicles.find(v => v.vehicleId === vehicleId);
        if (!selectedVehicle) {
            App.showToast('Vui lòng chọn xe.', 'error');
            return;
        }
        if (DriverConditions.isMotorbikeType(selectedVehicle.vehicleTypeName)) {
            App.showToast('Xe máy không hỗ trợ đặt chỗ trước.', 'error');
            return;
        }
        const vehicleTypeId = selectedVehicle.vehicleTypeId;

        const slotIdVal = document.getElementById('reservation-slot').value;
        if (!slotIdVal) {
            App.showToast('Vui lòng chọn slot.', 'error');
            return;
        }
        const slotId = Number(slotIdVal);
        const selectedSlot = (DriverState.slots || []).find(s => s.slotId === slotId) || (DriverState.availableSlots || []).find(s => s.slotId === slotId);
        if (!selectedSlot) {
            App.showToast('Vui lòng chọn slot.', 'error');
            return;
        }
        if (!DriverConditions.isSlotAvailable(selectedSlot)) {
            App.showToast('Slot này hiện không khả dụng.', 'error');
            return;
        }
        if (DriverConditions.isMotorbikeSlot(selectedSlot)) {
            App.showToast('Slot xe máy không hỗ trợ đặt trước.', 'error');
            return;
        }

        let isMatch = false;
        if (selectedVehicle.vehicleTypeId != null && selectedSlot.vehicleTypeId != null) {
            isMatch = (selectedVehicle.vehicleTypeId === selectedSlot.vehicleTypeId);
        } else {
            isMatch = (DriverUtils.normalizeText(selectedVehicle.vehicleTypeName) === DriverUtils.normalizeText(selectedSlot.vehicleTypeName));
        }
        if (!isMatch) {
            App.showToast('Loại xe không phù hợp với slot đã chọn.', 'error');
            return;
        }

        const startVal = document.getElementById('reservation-start').value;
        if (!startVal) {
            App.showToast('Vui lòng chọn giờ bắt đầu.', 'error');
            return;
        }
        const endVal = document.getElementById('reservation-end').value;
        if (!endVal) {
            App.showToast('Vui lòng chọn giờ kết thúc.', 'error');
            return;
        }

        const start = new Date(startVal);
        const end = new Date(endVal);
        if (end <= start) {
            App.showToast('Giờ kết thúc phải sau giờ bắt đầu.', 'error');
            return;
        }

        const formatDateTimeStr = (val) => val.length === 16 ? val + ':00' : val;

        const data = {
            userId: userId,
            vehicleId: vehicleId,
            vehicleTypeId: vehicleTypeId,
            slotId: slotId,
            reservationStart: formatDateTimeStr(startVal),
            reservationEnd: formatDateTimeStr(endVal),
            guestName: window.Api.user?.fullName || 'Tài xế'
        };

        const res = await window.Api.createReservation(data);
        if(res.success) {
            App.showToast('Tạo đặt chỗ thành công.', 'success');
            App.navigate('reservations');
        } else {
            let msg = res.message || 'Thông tin đặt chỗ chưa hợp lệ. Vui lòng kiểm tra xe, slot và thời gian đặt chỗ.';
            if (msg.toLowerCase().includes('validation failed')) {
                msg = 'Thông tin đặt chỗ chưa hợp lệ. Vui lòng kiểm tra xe, slot và thời gian đặt chỗ.';
            }
            App.showToast(msg, 'error');
        }
    },

    async cancelReservationSubmit(id) {
        if(!confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return;
        const res = await window.Api.cancelReservation(id);
        if(res.success) {
            App.showToast('Đã hủy đặt chỗ.', 'success');
            App.navigate('reservations');
        } else {
            App.showToast(res.message, 'error');
        }
    },

    renderReservation(r) {
        let statusTextStr = this.statusText(r.status);

        let paymentText = DriverConditions.isReservationPaid(r) ? 'Đã thanh toán' : 'Chưa thanh toán';
        if (r.paymentStatus === 'FAILED') paymentText = 'Thanh toán thất bại';

        const statusBadgeStr = this.statusBadge(r.status);
        const paymentBadgeCls = DriverConditions.isReservationPaid(r) ? 'badge-green' : (r.paymentStatus === 'FAILED' ? 'badge-red' : 'badge-yellow');
        const paymentBadgeStr = DriverRender.renderBadge(DriverConditions.isReservationPaid(r) ? (r.paymentMethod || paymentText) : paymentText, paymentBadgeCls);
        
        let actions = '';
        if (DriverConditions.canPayReservation(r)) {
            actions += `<button id="pay-btn-${r.reservationId}" class="btn btn-primary btn-sm" onclick="Pages.payReservation(${r.reservationId})">Thanh toán ngay</button>`;
        }
        if (DriverConditions.canCancelReservation(r)) {
            actions += `<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red); margin-left: 8px;" onclick="Pages.cancelReservationSubmit(${r.reservationId})">Hủy</button>`;
        }
        
        return `
            <div class="list-item" style="display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 1.1rem; color: var(--primary-color);">Xe: ${DriverUtils.escapeHtml(r.licensePlate)} - Slot: ${DriverUtils.escapeHtml(r.slotCode || 'Tự xếp chỗ')}</h4>
                    <div style="display: flex; gap: 6px;">${statusBadgeStr}${paymentBadgeStr}</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.9rem; color: var(--text-color);">
                    <div><strong>Loại xe:</strong> ${DriverUtils.escapeHtml(r.vehicleTypeName || '-')}</div>
                    <div><strong>Vị trí:</strong> ${this.resolveReservationLocation(r, DriverState.allSlots)}</div>
                    <div><strong>Thời gian bắt đầu:</strong> ${DriverUtils.formatDateTime(r.reservationStart)}</div>
                    <div><strong>Thời gian kết thúc:</strong> ${DriverUtils.formatDateTime(r.reservationEnd)}</div>
                    <div><strong>Phí dự kiến:</strong> <span style="color: var(--primary-color); font-weight: 600;">${this.resolveReservationFee(r)}</span></div>
                </div>
                ${actions ? `<div class="button-row" style="margin-top: 4px; justify-content: flex-end;">${actions}</div>` : ''}
            </div>
        `;
    },

    async payReservation(reservationId) {
        const btn = document.getElementById(`pay-btn-${reservationId}`);
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<div class="btn-loader" style="width: 14px; height: 14px; display: inline-block;"></div>';
        }

        DriverState.createdPayments = DriverState.createdPayments || {};
        let paymentId = DriverState.createdPayments[reservationId];

        if (!paymentId) {
            const payload = {
                reservationId: reservationId,
                paymentMethod: 'E_WALLET'
            };

            const res = await window.Api.createPayment(payload);
            
            if (res.success && res.data) {
                paymentId = res.data.paymentId;
                DriverState.createdPayments[reservationId] = paymentId;
            } else {
                let msg = res.message || 'Không thể tạo thanh toán cho đặt chỗ này.';
                if (msg.includes('already PAID') || msg.includes('has already been paid') || msg.includes('not in PENDING')) {
                    msg = 'Đặt chỗ này đã được thanh toán hoặc không thể thanh toán lúc này.';
                    App.navigate('reservations');
                }
                App.showToast(msg, 'error');
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Thanh toán ngay';
                }
                return;
            }
        }

        this.createVnPayUrl(paymentId);
    },

    // ===============================
    // Block: Quản Lý Xe (Vehicles)
    // ===============================
    // Liệt kê các phương tiện của tài xế. Thêm, sửa, xóa phương tiện và xem chi tiết.
    async vehicles(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const [vRes, tRes] = await Promise.all([
            window.Api.getMyVehicles(),
            window.Api.getVehicleTypes()
        ]);
        
        if(!vRes.success) {
            console.error(vRes.message);
            container.innerHTML = `<div class="page-header"><h2>Quản lý xe</h2></div>` + DriverRender.renderEmptyState(DriverRender.iconCar(), "Không thể tải dữ liệu xe. Vui lòng thử lại sau.");
            return;
        }
        
        DriverState.vehicles = vRes.data || [];
        DriverState.vehicleTypes = tRes.success ? (tRes.data || []) : [];
        
        container.innerHTML = `
            <div class="page-header"><h2>Quản lý xe</h2><p>Thêm, sửa, xóa phương tiện của bạn.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconCar()} Xe của tôi</span><button class="btn btn-primary btn-sm" onclick="Pages.showVehicleModal()">Thêm xe</button></div>
                <div class="card-body">${DriverState.vehicles.length ? DriverState.vehicles.map(v => this.renderVehicle(v)).join('') : DriverRender.renderEmptyState(DriverRender.iconCar(), 'Chưa có phương tiện nào.')}</div>
            </div>
        `;
    },

    showVehicleModal(vehicleId = null) {
        const vehicle = vehicleId ? DriverState.vehicles.find(v => v.vehicleId === vehicleId) : null;
        this.openModal(`
            <form onsubmit="Pages.saveVehicle(event, ${vehicleId || 'null'})" style="display: flex; flex-direction: column; min-height: 0; flex: 1;">
                <div class="modal-header"><h3>${vehicle ? 'Sửa xe' : 'Thêm xe'}</h3><button class="modal-close" type="button" onclick="Pages.closeModal()">${DriverRender.iconClose()}</button></div>
                <div class="modal-body">
                    <div id="vehicle-error" class="alert alert-error" style="display:none; color: var(--red, red); margin-bottom: 10px; padding: 10px; border-radius: 4px; background: rgba(255,0,0,0.1);"></div>
                    <div class="form-grid">
                        <div class="form-group"><label>Biển số xe <span style="color: var(--red);">*</span></label><input id="vehicle-plate" value="${DriverUtils.escapeAttr(vehicle?.licensePlate || '')}" placeholder="Vui lòng nhập biển số xe"></div>
                        <div class="form-group"><label>Loại xe <span style="color: var(--red);">*</span></label><select id="vehicle-type"><option value="">Vui lòng chọn loại xe</option>${DriverState.vehicleTypes.map(t => `<option value="${t.vehicleTypeId}" ${vehicle?.vehicleTypeId === t.vehicleTypeId ? 'selected' : ''}>${DriverUtils.escapeHtml(t.typeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Tên chủ xe <span style="color: var(--red);">*</span></label><input id="vehicle-ownerName" value="${DriverUtils.escapeAttr(vehicle?.ownerName || '')}" placeholder="Vui lòng nhập tên chủ xe"></div>
                        <div class="form-group"><label>SĐT chủ xe <span style="color: var(--red);">*</span></label><input id="vehicle-ownerPhone" value="${DriverUtils.escapeAttr(vehicle?.ownerPhone || '')}" placeholder="Vui lòng nhập số điện thoại"></div>
                        <div class="form-group"><label>Hãng xe <span style="color: var(--red);">*</span></label><input id="vehicle-brand" value="${DriverUtils.escapeAttr(vehicle?.brand || '')}" placeholder="Vui lòng nhập hãng xe"></div>
                        <div class="form-group"><label>Màu xe <span style="color: var(--red);">*</span></label><input id="vehicle-color" value="${DriverUtils.escapeAttr(vehicle?.vehicleColor || '')}" placeholder="Vui lòng nhập màu xe"></div>
                        <div class="form-group full-width"><label>Ảnh cà vẹt xe <span style="color: var(--red);">*</span></label><input id="vehicle-regPhoto-file" type="file" accept="image/*" ${vehicle?.registrationPhoto ? '' : 'required'}>
                        ${vehicle?.registrationPhoto ? `<div style="margin-top: 4px;"><a href="${vehicle.registrationPhoto}" target="_blank">Xem ảnh hiện tại</a></div>` : ''}</div>
                        <div class="form-group full-width"><label>Ảnh biển số xe <span style="color: var(--red);">*</span></label><input id="vehicle-image-file" type="file" accept="image/*" ${vehicle?.vehicleImage ? '' : 'required'}>
                        ${vehicle?.vehicleImage ? `<div style="margin-top: 4px;"><a href="${vehicle.vehicleImage}" target="_blank">Xem ảnh hiện tại</a></div>` : ''}</div>
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

        if (!licensePlate) return showError('Vui lòng nhập biển số xe.');
        if (!vehicleTypeIdVal) return showError('Vui lòng chọn loại xe.');
        if (!ownerName) return showError('Vui lòng nhập tên chủ xe.');
        if (!ownerPhone) return showError('Vui lòng nhập số điện thoại chủ xe.');
        
        const phoneRegex = /^[0-9]{9,15}$/;
        if (!phoneRegex.test(ownerPhone)) return showError('Số điện thoại chủ xe không hợp lệ.');
        
        if (!brand) return showError('Vui lòng nhập hãng xe.');
        if (!vehicleColor) return showError('Vui lòng nhập màu xe.');

        const data = {
            licensePlate,
            vehicleTypeId: Number(vehicleTypeIdVal),
            ownerName,
            ownerPhone,
            brand,
            vehicleColor
        };
        
        const res = vehicleId ? await window.Api.updateMyVehicle(vehicleId, data) : await window.Api.createMyVehicle(data);
        if(res.success) {
            const savedVehicleId = res.data?.vehicleId;
            if (savedVehicleId) {
                const regFile = document.getElementById('vehicle-regPhoto-file')?.files[0];
                if (regFile) await window.Api.uploadMyVehicleImage(savedVehicleId, regFile, 'registration');
                const imgFile = document.getElementById('vehicle-image-file')?.files[0];
                if (imgFile) await window.Api.uploadMyVehicleImage(savedVehicleId, imgFile, 'vehicle');
            }
            App.showToast(vehicleId ? 'Đã cập nhật xe.' : 'Đã thêm xe.', 'success');
            this.closeModal();
            App.navigate('vehicles');
        } else {
            showError(res.message);
        }
    },

    async deleteVehicleSubmit(vehicleId) {
        if(!confirm('Bạn có chắc muốn xóa xe này?')) return;
        const res = await window.Api.deleteMyVehicle(vehicleId);
        if(res.success) {
            App.showToast('Đã xóa xe.', 'success');
            App.navigate('vehicles');
        } else {
            App.showToast(res.message, 'error');
        }
    },

    renderVehicle(v) {
        return `
            <div class="vehicle-card clickable-card" onclick="Pages.showVehicleDetail(${v.vehicleId})">
                <div class="vehicle-icon">${DriverRender.iconCar()}</div>
                <div class="vehicle-info">
                    <h3>${DriverUtils.escapeHtml(v.licensePlate)}</h3>
                    <div class="vehicle-meta">${DriverUtils.escapeHtml(v.vehicleTypeName)} - ${DriverUtils.escapeHtml(v.brand || 'Chưa rõ hãng')} - ${DriverUtils.escapeHtml(v.vehicleColor || 'Chưa rõ màu')}</div>
                    <div class="button-row">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); Pages.showVehicleModal(${v.vehicleId})">Sửa</button>
                        <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="event.stopPropagation(); Pages.deleteVehicleSubmit(${v.vehicleId})">Xóa</button>
                    </div>
                </div>
            </div>
        `;
    },

    showVehicleDetail(vehicleId) {
        const v = DriverState.vehicles.find(x => x.vehicleId === vehicleId);
        if(!v) return;
        
        let imgHtml = '';
        if (v.vehicleImage) {
            imgHtml = `<div class="list-item"><div class="list-info"><h4>Hình ảnh xe</h4><div style="margin-top: 8px;"><img src="${DriverUtils.escapeAttr(v.vehicleImage)}" style="max-width: 100%; border-radius: 8px; border: 1px solid var(--border-color);" alt="Hình ảnh xe"></div></div></div>`;
        } else {
            imgHtml = DriverRender.renderInfoRow('Hình ảnh xe', 'Chưa có thông tin');
        }

        this.openModal(`
            <div class="modal-header">
                <h3>Chi tiết xe</h3>
                <button class="modal-close" type="button" onclick="Pages.closeModal()">${DriverRender.iconClose()}</button>
            </div>
            <div class="modal-body">
                <div class="card" style="box-shadow: none; border: 1px solid var(--border-color); margin: 0;">
                    <div class="card-body">
                        ${DriverRender.renderInfoRow('Mã xe', v.vehicleId || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Biển số xe', v.licensePlate || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Loại xe', v.vehicleTypeName || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Tên chủ xe', v.ownerName || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Số điện thoại chủ xe', v.ownerPhone || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Hãng xe', v.brand || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Màu xe', v.vehicleColor || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Số máy', v.engineNumber || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Số khung', v.chassisNumber || 'Chưa có thông tin')}
                        ${DriverRender.renderInfoRow('Năm sản xuất', v.manufactureYear || 'Chưa có thông tin')}
                        ${imgHtml}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline btn-full" onclick="Pages.closeModal()">Đóng</button>
            </div>
        `);
    },

    // ===============================
    // Block: Hồ Sơ Cá Nhân (Account)
    // ===============================
    // Hiển thị thông tin người dùng và hỗ trợ cập nhật thông tin cá nhân hoặc mật khẩu.
    async account(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const res = await window.Api.getCurrentUser();
        
        if (!res.success) {
            container.innerHTML = `
                <div class="page-header"><h2>Hồ sơ cá nhân</h2></div>
                ${DriverRender.renderEmptyState(DriverRender.iconUser(), res.message || 'Không thể tải thông tin người dùng.')}
            `;
            return;
        }

        const u = res.data;
        const userId = u.userId || u.id || u.userid;
        const fullName = u.fullname || u.fullName || '';
        const email = u.email || '';
        const phone = u.phonenumber || u.phoneNumber || '';
        const dob = u.dateofbirth || u.dateOfBirth || '';
        const address = u.address || '';
        const role = u.roleName || u.role || u.rolename || 'Driver';
        let status = u.status !== undefined ? u.status : (u.isActive !== undefined ? u.isActive : (u.isactive !== undefined ? u.isactive : '-'));
        if (status === true) status = 'Hoạt động';
        if (status === false) status = 'Đã khóa';

        container.innerHTML = `
            <div class="page-header"><h2>Hồ sơ cá nhân</h2><p>Thông tin tài khoản từ hệ thống.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconUser()} Thông tin cơ bản</span></div>
                <div class="card-body">
                    ${DriverRender.renderInfoRow('Mã người dùng', userId || '-')}
                    ${DriverRender.renderInfoRow('Họ tên', fullName || '-')}
                    ${DriverRender.renderInfoRow('Email', email || '-')}
                    ${DriverRender.renderInfoRow('Số điện thoại', phone || 'Chưa có thông tin')}
                    ${DriverRender.renderInfoRow('Ngày sinh', dob || 'Chưa có thông tin')}
                    ${DriverRender.renderInfoRow('Địa chỉ', address || 'Chưa có thông tin')}
                    ${DriverRender.renderInfoRow('Vai trò', role)}
                    ${DriverRender.renderInfoRow('Trạng thái tài khoản', status)}
                    
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="account-edit-btn btn btn-outline" onclick="Pages.showEditProfileModal()">Chỉnh sửa thông tin</button>
                            <button class="account-edit-btn btn btn-outline" onclick="Pages.showChangePasswordModal()">Đổi mật khẩu</button>
                        </div>
                    </div>

                    <div class="button-row" style="margin-top:20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-outline" style="color:var(--red);border-color:var(--red)" onclick="App.logout()">Đăng xuất</button>
                    </div>
                </div>
            </div>
        `;
    },

    showEditProfileModal() {
        const u = App.state.user || window.Api.user;
        if (!u) return;

        const fullName = u.fullname || u.fullName || '';
        const email = u.email || '';
        const phone = u.phonenumber || u.phoneNumber || '';
        const address = u.address || '';

        this.openModal(`
            <div class="modal-header">
                <h3>Chỉnh sửa thông tin</h3>
                <button class="modal-close" type="button" onclick="Pages.closeModal()">${DriverRender.iconClose()}</button>
            </div>
            <form class="modal-body" onsubmit="Pages.submitEditProfile(event)">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Họ tên</label>
                        <input id="edit-profile-name" type="text" value="${DriverUtils.escapeAttr(fullName)}" required>
                    </div>
                    <div class="form-group full-width">
                        <label>Email (Không được sửa)</label>
                        <input id="edit-profile-email" type="email" value="${DriverUtils.escapeAttr(email)}" disabled style="background-color: var(--bg-color); cursor: not-allowed;">
                    </div>
                    <div class="form-group full-width">
                        <label>Số điện thoại</label>
                        <input id="edit-profile-phone" type="tel" value="${DriverUtils.escapeAttr(phone)}">
                    </div>
                    <div class="form-group full-width">
                        <label>Địa chỉ</label>
                        <input id="edit-profile-address" type="text" value="${DriverUtils.escapeAttr(address)}">
                    </div>
                </div>
                <div id="edit-profile-error" class="login-error hidden" style="margin-top: 16px;"></div>
                <div class="modal-footer" style="padding-left: 0; padding-right: 0; padding-bottom: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-outline" onclick="Pages.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary" id="edit-profile-submit-btn">Lưu thay đổi</button>
                </div>
            </form>
        `);
    },

    async submitEditProfile(event) {
        event.preventDefault();
        const btn = document.getElementById('edit-profile-submit-btn');
        const err = document.getElementById('edit-profile-error');
        btn.disabled = true;
        btn.innerHTML = '<div class="btn-loader"></div>';
        err.classList.add('hidden');

        const payload = {
            fullName: document.getElementById('edit-profile-name').value,
            phoneNumber: document.getElementById('edit-profile-phone').value,
            address: document.getElementById('edit-profile-address').value
        };

        const res = await window.Api.updateMyProfile(payload);
        
        if (res.success) {
            App.showToast('Cập nhật thành công', 'success');
            // Update local cache
            const u = window.Api.user || {};
            const newUser = { ...u, ...payload };
            window.Api.saveAuth(newUser);
            App.state.user = newUser;
            document.getElementById('header-user-name').textContent = payload.fullName || 'Tài xế';
            document.getElementById('header-avatar').textContent = (payload.fullName || 'T').charAt(0).toUpperCase();
            this.closeModal();
            this.account(document.getElementById('page-content'));
        } else {
            btn.disabled = false;
            btn.innerHTML = 'Lưu thay đổi';
            err.classList.remove('hidden');
            err.textContent = res.message || 'Cập nhật thất bại';
        }
    },

    showChangePasswordModal() {
        this.openModal(`
            <div class="modal-header">
                <h3>Đổi mật khẩu</h3>
                <button class="modal-close" type="button" onclick="Pages.closeModal()">${DriverRender.iconClose()}</button>
            </div>
            <form class="modal-body" onsubmit="Pages.submitChangePassword(event)">
                <div class="form-grid">
                    <div class="form-group full-width">
                        <label>Mật khẩu hiện tại</label>
                        <input id="change-password-old" type="password" required minlength="6">
                    </div>
                    <div class="form-group full-width">
                        <label>Mật khẩu mới</label>
                        <input id="change-password-new" type="password" required minlength="6">
                    </div>
                    <div class="form-group full-width">
                        <label>Xác nhận mật khẩu mới</label>
                        <input id="change-password-confirm" type="password" required minlength="6">
                    </div>
                </div>
                <div id="change-password-error" class="login-error hidden" style="margin-top: 16px;"></div>
                <div class="modal-footer" style="padding-left: 0; padding-right: 0; padding-bottom: 0; border: none; margin-top: 24px;">
                    <button type="button" class="btn btn-outline" onclick="Pages.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary" id="change-password-submit-btn">Lưu thay đổi</button>
                </div>
            </form>
        `);
    },

    async submitChangePassword(event) {
        event.preventDefault();
        const oldPassword = document.getElementById('change-password-old').value;
        const newPassword = document.getElementById('change-password-new').value;
        const confirmPassword = document.getElementById('change-password-confirm').value;
        const btn = document.getElementById('change-password-submit-btn');
        const err = document.getElementById('change-password-error');

        if (newPassword !== confirmPassword) {
            err.textContent = 'Mật khẩu xác nhận không khớp.';
            err.classList.remove('hidden');
            return;
        }

        btn.disabled = true;
        btn.innerHTML = '<div class="btn-loader"></div>';
        err.classList.add('hidden');

        const res = await window.Api.changePassword(oldPassword, newPassword);
        
        if (res.success) {
            App.showToast('Đổi mật khẩu thành công', 'success');
            this.closeModal();
        } else {
            btn.disabled = false;
            btn.innerHTML = 'Lưu thay đổi';
            err.classList.remove('hidden');
            err.textContent = res.message || 'Đổi mật khẩu thất bại';
        }
    },

    // ===============================
    // Block: Quản lý Phiên (Session) & Thanh Toán & Lịch sử
    // ===============================
    // Các chức năng khác như xem phiên đang gửi, yêu cầu thanh toán VNPay.
    async session(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const resVehicles = await window.Api.getMyVehicles();
        const vehicles = resVehicles.success ? (resVehicles.data || []) : [];
        
        let activeSession = null;
        for(let v of vehicles) {
            const sessionRes = await window.Api.getActiveSession(v.licensePlate);
            if(sessionRes.success && sessionRes.data) {
                activeSession = sessionRes.data;
                break;
            }
        }

        container.innerHTML = `
            <div class="page-header"><h2>Phiên gửi xe</h2><p>Chỉ xem phiên gửi xe đang hoạt động. Check-in / Check-out do nhân viên thực hiện.</p></div>
            ${activeSession ? this.renderActiveSession(activeSession) : DriverRender.renderEmptyState(DriverRender.iconClock(), 'Không có phiên gửi xe nào đang hoạt động.')}
        `;
    },

    renderActiveSession(session) {
        return `
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconClock()} Phiên đang hoạt động</span><span class="badge badge-green">Đang đỗ</span></div>
                <div class="card-body">
                    <div class="stats-grid">
                        ${this.statCard('orange', DriverRender.iconCar(), session.licensePlate, 'Biển số')}
                        ${this.statCard('blue', DriverRender.iconMapPin(), session.slotCode, 'Mã slot')}
                    </div>
                    ${DriverRender.renderInfoRow('Vị trí', `${session.zoneName || '-'}, ${session.floorName || '-'}, ${session.buildingName || '-'}`)}
                    ${DriverRender.renderInfoRow('Giờ vào', DriverUtils.formatDateTime(session.entryTime))}
                    ${DriverRender.renderInfoRow('Trạng thái', this.statusText(session.status))}
                </div>
            </div>
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
        const res = await window.Api.createVnPayUrl(paymentId);
        if(res.success && res.data && res.data.paymentUrl) {
            window.location.href = res.data.paymentUrl;
        } else {
            App.showToast(res.message || 'Không thể tạo link thanh toán VNPay', 'error');
        }
    },

    async pricing(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const res = await window.Api.request('/api/pricings');
        
        if (!res.success) {
            container.innerHTML = `<div class="page-header"><h2>Chính sách giá</h2></div>` + DriverRender.renderEmptyState(DriverRender.iconTag(), res.message);
            return;
        }

        const policies = res.data || [];
        
        container.innerHTML = `
            <div class="page-header"><h2>Chính sách giá</h2><p>Bảng giá dịch vụ đỗ xe hiện tại.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconTag()} Danh sách bảng giá</span></div>
                <div class="card-body" style="padding: 0; overflow-x: auto;">
                    ${policies.length === 0 ? `<div style="padding: 20px;">${DriverRender.renderEmptyState(DriverRender.iconTag(), 'Chưa có chính sách giá nào.')}</div>` : `
                        <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
                            <thead>
                                <tr style="background-color: var(--bg-color); border-bottom: 2px solid var(--border-color);">
                                    <th style="padding: 12px 16px;">Loại xe</th>
                                    <th style="padding: 12px 16px;">Giá cơ bản</th>
                                    <th style="padding: 12px 16px;">Giá giờ cao điểm</th>
                                    <th style="padding: 12px 16px;">Giá ngoài giờ</th>
                                    <th style="padding: 12px 16px;">Giới hạn / ngày</th>
                                    <th style="padding: 12px 16px;">Phụ phí vượt giờ</th>
                                    <th style="padding: 12px 16px;">Phí mất vé</th>
                                    <th style="padding: 12px 16px; text-align: center;">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${policies.map(p => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 12px 16px; font-weight: 600;">${DriverUtils.escapeHtml(p.vehicleTypeName || 'Tất cả')}</td>
                                        <td style="padding: 12px 16px; color: var(--text-color);">${DriverUtils.formatCurrency(p.basePrice)}</td>
                                        <td style="padding: 12px 16px; color: var(--text-color);">
                                            ${DriverUtils.formatCurrency(p.rushHourPrice)}
                                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 2px;">(${p.rushHourStart || '-'} - ${p.rushHourEnd || '-'})</div>
                                        </td>
                                        <td style="padding: 12px 16px; color: var(--text-color);">
                                            ${DriverUtils.formatCurrency(p.offPeakPrice)}
                                        </td>
                                        <td style="padding: 12px 16px; color: var(--primary-color); font-weight: 500;">
                                            ${p.maxDailyRate ? DriverUtils.formatCurrency(p.maxDailyRate) : 'Không giới hạn'}
                                        </td>
                                        <td style="padding: 12px 16px; color: var(--red); font-weight: 500;">
                                            ${p.overtimeFeePerHour ? DriverUtils.formatCurrency(p.overtimeFeePerHour) + '/h' : '-'}
                                        </td>
                                        <td style="padding: 12px 16px; color: var(--text-color);">
                                            ${p.lostTicketFee ? DriverUtils.formatCurrency(p.lostTicketFee) : '-'}
                                        </td>
                                        <td style="padding: 12px 16px; text-align: center;">
                                            <span class="badge ${p.isActive ? 'badge-success' : 'badge-danger'}">${p.isActive ? 'Áp dụng' : 'Ngừng'}</span>
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    },

    async history(container) {
        container.innerHTML = `
            <div class="page-header"><h2>Lịch sử gửi xe</h2><p>Lịch sử gửi xe.</p></div>
            <div class="empty-state">${DriverRender.iconReceipt()}<p>Chưa có API Lịch sử gửi xe cho Driver. Vui lòng xem ở Đặt chỗ.</p></div>
        `;
    },

    // ===============================
    // Block: Báo Cáo Sự Cố (Incident)
    // ===============================
    // Quản lý việc gửi báo cáo sự cố trong bãi xe.
    async incident(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const res = await window.Api.getIncidents();
        
        if(!res.success) {
            container.innerHTML = `<div class="page-header"><h2>Báo cáo sự cố</h2></div>` + DriverRender.renderEmptyState(DriverRender.iconAlert(), res.message);
            return;
        }
        
        DriverState.incidents = res.data || [];
        
        container.innerHTML = `
            <div class="page-header"><h2>Báo cáo sự cố</h2><p>Gửi báo cáo sự cố trong bãi xe.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${DriverRender.iconAlert()} Tạo báo cáo</span></div>
                <form class="card-body" onsubmit="Pages.submitIncident(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Loại sự cố *</label><select id="incident-type" required><option value="">Chọn loại sự cố</option><option>Chỗ đỗ hư hỏng</option><option>Xe bị chắn lối</option><option>Vấn đề thanh toán</option><option>Mất vé</option><option>Điều kiện không an toàn</option><option>Khác</option></select></div>
                        <div class="form-group full-width"><label>Mô tả chi tiết *</label><textarea id="incident-description" rows="4" placeholder="Mô tả ngắn gọn sự cố" required></textarea></div>
                    </div>
                    <button class="btn btn-primary btn-full" type="submit" style="margin-top:10px;">Gửi báo cáo</button>
                </form>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Sự cố đã gửi</span></div><div class="card-body">${DriverState.incidents.length ? DriverState.incidents.map(i => this.renderIncident(i)).join('') : DriverRender.renderEmptyState(DriverRender.iconAlert(), 'Chưa có báo cáo sự cố.')}</div></div>
        `;
    },

    async submitIncident(event) {
        event.preventDefault();
        const data = {
            incidentType: document.getElementById('incident-type').value,
            description: document.getElementById('incident-description').value.trim()
        };
        const res = await window.Api.createIncident(data);
        if(res.success) {
            App.showToast('Gửi báo cáo thành công', 'success');
            App.navigate('incident');
        } else {
            App.showToast(res.message, 'error');
        }
    },

    renderIncident(item) {
        return `
            <div class="list-item">
                <div class="list-info">
                    <h4>ID: ${item.incidentId} - ${DriverUtils.escapeHtml(item.incidentType || item.type)}</h4>
                    <p>${DriverUtils.escapeHtml(item.description)}</p>
                    <p style="font-size:.75rem;color:var(--text-muted);margin-top:8px">${DriverUtils.formatDateTime(item.createdAt)} - Báo cáo bởi: ${DriverUtils.escapeHtml(item.reportedByName || '-')}</p>
                </div>
                <span class="badge badge-yellow">${DriverUtils.escapeHtml(item.status)}</span>
            </div>
        `;
    }
};

window.Pages = Pages;
