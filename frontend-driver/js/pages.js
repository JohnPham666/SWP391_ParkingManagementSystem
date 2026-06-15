/* ===== Pages Module ===== */
const Pages = {
    /* ---------- HOME ---------- */
    async home(c) {
        const u = App.state.user;
        let vCount = 0, rCount = 0, sCount = 0;
        const [vRes, rRes, sRes] = await Promise.all([
            Api.getMyVehicles(),
            Api.getReservations(),
            Api.getMySubscriptions(u.userId)
        ]);
        if (vRes.success && vRes.data) vCount = vRes.data.length;
        if (rRes.success && rRes.data) rCount = rRes.data.filter(r => r.userId === u.userId && (r.status === 'PENDING' || r.status === 'CONFIRMED')).length;
        if (sRes.success && sRes.data) sCount = sRes.data.filter(s => s.status === 'ACTIVE').length;

        // Fetch active sessions
        let activeSessions = [];
        if (vRes.success && vRes.data) {
            const sessionPromises = vRes.data.map(v => Api.getActiveSession(v.licensePlate));
            const sessionResults = await Promise.all(sessionPromises);
            activeSessions = sessionResults.filter(r => r.success && r.data).map(r => r.data);
        }

        let html = `
            <div class="stats-grid">
                <div class="stat-card"><div class="stat-icon orange"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div><div class="stat-info"><h3>${vCount}</h3><p>Xe của tôi</p></div></div>
                <div class="stat-card"><div class="stat-icon blue"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><div class="stat-info"><h3>${rCount}</h3><p>Đặt chỗ</p></div></div>
                <div class="stat-card"><div class="stat-icon green"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg></div><div class="stat-info"><h3>${sCount}</h3><p>Vé tháng</p></div></div>
                <div class="stat-card"><div class="stat-icon red"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div><div class="stat-info"><h3>${activeSessions.length}</h3><p>Đang đỗ</p></div></div>
            </div>`;

        if (activeSessions.length > 0) {
            html += `<h3 class="section-title" style="margin-top:24px"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> Đang đỗ xe</h3>`;
            activeSessions.forEach(s => {
                html += `<div class="card" style="border-left: 4px solid var(--accent)"><div class="card-body">
                    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
                        <strong style="font-size:1.05rem">${s.licensePlate}</strong>
                        <span class="badge badge-green">Đang đỗ</span>
                    </div>
                    <div style="font-size:.8rem;color:var(--text-muted);display:grid;grid-template-columns:1fr 1fr;gap:8px">
                        <div>Vị trí: <strong>${s.slotCode || 'N/A'}</strong></div>
                        <div>Vào lúc: <strong>${new Date(s.entryTime).toLocaleTimeString('vi-VN')}</strong></div>
                        <div style="grid-column:1/-1">Cổng vào: ${s.entryGate || '-'}</div>
                    </div>
                </div></div>`;
            });
        }

        html += `
            <h3 class="section-title" style="margin-top:24px">Chức năng</h3>
            <div class="feature-grid">
                <button class="feature-card" onclick="App.navigate('parking')"><div class="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg></div><span>Xem bãi xe</span></button>
                <button class="feature-card" onclick="App.navigate('reservations')"><div class="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div><span>Đặt chỗ</span></button>
                <button class="feature-card" onclick="App.navigate('vehicles')"><div class="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div><span>Xe của tôi</span></button>
                <button class="feature-card" onclick="App.navigate('account')"><div class="feature-card-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div><span>Tài khoản</span></button>
            </div>`;
        c.innerHTML = html;
    },

    /* ---------- PARKING MAP ---------- */
    async parking(c) {
        const res = await Api.getDashboard();
        if (!res.success) { c.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`; return; }
        const d = res.data, sum = d.summary;
        let html = `
            <div class="card"><div class="card-body">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
                    <span style="font-weight:700">Tỷ lệ lấp đầy</span>
                    <span class="badge ${sum.occupancyRate<50?'badge-green':sum.occupancyRate<80?'badge-yellow':'badge-red'}">${sum.occupancyRate.toFixed(1)}%</span>
                </div>
                <div class="occupancy-bar"><div class="occupancy-fill ${sum.occupancyRate<50?'low':sum.occupancyRate<80?'mid':'high'}" style="width:${sum.occupancyRate}%"></div></div>
                <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:.75rem;color:var(--text-muted)"><span>Trống: ${sum.availableSlots}</span><span>Đang đỗ: ${sum.occupiedSlots}</span><span>Tổng: ${sum.totalSlots}</span></div>
            </div></div>`;
        if (d.buildings) {
            d.buildings.forEach(b => {
                html += `<div class="card"><div class="card-header"><span class="card-title">${b.buildingName}</span><span class="badge badge-green">Trống: ${b.summary.availableSlots}</span></div><div class="card-body">`;
                b.floors.forEach(f => {
                    html += `<div style="margin-bottom:16px"><h4 style="font-size:.85rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px">${f.floorName}</h4>`;
                    f.zones.forEach(z => {
                        html += `<div style="margin-bottom:12px;background:var(--bg-page);padding:12px;border-radius:var(--radius-sm)">
                            <div style="display:flex;justify-content:space-between;margin-bottom:8px"><span style="font-size:.8rem;font-weight:600">${z.zoneName} <span style="font-weight:400;color:var(--text-muted)">${z.description||''}</span></span><span class="badge badge-gray">Trống: ${z.summary.availableSlots}</span></div>
                            <div class="slot-grid">`;
                        z.slots.forEach(s => {
                            html += `<div class="slot-cell ${s.status.toLowerCase()}">${s.slotCode}<small>${s.status==='AVAILABLE'?'Trống':s.status==='OCCUPIED'?'Đã đỗ':s.status==='RESERVED'?'Đã đặt':'Khóa'}</small></div>`;
                        });
                        html += `</div></div>`;
                    });
                    html += `</div>`;
                });
                html += `</div></div>`;
            });
        }
        c.innerHTML = html;
    },

    /* ---------- VEHICLES ---------- */
    async vehicles(c) {
        const [vRes, vtRes] = await Promise.all([Api.getMyVehicles(), Api.getVehicleTypes()]);
        let vehicles = (vRes.success && vRes.data) ? vRes.data : [];
        let vtypes = (vtRes.success && vtRes.data) ? vtRes.data : [];

        let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 class="section-title" style="margin:0">Xe của tôi (${vehicles.length})</h3><button class="btn btn-primary btn-sm" onclick="Pages.showAddVehicle()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Thêm xe</button></div>`;

        if (vehicles.length === 0) {
            html += `<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg><p>Bạn chưa đăng ký xe nào</p></div>`;
        } else {
            vehicles.forEach(v => {
                html += `<div class="vehicle-card">
                    <div class="vehicle-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div>
                    <div class="vehicle-details">
                        <div class="vehicle-plate">${v.licensePlate}</div>
                        <div class="vehicle-meta">${v.vehicleTypeName||'-'} • ${v.brand||''} • ${v.vehicleColor||''}</div>
                        <div class="vehicle-actions">
                            <button class="btn btn-outline btn-sm" onclick="Pages.editVehicle(${v.vehicleId})">Sửa</button>
                            <button class="btn btn-outline btn-sm" style="color:var(--red);border-color:var(--red)" onclick="Pages.delVehicle(${v.vehicleId})">Xóa</button>
                        </div>
                    </div>
                </div>`;
            });
        }
        // Store vtypes globally for modal
        window._vtypes = vtypes;
        c.innerHTML = html;
    },

    showAddVehicle() {
        const vtypes = window._vtypes || [];
        const opts = vtypes.map(t => `<option value="${t.vehicleTypeId}">${t.typeName}</option>`).join('');
        const modal = document.createElement('div');
        modal.id = 'vehicle-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>Thêm xe mới</h3><button class="modal-close" onclick="document.getElementById('vehicle-modal').remove()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
        <form id="add-vehicle-form"><div class="modal-body"><div class="form-grid">
            <div class="form-group full-width"><label>Biển số xe *</label><input id="v-plate" required placeholder="VD: 51A-12345"/></div>
            <div class="form-group"><label>Loại xe *</label><select id="v-type" required>${opts}</select></div>
            <div class="form-group"><label>Hãng xe</label><input id="v-brand" placeholder="Toyota"/></div>
            <div class="form-group"><label>Màu xe</label><input id="v-color" placeholder="Trắng"/></div>
            <div class="form-group"><label>Năm SX</label><input id="v-year" type="number" placeholder="2023"/></div>
        </div></div>
        <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('vehicle-modal').remove()">Hủy</button><button type="submit" class="btn btn-primary">Đăng ký</button></div></form></div>`;
        document.body.appendChild(modal);
        document.getElementById('add-vehicle-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                licensePlate: document.getElementById('v-plate').value,
                vehicleTypeId: parseInt(document.getElementById('v-type').value),
                brand: document.getElementById('v-brand').value,
                vehicleColor: document.getElementById('v-color').value,
                manufactureYear: document.getElementById('v-year').value ? parseInt(document.getElementById('v-year').value) : null
            };
            const r = await Api.createMyVehicle(payload);
            if (r.success) { App.showToast('Thêm xe thành công!','success'); document.getElementById('vehicle-modal').remove(); App.navigate('vehicles'); }
            else App.showToast(r.message||'Lỗi','error');
        });
    },

    async delVehicle(id) {
        if (!confirm('Bạn có chắc muốn xóa xe này?')) return;
        const r = await Api.deleteMyVehicle(id);
        if (r.success) { App.showToast('Đã xóa xe','success'); App.navigate('vehicles'); }
        else App.showToast(r.message||'Lỗi xóa xe','error');
    },

    async editVehicle(id) {
        App.showToast('Tính năng sửa xe đang phát triển', 'info');
    },

    /* ---------- RESERVATIONS ---------- */
    async reservations(c) {
        const u = App.state.user;
        const [rRes, vRes, vtRes] = await Promise.all([
            Api.getReservations(), Api.getMyVehicles(), Api.getVehicleTypes()
        ]);
        let reservations = (rRes.success && rRes.data) ? rRes.data.filter(r => r.userId === u.userId) : [];
        let vehicles = (vRes.success && vRes.data) ? vRes.data : [];
        let vtypes = (vtRes.success && vtRes.data) ? vtRes.data : [];
        window._myVehicles = vehicles;
        window._vtypes = vtypes;

        let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h3 class="section-title" style="margin:0">Đặt chỗ của tôi</h3><button class="btn btn-primary btn-sm" onclick="Pages.showBooking()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Đặt mới</button></div>`;

        if (reservations.length === 0) {
            html += `<div class="empty-state"><p>Bạn chưa có đặt chỗ nào</p></div>`;
        } else {
            reservations.forEach(r => {
                let badge = '';
                switch(r.status) {
                    case 'PENDING': badge='<span class="badge badge-yellow">Chờ xác nhận</span>'; break;
                    case 'CONFIRMED': badge='<span class="badge badge-green">Đã xác nhận</span>'; break;
                    case 'CANCELLED': badge='<span class="badge badge-red">Đã hủy</span>'; break;
                    case 'EXPIRED': badge='<span class="badge badge-gray">Hết hạn</span>'; break;
                    default: badge=`<span class="badge badge-gray">${r.status}</span>`;
                }
                const canCancel = r.status === 'PENDING' || r.status === 'CONFIRMED';
                html += `<div class="card"><div class="card-body">
                    <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px"><strong>#${r.reservationId} - ${r.licensePlate||'-'}</strong>${badge}</div>
                    <div style="font-size:.8rem;color:var(--text-muted)">
                        <div>Chỗ: <strong>${r.slotCode||'Tự động'}</strong> • Loại: ${r.vehicleTypeName||'-'}</div>
                        <div>Từ: ${new Date(r.reservationStart).toLocaleString('vi-VN')}</div>
                        <div>Đến: ${new Date(r.reservationEnd).toLocaleString('vi-VN')}</div>
                    </div>
                    ${canCancel ? `<button class="btn btn-outline btn-sm" style="margin-top:8px;color:var(--red);border-color:var(--red)" onclick="Pages.cancelRes(${r.reservationId})">Hủy đặt chỗ</button>` : ''}
                </div></div>`;
            });
        }
        c.innerHTML = html;
    },

    async showBooking() {
        const vehicles = window._myVehicles || [];
        const vtypes = window._vtypes || [];
        if (vehicles.length === 0) { App.showToast('Bạn cần đăng ký xe trước khi đặt chỗ','info'); return; }
        const vOpts = vehicles.map(v => `<option value="${v.vehicleId}" data-vtype="${v.vehicleTypeId}">${v.licensePlate} (${v.vehicleTypeName||''})</option>`).join('');
        const now = new Date(); now.setMinutes(now.getMinutes()+30);
        const later = new Date(now); later.setHours(later.getHours()+4);
        const fmt = d => d.toISOString().slice(0,16);

        const modal = document.createElement('div');
        modal.id = 'booking-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `<div class="modal"><div class="modal-header"><h3>Đặt chỗ mới</h3><button class="modal-close" onclick="document.getElementById('booking-modal').remove()"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
        <form id="booking-form"><div class="modal-body"><div class="form-grid">
            <div class="form-group full-width"><label>Chọn xe *</label><select id="bk-vehicle" required>${vOpts}</select></div>
            <div class="form-group"><label>Bắt đầu *</label><input type="datetime-local" id="bk-start" value="${fmt(now)}" required/></div>
            <div class="form-group"><label>Kết thúc *</label><input type="datetime-local" id="bk-end" value="${fmt(later)}" required/></div>
        </div></div>
        <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('booking-modal').remove()">Hủy</button><button type="submit" class="btn btn-primary">Đặt chỗ</button></div></form></div>`;
        document.body.appendChild(modal);

        document.getElementById('booking-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const sel = document.getElementById('bk-vehicle');
            const vId = parseInt(sel.value);
            const vtId = parseInt(sel.options[sel.selectedIndex].dataset.vtype);
            const payload = {
                userId: App.state.user.userId,
                vehicleId: vId,
                vehicleTypeId: vtId,
                reservationStart: document.getElementById('bk-start').value,
                reservationEnd: document.getElementById('bk-end').value
            };
            const r = await Api.createReservation(payload);
            if (r.success) { App.showToast('Đặt chỗ thành công!','success'); document.getElementById('booking-modal').remove(); App.navigate('reservations'); }
            else App.showToast(r.message||'Lỗi đặt chỗ','error');
        });
    },

    async cancelRes(id) {
        if (!confirm('Bạn có chắc muốn hủy đặt chỗ này?')) return;
        const r = await Api.cancelReservation(id);
        if (r.success) { App.showToast('Đã hủy đặt chỗ','success'); App.navigate('reservations'); }
        else App.showToast(r.message||'Lỗi hủy','error');
    },

    /* ---------- ACCOUNT ---------- */
    async account(c) {
        const u = App.state.user;
        const sRes = await Api.getMySubscriptions(u.userId);
        let subs = (sRes.success && sRes.data) ? sRes.data : [];

        let html = `
            <div class="card"><div class="card-body" style="display:flex;align-items:center;gap:16px">
                <div style="width:56px;height:56px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-dark));display:flex;align-items:center;justify-content:center;color:#fff;font-size:1.5rem;font-weight:800;flex-shrink:0">${u.fullName.charAt(0).toUpperCase()}</div>
                <div><h3 style="font-size:1.1rem;font-weight:700">${u.fullName}</h3><p style="font-size:.8rem;color:var(--text-muted)">${u.email}</p><span class="badge badge-orange">Driver</span></div>
            </div></div>

            <h3 class="section-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Vé tháng của tôi</h3>`;

        if (subs.length === 0) {
            html += `<div class="card"><div class="card-body"><p style="color:var(--text-muted);text-align:center;font-size:.85rem">Chưa có vé tháng nào</p></div></div>`;
        } else {
            subs.forEach(s => {
                let badge = '';
                switch(s.status) {
                    case 'ACTIVE': badge='<span class="badge badge-green">Đang hoạt động</span>'; break;
                    case 'EXPIRED': badge='<span class="badge badge-red">Hết hạn</span>'; break;
                    case 'CANCELLED': badge='<span class="badge badge-gray">Đã hủy</span>'; break;
                    default: badge=`<span class="badge badge-gray">${s.status}</span>`;
                }
                html += `<div class="card"><div class="card-body">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px"><strong>${s.licensePlate||'-'}</strong>${badge}</div>
                    <div style="font-size:.78rem;color:var(--text-muted)">
                        <div>Từ: ${s.startDate ? new Date(s.startDate).toLocaleDateString('vi-VN') : '-'} → ${s.endDate ? new Date(s.endDate).toLocaleDateString('vi-VN') : '-'}</div>
                        <div>Phí: <strong style="color:var(--accent)">${s.monthlyFee ? s.monthlyFee.toLocaleString('vi-VN') + 'đ' : '-'}</strong></div>
                    </div>
                </div></div>`;
            });
        }

        html += `<div style="margin-top:24px"><button class="btn btn-outline btn-full" style="color:var(--red);border-color:var(--red)" onclick="App.logout()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> Đăng xuất</button></div>`;
        c.innerHTML = html;
    }
};
