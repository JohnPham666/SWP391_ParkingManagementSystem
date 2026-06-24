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

    showImagePreview(url) {
        if (!url) return;
        const existing = document.getElementById('image-preview-modal');
        if (existing) existing.remove();
        
        document.body.insertAdjacentHTML('beforeend', DriverRender.renderImagePreviewModal(url));
        
        const escListener = (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('image-preview-modal');
                if (modal) modal.remove();
                document.removeEventListener('keydown', escListener);
            }
        };
        document.addEventListener('keydown', escListener);
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

        const activeSessionsRes = await window.Api.getMyActiveSessions();
        const activeSessions = activeSessionsRes.success ? (activeSessionsRes.data || []) : [];
        const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;

        container.innerHTML = DriverRender.renderHomePage(
            App.state.user?.fullName, occupancyRate, totalSlots, availableSlots, occupiedSlots, reservedSlots, vehicles, activeReservations, activeSession, upcomingReservation
        );
    },

    // ===============================
    // Block: Tìm Chỗ (Parking)
    // ===============================
    // Lấy danh sách toàn bộ slot trong bãi đỗ và hiển thị giao diện lọc, 
    // xem tình trạng slot để tài xế dễ dàng tìm kiếm.
    async parking(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        
        // Tận dụng API hiện có để lấy toàn bộ dữ liệu cần thiết: slots, reservations, sessions
        const [slotsRes, resRes, sesRes] = await Promise.all([
            window.Api.request('/api/slots'),
            window.Api.request('/api/reservations'),
            window.Api.request('/api/sessions')
        ]);
        
        if(!slotsRes.success) {
             container.innerHTML = `<div class="page-header"><h2>Tìm chỗ đỗ xe</h2></div>` + DriverRender.renderEmptyState(DriverRender.iconMapPin(), slotsRes.message);
             return;
        }
        
        DriverState.rawSlots = slotsRes.data || [];
        DriverState.allReservations = resRes.success ? (resRes.data || []) : [];
        DriverState.allSessions = sesRes.success ? (sesRes.data || []) : [];
        
        const f = DriverState.parkingFilters;
        
        const buildings = new Set();
        const floors = new Set();
        const zones = new Set();
        const vTypes = new Set();
        
        DriverState.rawSlots.forEach(s => {
            if(s.buildingName) buildings.add(s.buildingName);
            if(s.floorName) floors.add(s.floorName);
            if(s.zoneName) zones.add(s.zoneName);
            if(s.vehicleTypeName) vTypes.add(s.vehicleTypeName);
        });

        container.innerHTML = DriverRender.renderParkingPage(f, buildings, floors, zones, vTypes);

        // Gọi refresh lần đầu để render danh sách slot
        this.refreshParkingSlots();
    },

    updateParkingFilter(key, value) {
        // Cập nhật state bộ lọc
        DriverState.parkingFilters[key] = value;
        
        // Debounce tránh refresh liên tục
        if (window.DriverState.filterTimer) {
            clearTimeout(window.DriverState.filterTimer);
        }
        
        window.DriverState.filterTimer = setTimeout(() => {
            window.Pages.refreshParkingSlots();
        }, 300);
    },

    resetParkingFilters() {
        DriverState.parkingFilters = { buildingName: 'all', floorName: 'all', zoneName: 'all', vehicleTypeName: 'all', status: 'all', startTime: '', endTime: '' };
        
        ['buildingName', 'floorName', 'zoneName', 'vehicleTypeName', 'status'].forEach(id => {
            const el = document.getElementById('filter-' + id);
            if(el) el.value = 'all';
        });
        ['startTime', 'endTime'].forEach(id => {
            const el = document.getElementById('filter-' + id);
            if(el) el.value = '';
        });
        
        window.Pages.refreshParkingSlots();
    },

    refreshParkingSlots() {
        const container = document.getElementById('parking-slot-list-container');
        if (!container) return;

        const f = DriverState.getParkingFilters();
        let slotsToFilter = JSON.parse(JSON.stringify(DriverState.getRawSlots() || []));
        const allReservations = DriverState.getAllReservations() || [];
        const allSessions = DriverState.getAllSessions() || [];

        slotsToFilter.forEach(slot => {
            if (slot.status === 'AVAILABLE' || slot.status === 'RESERVED') {
                const isReservedSoon = DriverConditions.isSlotReservedSoon(slot.slotId, allReservations);
                if (isReservedSoon) {
                    slot.status = 'RESERVED';
                } else {
                    slot.status = 'AVAILABLE';
                }
            }
        });

        // Lọc slot theo thời gian
        if (f.startTime && f.endTime) {
            const reqStart = new Date(f.startTime).getTime();
            const reqEnd = new Date(f.endTime).getTime();

            if (reqEnd <= reqStart) {
                App.showToast('Thời gian kết thúc phải sau thời gian bắt đầu. Bỏ qua lọc thời gian.', 'error');
            } else {
                slotsToFilter = DriverUtils.filterSlotsByTime(slotsToFilter, allReservations, allSessions, f.startTime, f.endTime);
            }
        }
        
        DriverState.setSlots(slotsToFilter);

        let filtered = DriverUtils.filterSlotsByCriteria(slotsToFilter, f);
        filtered = DriverUtils.sortAndRecommendSlots(filtered);

        // Render lại danh sách slot
        const countEl = document.getElementById('parking-slot-count');
        const groupsEl = document.getElementById('parking-slot-groups');
        if (countEl) countEl.innerHTML = `${DriverRender.iconMapPin()} Danh sách slot (${filtered.length})`;
        if (groupsEl) groupsEl.innerHTML = DriverRender.renderSlotGroups(filtered);
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
            actionArea = DriverRender.renderActionButton('Đặt chỗ slot này', `window.Pages.reserveSlot(${slot.slotId})`, 'btn-primary btn-full', 'margin-bottom: 12px;');
        }

        this.openModal(`
            <div class="modal-header">
                <h3>Chi tiết Slot</h3>
                <button class="modal-close" type="button" onclick="window.Pages.closeModal()">${DriverRender.iconClose()}</button>
            </div>
            <div class="modal-body slot-detail-modal-body">
                <div class="card" style="box-shadow: none; border: 1px solid var(--border-color); margin: 0;">
                    <div class="card-body">
                        ${DriverRender.renderInfoRow('Mã slot', slot.slotCode)}
                        <div class="list-item">
                            <div class="list-info"><h4>Trạng thái</h4></div>
                            <div>${DriverRender.statusBadge(slot.status)}</div>
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
                <button type="button" class="btn btn-outline btn-full" onclick="window.Pages.closeModal()">Đóng</button>
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
        
        // Tối ưu hóa: Không gọi API lại nếu dữ liệu đã có trong state
        if (!DriverState.reservationsLoaded) {
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
            
            // Xử lý Reservation Hold Window cho toàn bộ slot trước khi xác định availableSlots (màn hình đặt chỗ)
            const processedSlots = (allSlotsRes.success ? allSlotsRes.data : []).map(slot => {
                let newSlot = {...slot};
                if (newSlot.status === 'AVAILABLE' || newSlot.status === 'RESERVED') {
                    if (DriverConditions.isSlotReservedSoon(newSlot.slotId, DriverState.reservations)) {
                        newSlot.status = 'RESERVED';
                    } else {
                        newSlot.status = 'AVAILABLE';
                    }
                }
                return newSlot;
            });
            DriverState.allSlots = processedSlots;
            DriverState.availableSlots = processedSlots.filter(s => DriverConditions.canReserveSlot(s));
            
            // Đánh dấu là đã nạp dữ liệu thành công vào state
            DriverState.reservationsLoaded = true;
        }

        const reservableVehicles = DriverState.vehicles.filter(v => DriverConditions.isReservableVehicleType(v.vehicleTypeName));
        const availableSlots = DriverState.availableSlots;
        
        // --- LUỒNG DỮ LIỆU ĐỒNG BỘ TỪ BÃI XE SANG ĐẶT CHỖ ---
        
        // 1. Đồng bộ thời gian bắt đầu / kết thúc đã chọn ở màng hình Bãi xe
        const filterStart = DriverState.parkingFilters.startTime;
        const filterEnd = DriverState.parkingFilters.endTime;
        
        const defaultStart = filterStart || DriverUtils.localDateTimeValue(new Date(Date.now() + 3600000));
        const defaultEnd = filterEnd || DriverUtils.localDateTimeValue(new Date(Date.now() + 10800000));

        // 2. Đồng bộ Slot đề xuất
        // Lấy slot đã được thuật toán đánh dấu "isRecommended" = true và có thể đặt trước
        const recommendedSlot = (DriverState.slots || []).find(s => s.isRecommended && DriverConditions.canReserveSlot(s));
        
        // Nếu người dùng chủ động click "Đặt chỗ slot này" từ Modal chi tiết (pendingReservationSlotId), thì ưu tiên chọn ID đó.
        // Ngược lại, nếu có Slot đề xuất từ bộ lọc thời gian thì tự động pre-select slot đề xuất đó.
        let defaultSlotId = DriverState.pendingReservationSlotId || (recommendedSlot ? recommendedSlot.slotId : '');

        container.innerHTML = DriverRender.renderReservationsPage(reservableVehicles, availableSlots, defaultSlotId, recommendedSlot, defaultStart, defaultEnd, DriverState.reservations);
        
        // Reset pending slot sau khi đã render form để tránh dính lại cho lần mở sau
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
        const slotIdVal = document.getElementById('reservation-slot').value;
        const startVal = document.getElementById('reservation-start').value;
        const endVal = document.getElementById('reservation-end').value;

        const vehicleId = vehicleIdVal ? Number(vehicleIdVal) : null;
        const slotId = slotIdVal ? Number(slotIdVal) : null;

        const selectedVehicle = vehicleId ? DriverState.vehicles.find(v => v.vehicleId === vehicleId) : null;
        const selectedSlot = slotId ? ((DriverState.slots || []).find(s => s.slotId === slotId) || (DriverState.availableSlots || []).find(s => s.slotId === slotId)) : null;

        const validation = DriverConditions.validateReservationInput(selectedVehicle, selectedSlot, startVal, endVal);
        if (!validation.valid) {
            App.showToast(validation.message, 'error');
            return;
        }

        const vehicleTypeId = selectedVehicle.vehicleTypeId;

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
            // Cập nhật state để tải lại dữ liệu mới nhất
            DriverState.reservationsLoaded = false;
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
            // Xóa cờ cache để bắt hệ thống fetch lại danh sách mới
            DriverState.reservationsLoaded = false;
            App.navigate('reservations');
        } else {
            App.showToast(res.message, 'error');
        }
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
        
        container.innerHTML = DriverRender.renderVehiclesPage(DriverState.vehicles);
    },

    showVehicleModal(vehicleId = null) {
        const vehicle = vehicleId ? DriverState.vehicles.find(v => v.vehicleId === vehicleId) : null;
        this.openModal(DriverRender.renderVehicleModal(vehicleId, vehicle, DriverState.vehicleTypes));
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

        const data = {
            licensePlate,
            vehicleTypeId: vehicleTypeIdVal ? Number(vehicleTypeIdVal) : null,
            ownerName,
            ownerPhone,
            brand,
            vehicleColor
        };
        
        const validation = DriverConditions.validateVehicleInput(data);
        if (!validation.valid) {
            return showError(validation.message);
        }
        
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

    showVehicleDetail(vehicleId) {
        const v = DriverState.vehicles.find(x => x.vehicleId === vehicleId);
        if(!v) return;
        
        let imagesHtml = '<div class="vehicle-images-grid">';
        
        imagesHtml += `<div><label style="display:block; margin-bottom: 8px; font-weight: 600; font-size: .85rem; color: var(--text-secondary);">Hình ảnh xe</label>`;
        if (v.vehicleImage) {
            imagesHtml += `<img src="${DriverUtils.escapeAttr(v.vehicleImage)}" class="card-image-preview" onclick="window.Pages.showImagePreview('${DriverUtils.escapeAttr(v.vehicleImage)}')" alt="Hình ảnh xe">`;
        } else {
            imagesHtml += `<div class="image-preview-placeholder">Chưa có hình ảnh xe</div>`;
        }
        imagesHtml += `</div>`;

        imagesHtml += `<div><label style="display:block; margin-bottom: 8px; font-weight: 600; font-size: .85rem; color: var(--text-secondary);">Hình ảnh cà vẹt xe</label>`;
        if (v.registrationPhoto) {
            imagesHtml += `<img src="${DriverUtils.escapeAttr(v.registrationPhoto)}" class="card-image-preview" onclick="window.Pages.showImagePreview('${DriverUtils.escapeAttr(v.registrationPhoto)}')" alt="Cà vẹt xe">`;
        } else {
            imagesHtml += `<div class="image-preview-placeholder">Chưa có hình ảnh cà vẹt xe</div>`;
        }
        imagesHtml += `</div></div>`;

        this.openModal(`
            <div class="modal-header">
                <h3>Chi tiết xe</h3>
                <button class="modal-close" type="button" onclick="window.Pages.closeModal()">${DriverRender.iconClose()}</button>
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
                        <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-color);">
                            ${imagesHtml}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-outline btn-full" onclick="window.Pages.closeModal()">Đóng</button>
            </div>
        `);
    },

    // ===============================
    // Block: Hồ Sơ Cá Nhân (Account)
    // ===============================
    // Hiển thị thông tin người dùng và hỗ trợ cập nhật thông tin cá nhân hoặc mật khẩu.
    async account(container) {
        return this.profile(container);
    },

    async profile(container) {
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
        let dob = u.dateofbirth || u.dateOfBirth || '';
        if (dob && dob.length >= 10) {
            const parts = dob.substring(0, 10).split('-');
            if (parts.length === 3) dob = `${parts[2]}/${parts[1]}/${parts[0]}`;
        }
        const address = u.address || '';
        const role = u.roleName || u.role || u.rolename || 'Driver';
        let status = u.status !== undefined ? u.status : (u.isActive !== undefined ? u.isActive : (u.isactive !== undefined ? u.isactive : '-'));
        if (status === true) status = 'Hoạt động';
        if (status === false) status = 'Đã khóa';

        container.innerHTML = DriverRender.renderProfilePage(userId, fullName, email, phone, dob, address, role, status);
    },

    showEditProfileModal() {
        const u = App.state.user || window.Api.user;
        if (!u) return;

        const fullName = u.fullname || u.fullName || '';
        const email = u.email || '';
        const phone = u.phonenumber || u.phoneNumber || '';
        const address = u.address || '';
        let dob = u.dateOfBirth || u.dateofbirth || u.dob || '';
        if (dob && dob.length >= 10) dob = dob.substring(0, 10);

        this.openModal(DriverRender.renderEditProfileModal(fullName, email, phone, address, dob));
    },

    async submitEditProfile(event) {
        event.preventDefault();
        const btn = document.getElementById('edit-profile-submit-btn');
        const err = document.getElementById('edit-profile-error');
        btn.disabled = true;
        btn.innerHTML = '<div class="btn-loader"></div>';
        err.classList.add('hidden');

        const dobValue = document.getElementById('edit-profile-dob').value;

        if (dobValue) {
            const selectedDate = new Date(dobValue);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (selectedDate > today) {
                btn.disabled = false;
                btn.innerHTML = 'Lưu thay đổi';
                err.classList.remove('hidden');
                err.textContent = 'Ngày sinh không hợp lệ.';
                return;
            }
        }

        const payload = {
            fullName: document.getElementById('edit-profile-name').value,
            phoneNumber: document.getElementById('edit-profile-phone').value,
            address: document.getElementById('edit-profile-address').value,
            email: document.getElementById('edit-profile-email').value,
            dateOfBirth: dobValue || null
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
        this.openModal(DriverRender.renderChangePasswordModal());
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
        
        const activeSessionsRes = await window.Api.getMyActiveSessions();
        const activeSessions = activeSessionsRes.success ? (activeSessionsRes.data || []) : [];
        const activeSession = activeSessions.length > 0 ? activeSessions[0] : null;

        container.innerHTML = DriverRender.renderSessionPage(activeSession);
    },



    async payment(container) {
        container.innerHTML = DriverRender.renderLoadingState();
        const res = await window.Api.getPayments();
        
        if (!res.success) {
            container.innerHTML = `<div class="page-header"><h2>Thanh toán</h2><p>Danh sách thanh toán.</p></div>` + 
                `<div class="card"><div class="card-body">` + 
                DriverRender.renderEmptyState(`<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>`, res.message) + 
                `</div></div>`;
            return;
        }

        const payments = res.data || [];
        container.innerHTML = DriverRender.renderPaymentPage(payments);
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
        
        container.innerHTML = DriverRender.renderPricingPage(policies);
    },

    async history(container) {
        container.innerHTML = DriverRender.renderHistoryPage();
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
        
        container.innerHTML = DriverRender.renderIncidentPage(DriverState.incidents);
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

};

window.Pages = Pages;
