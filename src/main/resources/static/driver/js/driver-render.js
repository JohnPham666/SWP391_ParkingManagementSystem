// Reusable HTML render helpers
const DriverRender = {
    renderBadge(text, typeCls) {
        return `<span class="badge ${typeCls}">${DriverUtils.escapeHtml(text)}</span>`;
    },

    renderInfoRow(label, value) {
        return `<div class="list-item"><div class="list-info"><h4>${DriverUtils.escapeHtml(label)}</h4><p>${DriverUtils.escapeHtml(String(value ?? '-'))}</p></div></div>`;
    },

    renderEmptyState(icon, message) {
        return `<div class="empty-state">${icon}<p>${DriverUtils.escapeHtml(message)}</p></div>`;
    },

    renderLoadingState() {
        return `<div class="loading-spinner"><div class="spinner"></div></div>`;
    },

    renderErrorState(message) {
        return `<div class="empty-state"><p style="color:var(--red)">Lỗi: ${DriverUtils.escapeHtml(message)}</p></div>`;
    },

    renderActionButton(label, onclickStr, typeCls = 'btn-primary', extraStyles = '') {
        return `<button class="btn ${typeCls}" style="${extraStyles}" onclick="${onclickStr}">${DriverUtils.escapeHtml(label)}</button>`;
    },

    iconSvg(path) { return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${path}</svg>`; },
    iconCar() { return this.iconSvg('<path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>'); },
    iconCalendar() { return this.iconSvg('<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>'); },
    iconMapPin() { return this.iconSvg('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>'); },
    iconClock() { return this.iconSvg('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'); },
    iconWallet() { return this.iconSvg('<path d="M20 7H5a2 2 0 010-4h14v4z"/><path d="M5 7h16v14H5a2 2 0 01-2-2V5"/><path d="M16 14h2"/>'); },
    iconTag() { return this.iconSvg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><circle cx="7" cy="7" r="1"/>'); },
    iconReceipt() { return this.iconSvg('<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2H4z"/><path d="M8 7h8M8 11h8M8 15h5"/>'); },
    iconAlert() { return this.iconSvg('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'); },
    iconUser() { return this.iconSvg('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>'); },
    iconFilter() { return this.iconSvg('<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/>'); },
    iconClose() { return this.iconSvg('<path d="M18 6L6 18M6 6l12 12"/>'); },

    statusBadge(status) {
        const cls = {
            AVAILABLE: 'badge-green', RESERVED: 'badge-yellow', OCCUPIED: 'badge-red',
            LOCKED: 'badge-gray', PAID: 'badge-green', UNPAID: 'badge-yellow',
            CONFIRMED: 'badge-green', PENDING: 'badge-yellow', CANCELLED: 'badge-gray'
        }[status] || 'badge-gray';
        return this.renderBadge(DriverUtils.statusText(status), cls);
    },

    statCard(color, icon, value, label) {
        return `<div class="stat-card stat-${color}"><div class="stat-icon">${icon}</div><div class="stat-info"><div class="stat-value">${DriverUtils.escapeHtml(String(value))}</div><div class="stat-label">${DriverUtils.escapeHtml(label)}</div></div></div>`;
    },

    featureButton(page, icon, label) {
        return `<button class="feature-card" onclick="App.navigate('${page}')"><div class="feature-card-icon">${icon}</div><span>${DriverUtils.escapeHtml(label)}</span></button>`;
    },

    renderSlotGroups(slots) {
        if (!slots.length) {
            const f = DriverState.getParkingFilters ? DriverState.getParkingFilters() : DriverState.parkingFilters;
            if (f && f.startTime && f.endTime) {
                return this.renderEmptyState(this.iconMapPin(), 'Không có slot khả dụng trong khoảng thời gian đã chọn.');
            }
            return this.renderEmptyState(this.iconMapPin(), 'Không có slot phù hợp với bộ lọc.');
        }
        const buildings = [...new Set(slots.map(s => s.buildingName || 'Khu vực chung'))];
        return buildings.map(bName => {
            const bSlots = slots.filter(s => (s.buildingName || 'Khu vực chung') === bName);
            if (!bSlots.length) return '';
            return `
                <div class="zone-group">
                    <h3>${DriverUtils.escapeHtml(bName)}</h3>
                    <div class="slot-grid">${bSlots.map(slot => this.renderSlotCard(slot)).join('')}</div>
                </div>
            `;
        }).join('');
    },

    renderSlotCard(slot) {
        const cls = slot.status ? slot.status.toLowerCase() : 'unknown';
        const isMotorbike = DriverConditions.isMotorbikeSlot(slot);
        const iconSvg = isMotorbike 
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="opacity: 0.8; margin-bottom: 4px;"><circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M15 6h5M12.5 12.5l3.5-6.5M5.5 13L9 6h3"/></svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28" style="opacity: 0.8; margin-bottom: 4px;"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>`;
        
        let badgeHtml = '';
        let extraStyle = '';
        if (slot.isRecommended) {
            badgeHtml = `<div style="position: absolute; top: -8px; right: -8px; background: var(--primary-color, #0ea5e9); color: white; font-size: 0.7rem; font-weight: bold; padding: 2px 6px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); z-index: 2;">Đề xuất</div>`;
            extraStyle = `border: 2px solid var(--primary-color, #0ea5e9); box-shadow: 0 0 8px rgba(14, 165, 233, 0.4); transform: scale(1.02); position: relative;`;
        }

        return `
            <div class="slot-tile ${cls}" onclick="window.Pages.showSlotDetail(${slot.slotId})" style="cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 12px; gap: 4px; ${extraStyle}">
                ${badgeHtml}
                ${iconSvg}
                <strong style="font-size: 1.1rem;">${DriverUtils.escapeHtml(slot.slotCode)}</strong>
                <small style="font-weight: 500; opacity: 0.9; text-align: center;">${DriverUtils.escapeHtml(slot.vehicleTypeName || '-')}<br/>${slot.currentOccupancy || 0} / ${slot.capacity || 1}</small>
                ${this.statusBadge(slot.status)}
            </div>
        `;
    },

    renderReservationCard(r) {
        let paymentText = DriverConditions.isReservationPaid(r) ? 'Đã thanh toán' : 'Chưa thanh toán';
        if (r.paymentStatus === 'FAILED') paymentText = 'Thanh toán thất bại';

        const statusBadgeStr = this.statusBadge(r.status);
        const paymentBadgeCls = DriverConditions.isReservationPaid(r) ? 'badge-green' : (r.paymentStatus === 'FAILED' ? 'badge-red' : 'badge-yellow');
        const paymentBadgeStr = this.renderBadge(DriverConditions.isReservationPaid(r) ? (r.paymentMethod || paymentText) : paymentText, paymentBadgeCls);
        
        let actions = '';
        if (DriverConditions.canPayReservation(r)) {
            actions += `<button id="pay-btn-${r.reservationId}" class="btn btn-primary btn-sm" onclick="window.Pages.payReservation(${r.reservationId})">Thanh toán ngay</button>`;
        }
        if (DriverConditions.canCancelReservation(r)) {
            actions += `<button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red); margin-left: 8px;" onclick="window.Pages.cancelReservationSubmit(${r.reservationId})">Hủy</button>`;
        }
        
        const allSlots = (DriverState.getRawSlots ? DriverState.getRawSlots() : DriverState.rawSlots) || DriverState.allSlots || [];
        return `
            <div class="list-item" style="display: flex; flex-direction: column; gap: 12px; padding: 16px; border: 1px solid var(--border-color); border-radius: 8px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid var(--border-color); padding-bottom: 8px;">
                    <h4 style="margin: 0; font-size: 1.1rem; color: var(--primary-color);">Xe: ${DriverUtils.escapeHtml(r.licensePlate)} - Slot: ${DriverUtils.escapeHtml(r.slotCode || 'Tự xếp chỗ')}</h4>
                    <div style="display: flex; gap: 6px;">${statusBadgeStr}${paymentBadgeStr}</div>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 8px; font-size: 0.9rem; color: var(--text-color);">
                    <div><strong>Loại xe:</strong> ${DriverUtils.escapeHtml(r.vehicleTypeName || '-')}</div>
                    <div><strong>Vị trí:</strong> ${DriverUtils.resolveReservationLocation(r, allSlots)}</div>
                    <div><strong>Thời gian bắt đầu:</strong> ${DriverUtils.formatDateTime(r.reservationStart)}</div>
                    <div><strong>Thời gian kết thúc:</strong> ${DriverUtils.formatDateTime(r.reservationEnd)}</div>
                    <div><strong>Phí dự kiến:</strong> <span style="color: var(--primary-color); font-weight: 600;">${DriverUtils.resolveReservationFee(r)}</span></div>
                </div>
                ${actions ? `<div class="button-row" style="margin-top: 4px; justify-content: flex-end;">${actions}</div>` : ''}
            </div>
        `;
    },

    renderVehicleCard(v) {
        return `
            <div class="vehicle-card clickable-card" onclick="window.Pages.showVehicleDetail(${v.vehicleId})">
                <div class="vehicle-icon">${this.iconCar()}</div>
                <div class="vehicle-info">
                    <h3>${DriverUtils.escapeHtml(v.licensePlate)}</h3>
                    <div class="vehicle-meta">${DriverUtils.escapeHtml(v.vehicleTypeName)} - ${DriverUtils.escapeHtml(v.brand || 'Chưa rõ hãng')} - ${DriverUtils.escapeHtml(v.vehicleColor || 'Chưa rõ màu')}</div>
                    <div class="button-row">
                        <button class="btn btn-outline btn-sm" onclick="event.stopPropagation(); window.Pages.showVehicleModal(${v.vehicleId})">Sửa</button>
                        <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="event.stopPropagation(); window.Pages.deleteVehicleSubmit(${v.vehicleId})">Xóa</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderIncidentCard(item) {
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
    },

    renderHomePage(userFullName, occupancyRate, totalSlots, availableSlots, occupiedSlots, reservedSlots, vehicles, activeReservations, activeSession, upcomingReservation) {
        return `
            <section class="dashboard-hero-card">
                <div>
                    <span class="landing-kicker">Driver Dashboard</span>
                    <h2>Xin chào, ${DriverUtils.escapeHtml(userFullName || 'Tài xế')}</h2>
                    <p>Theo dõi chỗ trống, đặt chỗ, phiên gửi xe và thanh toán trong một giao diện duy nhất.</p>
                </div>
                <div class="dashboard-hero-actions">
                    <button class="btn btn-primary" onclick="App.navigate('parking')">Tìm chỗ ngay</button>
                    <button class="btn btn-outline" onclick="App.navigate('reservations')">Tạo đặt chỗ</button>
                </div>
            </section>
            <div class="stats-grid">
                ${this.statCard('orange', this.iconCar(), vehicles.length, 'Xe của tôi')}
                ${this.statCard('blue', this.iconCalendar(), activeReservations.length, 'Đặt chỗ sắp tới')}
                ${this.statCard('green', this.iconClock(), activeSession ? 1 : 0, 'Phiên đang hoạt động')}
                ${this.statCard('red', this.iconMapPin(), availableSlots, 'Chỗ trống')}
            </div>
            <div class="dashboard-info-grid">
                <div class="card dashboard-mini-card">
                    <div class="card-header"><span class="card-title">${this.iconClock()} Phiên hiện tại</span></div>
                    <div class="card-body">${activeSession ? `${this.renderInfoRow('Xe', activeSession.licensePlate)}${this.renderInfoRow('Slot', activeSession.slotCode || 'Vãng lai')}` : this.renderEmptyState(this.iconClock(), 'Chưa có phiên gửi xe đang hoạt động.')}</div>
                </div>
                <div class="card dashboard-mini-card">
                    <div class="card-header"><span class="card-title">${this.iconCalendar()} Đặt chỗ sắp tới</span></div>
                    <div class="card-body">${upcomingReservation ? `${this.renderInfoRow('Xe', upcomingReservation.licensePlate)}${this.renderInfoRow('Vị trí', upcomingReservation.slotCode ? upcomingReservation.slotCode + ', ' + upcomingReservation.floorName : 'Chưa xếp')}${this.renderInfoRow('Thời gian', DriverUtils.formatDateTime(upcomingReservation.reservationStart))}` : this.renderEmptyState(this.iconCalendar(), 'Không có đặt chỗ sắp tới.')}</div>
                </div>
            </div>
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconMapPin()} Tổng quan bãi xe</span><button class="btn btn-outline btn-sm" onclick="App.navigate('parking')">Tìm chỗ</button></div>
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
                ${this.featureButton('vehicles', this.iconCar(), 'Xe của tôi')}
                ${this.featureButton('parking', this.iconMapPin(), 'Tìm chỗ đỗ xe')}
                ${this.featureButton('reservations', this.iconCalendar(), 'Đặt chỗ')}
                ${this.featureButton('session', this.iconClock(), 'Phiên gửi xe')}
                ${this.featureButton('payment', this.iconWallet(), 'Thanh toán')}
                ${this.featureButton('pricing', this.iconTag(), 'Chính sách giá')}
                ${this.featureButton('history', this.iconReceipt(), 'Lịch sử')}
                ${this.featureButton('incident', this.iconAlert(), 'Báo cáo sự cố')}
            </div>
            ${vehicles.length ? `
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconCar()} Xe của tôi</span><button class="btn btn-primary btn-sm" onclick="App.navigate('vehicles')">Quản lý xe</button></div>
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
                <div class="card-header"><span class="card-title">${this.iconCar()} Xe của tôi</span></div>
                <div class="card-body">${this.renderEmptyState(this.iconCar(), 'Chưa có phương tiện nào.')}<button class="btn btn-primary btn-full" style="margin-top:12px" onclick="App.navigate('vehicles')">Đăng ký xe ngay</button></div>
            </div>`}
        `;
    },

    renderParkingPage(f, buildings, floors, zones, vTypes) {
        return `
            <div class="page-header"><h2>Tìm chỗ đỗ xe</h2><p>Kiểm tra tình trạng chỗ trống.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconFilter()} Bộ lọc</span><button class="btn btn-outline btn-sm" onclick="window.Pages.resetParkingFilters()">Đặt lại</button></div>
                <div class="card-body">
                    <div class="form-grid">
                        <div class="form-group"><label>Tòa nhà</label><select id="filter-buildingName" onchange="window.Pages.updateParkingFilter('buildingName', this.value)"><option value="all">Tất cả</option>${[...buildings].map(b => `<option value="${b}" ${b === f.buildingName ? 'selected' : ''}>${DriverUtils.escapeHtml(b)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Tầng</label><select id="filter-floorName" onchange="window.Pages.updateParkingFilter('floorName', this.value)"><option value="all">Tất cả</option>${[...floors].map(fl => `<option value="${fl}" ${fl === f.floorName ? 'selected' : ''}>${DriverUtils.escapeHtml(fl)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Khu vực</label><select id="filter-zoneName" onchange="window.Pages.updateParkingFilter('zoneName', this.value)"><option value="all">Tất cả</option>${[...zones].map(z => `<option value="${z}" ${z === f.zoneName ? 'selected' : ''}>${DriverUtils.escapeHtml(z)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Loại xe</label><select id="filter-vehicleTypeName" onchange="window.Pages.updateParkingFilter('vehicleTypeName', this.value)"><option value="all">Tất cả</option>${[...vTypes].map(t => `<option value="${t}" ${t === f.vehicleTypeName ? 'selected' : ''}>${DriverUtils.escapeHtml(t)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Trạng thái</label><select id="filter-status" onchange="window.Pages.updateParkingFilter('status', this.value)"><option value="all">Tất cả</option><option value="AVAILABLE" ${f.status === 'AVAILABLE' ? 'selected' : ''}>Trống</option><option value="OCCUPIED" ${f.status === 'OCCUPIED' ? 'selected' : ''}>Đang sử dụng</option><option value="RESERVED" ${f.status === 'RESERVED' ? 'selected' : ''}>Đã đặt</option><option value="LOCKED" ${f.status === 'LOCKED' ? 'selected' : ''}>Khóa</option></select></div>
                        <div class="form-group"><label>Thời gian bắt đầu</label><input type="datetime-local" id="filter-startTime" value="${f.startTime || ''}" onchange="window.Pages.updateParkingFilter('startTime', this.value)"></div>
                        <div class="form-group"><label>Thời gian kết thúc</label><input type="datetime-local" id="filter-endTime" value="${f.endTime || ''}" onchange="window.Pages.updateParkingFilter('endTime', this.value)"></div>
                    </div>
                </div>
            </div>
            <div class="card" id="parking-slot-list-container">
                <div class="card-header"><span class="card-title" id="parking-slot-count">${this.iconMapPin()} Danh sách slot (0)</span></div>
                <div class="card-body" id="parking-slot-groups"></div>
            </div>
        `;
    },

    renderReservationsPage(reservableVehicles, availableSlots, defaultSlotId, recommendedSlot, defaultStart, defaultEnd, reservations) {
        return `
            <div class="page-header"><h2>Đặt chỗ</h2><p>Tạo yêu cầu đặt chỗ và theo dõi trạng thái.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconCalendar()} Tạo đặt chỗ mới</span></div>
                ${reservableVehicles.length === 0 ? `
                <div class="card-body">
                    ${this.renderEmptyState(this.iconCar(), 'Bạn chưa có phương tiện phù hợp (ô tô) để đặt chỗ trước.')}
                    <div style="margin-top: 16px; text-align: center;">
                        <button type="button" class="btn btn-primary" onclick="App.navigate('vehicles')">Đăng ký xe ngay</button>
                    </div>
                </div>
                ` : `
                <form class="card-body" onsubmit="window.Pages.createReservationSubmit(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Xe</label><select id="reservation-vehicle" required>${reservableVehicles.map(v => `<option value="${v.vehicleId}">${DriverUtils.escapeHtml(v.licensePlate)} - ${DriverUtils.escapeHtml(v.vehicleTypeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Chọn slot</label><select id="reservation-slot">${availableSlots.length === 0 ? '<option value="">Hiện chưa có slot phù hợp để đặt trước.</option>' : '<option value="">Tự động xếp chỗ</option>' + availableSlots.map(s => `<option value="${s.slotId}" ${defaultSlotId === s.slotId ? 'selected' : ''}>${DriverUtils.escapeHtml(s.slotCode)} - ${DriverUtils.escapeHtml(s.buildingName || '')} - ${DriverUtils.escapeHtml(s.floorName)} - ${DriverUtils.escapeHtml(s.zoneName)}${s.slotId === (recommendedSlot ? recommendedSlot.slotId : null) ? ' (Đề xuất)' : ''}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Giờ bắt đầu</label><input id="reservation-start" type="datetime-local" value="${defaultStart}" required></div>
                        <div class="form-group"><label>Giờ kết thúc</label><input id="reservation-end" type="datetime-local" value="${defaultEnd}" required></div>
                    </div>
                    <div class="button-row" style="margin-top:16px"><button class="btn btn-primary btn-full" type="submit" ${availableSlots.length === 0 ? 'disabled' : ''}>Đặt chỗ</button></div>
                </form>
                `}
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Danh sách đặt chỗ</span></div><div class="card-body">${reservations.map(r => this.renderReservationCard(r)).join('') || this.renderEmptyState(this.iconCalendar(), 'Không có dữ liệu đặt chỗ.')}</div></div>
        `;
    },

    renderVehiclesPage(vehicles) {
        return `
            <div class="page-header"><h2>Quản lý xe</h2><p>Thêm, sửa, xóa phương tiện của bạn.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconCar()} Xe của tôi</span><button class="btn btn-primary btn-sm" onclick="window.Pages.showVehicleModal()">Đăng ký xe</button></div>
                <div class="card-body">${vehicles.length ? vehicles.map(v => this.renderVehicleCard(v)).join('') : this.renderEmptyState(this.iconCar(), 'Chưa có phương tiện nào.')}</div>
            </div>
        `;
    },

    renderVehicleModal(vehicleId, vehicle, vehicleTypes) {
        return `
            <form onsubmit="window.Pages.saveVehicle(event, ${vehicleId || 'null'})" style="display: flex; flex-direction: column; min-height: 0; flex: 1;">
                <div class="modal-header"><h3>${vehicle ? 'Sửa xe' : 'Thêm xe'}</h3><button class="modal-close" type="button" onclick="window.Pages.closeModal()">${this.iconClose()}</button></div>
                <div class="modal-body">
                    <div id="vehicle-error" class="alert alert-error" style="display:none; color: var(--red, red); margin-bottom: 10px; padding: 10px; border-radius: 4px; background: rgba(255,0,0,0.1);"></div>
                    <div class="form-grid">
                        <div class="form-group"><label>Biển số xe <span style="color: var(--red);">*</span></label><input id="vehicle-plate" value="${DriverUtils.escapeAttr(vehicle?.licensePlate || '')}" placeholder="Vui lòng nhập biển số xe"></div>
                        <div class="form-group"><label>Loại xe <span style="color: var(--red);">*</span></label><select id="vehicle-type"><option value="">Vui lòng chọn loại xe</option>${vehicleTypes.map(t => `<option value="${t.vehicleTypeId}" ${vehicle?.vehicleTypeId === t.vehicleTypeId ? 'selected' : ''}>${DriverUtils.escapeHtml(t.typeName)}</option>`).join('')}</select></div>
                        <div class="form-group"><label>Tên chủ xe <span style="color: var(--red);">*</span></label><input id="vehicle-ownerName" value="${DriverUtils.escapeAttr(vehicle?.ownerName || '')}" placeholder="Vui lòng nhập tên chủ xe"></div>
                        <div class="form-group"><label>SĐT chủ xe <span style="color: var(--red);">*</span></label><input id="vehicle-ownerPhone" value="${DriverUtils.escapeAttr(vehicle?.ownerPhone || '')}" placeholder="Vui lòng nhập số điện thoại"></div>
                        <div class="form-group"><label>Hãng xe <span style="color: var(--red);">*</span></label><input id="vehicle-brand" value="${DriverUtils.escapeAttr(vehicle?.brand || '')}" placeholder="Vui lòng nhập hãng xe"></div>
                        <div class="form-group"><label>Màu xe <span style="color: var(--red);">*</span></label><input id="vehicle-color" value="${DriverUtils.escapeAttr(vehicle?.vehicleColor || '')}" placeholder="Vui lòng nhập màu xe"></div>
                        <div class="form-group full-width" style="margin-bottom: 0;">
                            <div class="vehicle-images-grid" style="margin-top: 0;">
                                <div>
                                    <label style="display:block; margin-bottom: 8px; font-size: .82rem; font-weight: 600; color: var(--text-secondary);">Ảnh biển số xe <span style="color: var(--red);">*</span></label>
                                    <input id="vehicle-image-file" type="file" accept="image/*" ${vehicle?.vehicleImage ? '' : 'required'} style="margin-bottom: 12px;">
                                    ${vehicle?.vehicleImage ? `<img src="${DriverUtils.escapeAttr(vehicle.vehicleImage)}" class="card-image-preview" onclick="window.Pages.showImagePreview('${DriverUtils.escapeAttr(vehicle.vehicleImage)}')" alt="Hình ảnh xe">` : `<div class="image-preview-placeholder">Chưa có hình ảnh xe</div>`}
                                </div>
                                <div>
                                    <label style="display:block; margin-bottom: 8px; font-size: .82rem; font-weight: 600; color: var(--text-secondary);">Ảnh cà vẹt xe <span style="color: var(--red);">*</span></label>
                                    <input id="vehicle-regPhoto-file" type="file" accept="image/*" ${vehicle?.registrationPhoto ? '' : 'required'} style="margin-bottom: 12px;">
                                    ${vehicle?.registrationPhoto ? `<img src="${DriverUtils.escapeAttr(vehicle.registrationPhoto)}" class="card-image-preview" onclick="window.Pages.showImagePreview('${DriverUtils.escapeAttr(vehicle.registrationPhoto)}')" alt="Cà vẹt xe">` : `<div class="image-preview-placeholder">Chưa có hình ảnh cà vẹt xe</div>`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="window.Pages.closeModal()">Hủy</button><button class="btn btn-primary" type="submit">Nộp</button></div>
            </form>
        `;
    },

    renderProfilePage(userId, fullName, email, phone, dob, address, role, status) {
        return `
            <div class="page-header"><h2>Hồ sơ cá nhân</h2><p>Thông tin tài khoản từ hệ thống.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconUser()} Thông tin cơ bản</span></div>
                <div class="card-body">
                    ${this.renderInfoRow('Mã người dùng', userId || '-')}
                    ${this.renderInfoRow('Họ tên', fullName || '-')}
                    ${this.renderInfoRow('Email', email || '-')}
                    ${this.renderInfoRow('Số điện thoại', phone || 'Chưa có thông tin')}
                    ${this.renderInfoRow('Ngày sinh', dob || 'Chưa có thông tin')}
                    ${this.renderInfoRow('Địa chỉ', address || 'Chưa có thông tin')}
                    ${this.renderInfoRow('Vai trò', role)}
                    ${this.renderInfoRow('Trạng thái tài khoản', status)}
                    
                    <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            <button class="account-edit-btn btn btn-outline" onclick="window.Pages.showEditProfileModal()">Chỉnh sửa thông tin</button>
                            <button class="account-edit-btn btn btn-outline" onclick="window.Pages.showChangePasswordModal()">Đổi mật khẩu</button>
                        </div>
                    </div>

                    <div class="button-row" style="margin-top:20px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                        <button class="btn btn-outline" style="color:var(--red);border-color:var(--red)" onclick="App.logout()">Đăng xuất</button>
                    </div>
                </div>
            </div>
        `;
    },

    renderEditProfileModal(fullName, email, phone, address, dob) {
        return `
            <div class="modal-header">
                <h3>Chỉnh sửa thông tin</h3>
                <button class="modal-close" type="button" onclick="window.Pages.closeModal()">${this.iconClose()}</button>
            </div>
            <form class="modal-body" onsubmit="window.Pages.submitEditProfile(event)">
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
                        <label>Ngày sinh</label>
                        <input id="edit-profile-dob" type="date" value="${DriverUtils.escapeAttr(dob)}">
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
                    <button type="button" class="btn btn-outline" onclick="window.Pages.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary" id="edit-profile-submit-btn">Lưu thay đổi</button>
                </div>
            </form>
        `;
    },

    renderChangePasswordModal() {
        return `
            <div class="modal-header">
                <h3>Đổi mật khẩu</h3>
                <button class="modal-close" type="button" onclick="window.Pages.closeModal()">${this.iconClose()}</button>
            </div>
            <form class="modal-body" onsubmit="window.Pages.submitChangePassword(event)">
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
                    <button type="button" class="btn btn-outline" onclick="window.Pages.closeModal()">Hủy</button>
                    <button type="submit" class="btn btn-primary" id="change-password-submit-btn">Lưu thay đổi</button>
                </div>
            </form>
        `;
    },

    renderSessionPage(activeSession) {
        return `
            <div class="page-header"><h2>Phiên gửi xe</h2><p>Chỉ xem phiên gửi xe đang hoạt động. Check-in / Check-out do nhân viên thực hiện.</p></div>
            ${activeSession ? this.renderActiveSession(activeSession) : this.renderEmptyState(this.iconClock(), 'Không có phiên gửi xe nào đang hoạt động.')}
        `;
    },

    renderActiveSession(session) {
        return `
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconClock()} Phiên đang hoạt động</span><span class="badge badge-green">Đang đỗ</span></div>
                <div class="card-body">
                    <div class="stats-grid">
                        ${this.statCard('orange', this.iconCar(), session.licensePlate, 'Biển số')}
                        ${this.statCard('blue', this.iconMapPin(), session.slotCode, 'Mã slot')}
                    </div>
                    ${this.renderInfoRow('Vị trí', `${session.zoneName || '-'}, ${session.floorName || '-'}, ${session.buildingName || '-'}`)}
                    ${this.renderInfoRow('Giờ vào', DriverUtils.formatDateTime(session.entryTime))}
                    ${this.renderInfoRow('Trạng thái', DriverUtils.statusText(session.status))}
                </div>
            </div>
        `;
    },

    renderPaymentPage() {
        return `
            <div class="page-header"><h2>Thanh toán</h2><p>Danh sách thanh toán.</p></div>
            <div class="card">
                <div class="card-body">
                    <p style="text-align:center;">Để thanh toán, vui lòng xem trong chi tiết <strong>Đặt chỗ</strong> hoặc yêu cầu nhân viên thanh toán khi <strong>Check-out</strong>. Backend chưa hỗ trợ API lấy danh sách thanh toán theo Driver.</p>
                </div>
            </div>
        `;
    },

    renderPricingPage(policies) {
        return `
            <div class="page-header"><h2>Chính sách giá</h2><p>Bảng giá dịch vụ đỗ xe hiện tại.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconTag()} Danh sách bảng giá</span></div>
                <div class="card-body" style="padding: 0; overflow-x: auto;">
                    ${policies.length === 0 ? `<div style="padding: 20px;">${this.renderEmptyState(this.iconTag(), 'Chưa có chính sách giá nào.')}</div>` : `
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

    renderHistoryPage() {
        return `
            <div class="page-header"><h2>Lịch sử gửi xe</h2><p>Lịch sử gửi xe.</p></div>
            <div class="empty-state">${this.iconReceipt()}<p>Chưa có API Lịch sử gửi xe cho Driver. Vui lòng xem ở Đặt chỗ.</p></div>
        `;
    },

    renderIncidentPage(incidents) {
        return `
            <div class="page-header"><h2>Báo cáo sự cố</h2><p>Gửi báo cáo sự cố trong bãi xe.</p></div>
            <div class="card">
                <div class="card-header"><span class="card-title">${this.iconAlert()} Tạo báo cáo</span></div>
                <form class="card-body" onsubmit="window.Pages.submitIncident(event)">
                    <div class="form-grid">
                        <div class="form-group"><label>Loại sự cố *</label><select id="incident-type" required><option value="">Chọn loại sự cố</option><option>Chỗ đỗ hư hỏng</option><option>Xe bị chắn lối</option><option>Vấn đề thanh toán</option><option>Mất vé</option><option>Điều kiện không an toàn</option><option>Khác</option></select></div>
                        <div class="form-group full-width"><label>Mô tả chi tiết *</label><textarea id="incident-description" rows="4" placeholder="Mô tả ngắn gọn sự cố" required></textarea></div>
                    </div>
                    <button class="btn btn-primary btn-full" type="submit" style="margin-top:10px;">Gửi báo cáo</button>
                </form>
            </div>
            <div class="card"><div class="card-header"><span class="card-title">Sự cố đã gửi</span></div><div class="card-body">${incidents.length ? incidents.map(i => this.renderIncidentCard(i)).join('') : this.renderEmptyState(this.iconAlert(), 'Chưa có báo cáo sự cố.')}</div></div>
        `;
    },

    renderImagePreviewModal(url) {
        return `
            <div class="image-preview-overlay show" id="image-preview-modal" onclick="this.remove()">
                <div class="image-preview-content" onclick="event.stopPropagation()">
                    <button class="image-preview-close" onclick="document.getElementById('image-preview-modal').remove()">&times;</button>
                    <img src="${DriverUtils.escapeAttr(url)}" alt="Preview">
                </div>
            </div>
        `;
    }
};

window.DriverRender = DriverRender;
