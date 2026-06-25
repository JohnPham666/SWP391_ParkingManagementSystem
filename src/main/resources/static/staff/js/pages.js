/* ===== Pages Modules ===== */

// Pages: �?i tu?ng ch?a logic v? giao di?n (Render HTML) v� x? l� lu?ng d? li?u cho t?ng module ch?c nang c? th?.
// M?i h�m tuong ?ng v?i m?t m�n h�nh tr�n ph?n m?m (Dashboard, �?t ch?, Phi�n g?i xe, v.v.)
const Pages = {
    // ==========================================
    // 1. DASHBOARD: Th?ng k� t?ng quan b�i xe, t? l? l?p d?y, check-in/out nhanh
    // ==========================================
    async renderDashboard(container) {
        const res = await Api.getDashboard();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }
        
        // Fetch reservations to calculate pending arrivals (CONFIRMED but not checked in)
        const resReservations = await Api.getReservations();
        let pendingArrivals = 0;
        if (resReservations.success && resReservations.data) {
            pendingArrivals = resReservations.data.filter(r => r.status === 'CONFIRMED').length;
        }
        
        const data = res.data;
        const sum = data.summary;
        const rate = sum.occupancyRate || 0;
        const circumference = 2 * Math.PI * 46;
        const offset = circumference - (rate / 100) * circumference;
        const gaugeColor = rate < 50 ? '#10b981' : (rate < 80 ? '#f59e0b' : '#ef4444');
        const unusedSlots = sum.totalCapacity - sum.currentOccupancy - sum.reservedSlots;
        
        let html = `
            <!-- ===== HERO ACTION BUTTONS ===== -->
            <div class="dash-actions">
                <button class="dash-action-btn checkin" id="dash-checkin-btn">
                    <div class="action-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                    </div>
                    <div class="action-label">Check-in Vãng lai</div>
                    <div class="action-desc">Xe vào không đặt trước</div>
                </button>
                <button class="dash-action-btn checkout" id="dash-checkout-btn">
                    <div class="action-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
                    </div>
                    <div class="action-label">Check-out</div>
                    <div class="action-desc">Thanh toán & trả xe</div>
                </button>
                <button class="dash-action-btn res-checkin" id="dash-res-checkin-btn">
                    <div class="action-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>
                    </div>
                    <div class="action-label">Check-in Đặt chỗ</div>
                    <div class="action-desc">Xe vào theo lượt đặt</div>
                </button>
            </div>

            <!-- ===== DASHBOARD MAIN STATS ROW ===== -->
            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 24px;">
                
                <!-- COMPREHENSIVE OCCUPANCY CARD -->
                <div class="dash-occupancy-card" style="margin-bottom: 0;">
                    <div class="occupancy-gauge" style="width: 160px; height: 160px;">
                        <svg viewBox="0 0 160 160" style="width: 160px; height: 160px;">
                            <circle class="gauge-bg" cx="80" cy="80" r="64" stroke-width="12"/>
                            <circle class="gauge-fill" cx="80" cy="80" r="64" stroke-width="12" stroke="${gaugeColor}" stroke-dasharray="${2 * Math.PI * 64}" stroke-dashoffset="${(2 * Math.PI * 64) - (rate / 100) * (2 * Math.PI * 64)}"/>
                        </svg>
                        <div class="gauge-text">
                            <span class="gauge-percent" style="font-size: 2rem;">${rate.toFixed(1)}%</span>
                            <span class="gauge-label" style="font-size: 0.85rem;">Tỷ lệ lấp đầy</span>
                        </div>
                    </div>
                    <div class="occupancy-details">
                        <h3 style="font-size: 1.2rem; margin-bottom: 16px;">Tỷ lệ lấp đầy & Hiện trạng bãi xe</h3>
                        
                        <div class="occupancy-detail-row" style="background: rgba(14,165,233,.08); border-radius: 8px; padding: 12px 16px; margin-bottom: 12px; border: 1px solid rgba(14,165,233,.2);">
                            <div class="occupancy-dot" style="background:#0ea5e9; width: 12px; height: 12px;"></div>
                            <span style="font-weight:700; color:var(--text-primary); font-size: 0.95rem;">Tổng số chỗ (Sức chứa)</span>
                            <strong style="color:#0ea5e9; font-size:1.3rem;">${sum.totalCapacity}</strong>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div class="occupancy-detail-row" style="background: var(--bg-page); border-radius: 6px; padding: 10px 14px;"><div class="occupancy-dot green"></div><span style="font-weight:600;">Chỗ trống</span><strong style="font-size:1.1rem;">${sum.availableCapacity}</strong></div>
                            <div class="occupancy-detail-row" style="background: var(--bg-page); border-radius: 6px; padding: 10px 14px;"><div class="occupancy-dot orange"></div><span style="font-weight:600;">Đang đỗ</span><strong style="font-size:1.1rem;">${sum.currentOccupancy}</strong></div>
                            <div class="occupancy-detail-row" style="background: var(--bg-page); border-radius: 6px; padding: 10px 14px;"><div class="occupancy-dot yellow"></div><span style="font-weight:600;">Đã đặt trước</span><strong style="font-size:1.1rem;">${sum.reservedSlots}</strong></div>
                            <div class="occupancy-detail-row" style="background: var(--bg-page); border-radius: 6px; padding: 10px 14px;"><div class="occupancy-dot gray"></div><span style="font-weight:600;">Còn trống (chưa đặt)</span><strong style="font-size:1.1rem;">${unusedSlots > 0 ? unusedSlots : 0}</strong></div>
                        </div>
                    </div>
                </div>

                <!-- RESERVATION SUMMARY CARD -->
                <div class="dash-occupancy-card" style="margin-bottom: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: linear-gradient(135deg, #4f46e5, #6366f1); color: white; border: none;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.9;"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4"/></svg>
                    <h3 style="color: white; font-size: 1.2rem; margin-bottom: 8px;">Reservation</h3>
                    <p style="font-size: 0.85rem; opacity: 0.8; margin-bottom: 16px; max-width: 80%;">Khách đã đặt chỗ nhưng chưa Check-in</p>
                    <strong style="font-size: 3.5rem; line-height: 1; font-weight: 800;">${pendingArrivals}</strong>
                </div>

            </div>
        `;

        // Buildings
        if (data.buildings && data.buildings.length > 0) {
            html += `<div class="dash-buildings-grid">`;
            data.buildings.forEach(b => {
                html += `<div class="dash-building-card">
                    <div class="dash-building-header">
                        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"/></svg>${b.buildingName}</h3>
                        <span class="building-badge">${b.summary.currentOccupancy} / ${b.summary.totalCapacity} chỗ</span>
                    </div>
                    <div class="dash-building-body">`;
                b.floors.forEach(f => {
                    html += `<div class="dash-floor-section">
                        <div class="dash-floor-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20M4 20V8l8-5 8 5v12"/></svg>${f.floorName}</div>`;
                    f.zones.forEach(z => {
                        html += `<div class="dash-zone-box">
                            <div class="dash-zone-header">
                                <h5>${z.zoneName} <span>(${z.description})</span></h5>
                                <span class="dash-zone-badge">${z.summary.currentOccupancy} / ${z.summary.totalCapacity}</span>
                            </div>
                            <div class="slot-grid">`;
                        z.slots.forEach(s => {
                            html += `<div class="slot-cell ${s.status.toLowerCase()}" title="${s.vehicleTypeName}">${s.slotCode}<small>${s.status}</small></div>`;
                        });
                        html += `</div></div>`;
                    });
                    html += `</div>`;
                });
                html += `</div></div>`;
            });
            html += `</div>`;
        }

        // Modals
        html += `
            <div id="dash-walkin-modal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header"><h3>Check-in Khách Vãng Lai</h3><button class="modal-close" onclick="document.getElementById('dash-walkin-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
                    <form id="dash-walkin-form">
                        <div class="modal-body form-grid">
                            <div class="form-group full-width"><label>Biển số xe *</label><input type="text" id="dash-walkin-plate" required /></div>
                            <div class="form-group"><label>Loại xe *</label><select id="dash-walkin-type" required></select></div>
                            <div class="form-group"><label>Cổng vào</label><select id="dash-walkin-gate"><option value="Gate A">Cổng A</option><option value="Gate B">Cổng B</option><option value="Gate C">Cổng C</option><option value="Gate D">Cổng D</option></select></div>
                        </div>
                        <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('dash-walkin-modal').classList.add('hidden')">Hủy</button><button type="submit" class="btn btn-primary">Check-in</button></div>
                    </form>
                </div>
            </div>
            <div id="dash-checkout-modal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header"><h3>Check-out</h3><button class="modal-close" onclick="document.getElementById('dash-checkout-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
                    <form id="dash-checkout-form">
                        <div class="modal-body form-grid">
                            <div class="form-group full-width"><label>Phiên gửi xe ID *</label><input type="number" id="dash-checkout-session-id" required /></div>
                            <div class="form-group full-width"><label>Cổng ra</label><select id="dash-checkout-gate"><option value="Gate A">Cổng A</option><option value="Gate B">Cổng B</option><option value="Gate C">Cổng C</option><option value="Gate D">Cổng D</option></select></div>
                            <div class="form-group full-width"><label>Phương thức thanh toán</label><select id="dash-checkout-payment"><option value="CASH">Tiền mặt</option><option value="BANK_TRANSFER">Chuyển khoản</option><option value="E_WALLET">Ví điện tử</option></select></div>
                        </div>
                        <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('dash-checkout-modal').classList.add('hidden')">Hủy</button><button type="submit" class="btn btn-success">Check-out</button></div>
                    </form>
                </div>
            </div>
            <div id="dash-res-checkin-modal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header"><h3>Check-in Đặt Chỗ</h3><button class="modal-close" onclick="document.getElementById('dash-res-checkin-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button></div>
                    <form id="dash-res-checkin-form">
                        <div class="modal-body form-grid">
                            <div class="form-group full-width"><label>Mã Đặt Chỗ (Reservation ID) *</label><input type="number" id="dash-res-checkin-id" required /></div>
                            <div class="form-group full-width"><label>Cổng vào</label><select id="dash-res-checkin-gate"><option value="Gate A">Cổng A</option><option value="Gate B">Cổng B</option><option value="Gate C">Cổng C</option><option value="Gate D">Cổng D</option></select></div>
                        </div>
                        <div class="modal-footer"><button type="button" class="btn btn-outline" onclick="document.getElementById('dash-res-checkin-modal').classList.add('hidden')">Hủy</button><button type="submit" class="btn btn-primary" style="background:linear-gradient(135deg,#6366f1,#4f46e5);border:none;">Check-in</button></div>
                    </form>
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Wire up action buttons
        document.getElementById('dash-checkin-btn').addEventListener('click', () => document.getElementById('dash-walkin-modal').classList.remove('hidden'));
        document.getElementById('dash-checkout-btn').addEventListener('click', () => document.getElementById('dash-checkout-modal').classList.remove('hidden'));
        document.getElementById('dash-res-checkin-btn').addEventListener('click', () => document.getElementById('dash-res-checkin-modal').classList.remove('hidden'));

        // Populate vehicle types
        const typeSelect = document.getElementById('dash-walkin-type');
        const vtRes = await Api.getVehicleTypes();
        if (vtRes.success && vtRes.data) {
            vtRes.data.forEach(t => { const o = document.createElement('option'); o.value = t.vehicleTypeId; o.textContent = t.typeName; typeSelect.appendChild(o); });
        }

        // Walk-in form
        document.getElementById('dash-walkin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = { licensePlate: document.getElementById('dash-walkin-plate').value, vehicleTypeId: parseInt(document.getElementById('dash-walkin-type').value), entryGate: document.getElementById('dash-walkin-gate').value };
            const r = await Api.walkIn(payload);
            if (r.success) { App.showToast('Check-in vãng lai thành công', 'success'); document.getElementById('dash-walkin-modal').classList.add('hidden'); App.renderPage('dashboard'); }
            else { App.showToast(r.message, 'error'); }
        });

        // Checkout form
        document.getElementById('dash-checkout-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const sessionId = document.getElementById('dash-checkout-session-id').value;
            const paymentMethod = document.getElementById('dash-checkout-payment').value;
            const paymentPayload = { sessionId: parseInt(sessionId), paymentMethod };
            const pRes = await Api.createPayment(paymentPayload);
            if (!pRes.success && pRes.message && !pRes.message.includes('already has a PENDING payment')) { App.showToast(pRes.message || 'Lỗi tạo thanh toán', 'error'); return; }
            let paymentId = pRes.data ? pRes.data.paymentId : null;
            if (!paymentId && pRes.message && pRes.message.includes('Payment ID:')) { const m = pRes.message.match(/Payment ID:\s*(\d+)/); if (m) paymentId = parseInt(m[1], 10); }
            if (!paymentId) { App.showToast('Không lấy được ID thanh toán.', 'error'); return; }
            if (paymentMethod === 'CASH') {
                const cRes = await Api.confirmCash(paymentId);
                if (cRes.success) { App.showToast('Đã thu tiền mặt và check-out thành công!', 'success'); document.getElementById('dash-checkout-modal').classList.add('hidden'); App.renderPage('dashboard'); }
                else { App.showToast(cRes.message || 'Lỗi xác nhận tiền mặt', 'error'); }
            } else {
                const vnRes = await Api.createVnPayUrl(paymentId);
                if (vnRes.success && vnRes.data && vnRes.data.paymentUrl) { window.open(vnRes.data.paymentUrl, '_blank'); App.showToast('Đã mở cổng thanh toán VNPay.', 'info'); document.getElementById('dash-checkout-modal').classList.add('hidden'); App.renderPage('dashboard'); }
                else { App.showToast(vnRes.message || 'Lỗi tạo link VNPay', 'error'); }
            }
        });

        // Reservation check-in form
        document.getElementById('dash-res-checkin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = { reservationId: parseInt(document.getElementById('dash-res-checkin-id').value), entryGate: document.getElementById('dash-res-checkin-gate').value };
            const r = await Api.checkIn(payload);
            if (r.success) { App.showToast('Check-in đặt chỗ thành công', 'success'); document.getElementById('dash-res-checkin-modal').classList.add('hidden'); App.renderPage('dashboard'); }
            else { App.showToast(r.message || 'Lỗi khi check-in', 'error'); }
        });
    },
    // ==========================================
    // 2. PHI�N G?I XE: Qu?n l� c�c xe dang d?u trong b�i v� l?ch s? ra v�o
    // ==========================================
    async renderSessions(container) {
        const res = await Api.getSessions();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }

        const data = res.data;
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách phiên gửi xe</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="session-search" class="search-input" placeholder="Tìm biển số xe..." style="flex: 1;" />
                        <select id="session-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PARKING">Đang đỗ</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="UNPAID">Chưa thanh toán</option>
                            <option value="LOST_TICKET">Mất vé</option>
                        </select>
                        <select id="session-time-sort" class="search-input" style="width: auto;">
                            <option value="desc">Mới nhất -> Cũ nhất</option>
                            <option value="asc">Cũ nhất -> Mới nhất</option>
                        </select>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Biển số</th>
                                <th>Chỗ đỗ</th>
                                <th>Loại xe</th>
                                <th>Giờ vào</th>
                                <th>Cổng vào</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody id="sessions-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="sessions-pagination" style="padding: 0 20px;"></div>
            </div>
            
            <!-- Session Detail Modal -->
            <div id="session-detail-modal" class="modal-overlay hidden">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Chi tiết phiên gửi xe #<span id="sd-id"></span></h3>
                        <button class="modal-close" onclick="document.getElementById('session-detail-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                    <div class="modal-body" style="line-height: 1.8; font-size: 0.95rem;">
                        <div id="sd-content">Đang tải...</div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="document.getElementById('session-detail-modal').classList.add('hidden')">Đóng</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('sessions-tbody');
            if(!tbody) return;
            
            // Sort
            const sortVal = document.getElementById('session-time-sort').value;
            currentData.sort((a, b) => {
                const timeA = a.entryTime ? new Date(a.entryTime).getTime() : 0;
                const timeB = b.entryTime ? new Date(b.entryTime).getTime() : 0;
                return sortVal === 'desc' ? timeB - timeA : timeA - timeB;
            });
            
            // Filter
            const textVal = document.getElementById('session-search').value.toLowerCase();
            const statusVal = document.getElementById('session-status-filter').value;
            
            const filteredData = currentData.filter(s => {
                const plate = (s.licensePlate || '').toLowerCase();
                const matchText = plate.includes(textVal);
                const matchStatus = statusVal === '' || s.status === statusVal;
                return matchText && matchStatus;
            });
            
            // Paginate
            const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(s => {
                let statusBadge = '';
                switch(s.status) {
                    case 'PARKING': statusBadge = '<span class="badge badge-blue">Đang đỗ</span>'; break;
                    case 'COMPLETED': statusBadge = '<span class="badge badge-green">Hoàn thành</span>'; break;
                    case 'UNPAID': statusBadge = '<span class="badge badge-yellow">Chưa thanh toán</span>'; break;
                    case 'LOST_TICKET': statusBadge = '<span class="badge badge-red">Mất vé</span>'; break;
                    default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
                }
                tbodyHtml += `
                    <tr onclick="window.showSessionDetail(${s.sessionId})" style="cursor: pointer;" class="hoverable-row">
                        <td style="color: var(--blue); font-weight: 700;">#${s.sessionId}</td>
                        <td style="font-weight:600">${s.licensePlate || '-'}</td>
                        <td>${s.slotCode || '-'}</td>
                        <td>${s.vehicleTypeName || '-'}</td>
                        <td>${s.entryTime ? new Date(s.entryTime).toLocaleString('vi-VN') : '-'}</td>
                        <td>${s.entryGate || '-'}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('sessions-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.sessionsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.sessionsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.sessionsChangePage = (p) => { currentPage = p; renderTableBody(); };

        document.getElementById('session-search').addEventListener('input', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('session-status-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('session-time-sort').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        
        renderTableBody();

        window.showSessionDetail = async (id) => {
            const modal = document.getElementById('session-detail-modal');
            const content = document.getElementById('sd-content');
            document.getElementById('sd-id').textContent = id;
            content.innerHTML = '<div style="text-align:center; padding: 20px;">Đang tải dữ liệu...</div>';
            modal.classList.remove('hidden');

            const res = await Api.getSession(id);
            if (!res.success) {
                content.innerHTML = `<p style="color: var(--red);">${res.message || 'Lỗi tải dữ liệu'}</p>`;
                return;
            }
            
            const s = res.data;
            
            let statusBadge = '';
            switch(s.status) {
                case 'PARKING': statusBadge = '<span class="badge badge-blue">Đang đỗ</span>'; break;
                case 'COMPLETED': statusBadge = '<span class="badge badge-green">Hoàn thành</span>'; break;
                case 'UNPAID': statusBadge = '<span class="badge badge-yellow">Chưa thanh toán</span>'; break;
                case 'LOST_TICKET': statusBadge = '<span class="badge badge-red">Mất vé</span>'; break;
                default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
            }

            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><strong>Biển số xe:</strong> ${s.licensePlate || '-'}</div>
                    <div><strong>Trạng thái:</strong> ${statusBadge}</div>
                    
                    <div><strong>Chỗ đỗ:</strong> ${s.slotCode || '-'}</div>
                    <div><strong>Loại xe:</strong> ${s.vehicleTypeName || '-'}</div>
                    
                    <div><strong>Khách hàng:</strong> ${s.customerName || '-'}</div>
                    <div><strong>Số điện thoại:</strong> ${s.customerPhone || '-'}</div>
                    
                    <div><strong>Giờ vào:</strong> ${s.entryTime ? new Date(s.entryTime).toLocaleString('vi-VN') : '-'}</div>
                    <div><strong>Cổng vào:</strong> ${s.entryGate || '-'}</div>
                    
                    <div><strong>Giờ ra:</strong> ${s.exitTime ? new Date(s.exitTime).toLocaleString('vi-VN') : '-'}</div>
                    <div><strong>Cổng ra:</strong> ${s.exitGate || '-'}</div>
                    
                    <div><strong>Phí dự kiến:</strong> <span style="color:var(--orange); font-weight:600;">${s.estimatedFee != null ? s.estimatedFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
                    <div><strong>Phí thực tế:</strong> <span style="color:var(--green); font-weight:700;">${s.finalFee != null ? s.finalFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
                </div>
            `;
        };
    },
    // ==========================================
    // 3. CH? �? XE: Qu?n l� danh s�ch c�c � d?u xe, tr?ng th�i tr?ng/d?y/d� d?t
    // ==========================================
    async renderSlots(container) {
        const res = await Api.getSlots();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }

        const data = res.data;
        const zones = [...new Set(data.map(s => s.zoneName).filter(Boolean))];
        const vTypes = [...new Set(data.map(s => s.vehicleTypeName).filter(Boolean))];
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách chỗ đỗ xe</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="slot-search" class="search-input" placeholder="Tìm mã chỗ..." style="flex: 1;" />
                        <select id="slot-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="AVAILABLE">Trống</option>
                            <option value="OCCUPIED">Đã đầy</option>
                            <option value="RESERVED">Đã đặt</option>
                            <option value="LOCKED">Khóa</option>
                        </select>
                        <select id="slot-zone-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả khu vực</option>
                            ${zones.map(z => `<option value="${z}">${z}</option>`).join('')}
                        </select>
                        <select id="slot-type-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả loại xe</option>
                            ${vTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mã chỗ</th>
                                <th>Tòa nhà</th>
                                <th>Tầng</th>
                                <th>Khu vực</th>
                                <th>Loại xe</th>
                                <th>Sức chứa</th>
                                <th>Đang đỗ</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody id="slots-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="slots-pagination" style="padding: 0 20px;"></div>
            </div>
        `;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('slots-tbody');
            if(!tbody) return;
            
            // Filter
            const textVal = document.getElementById('slot-search').value.toLowerCase();
            const statusVal = document.getElementById('slot-status-filter').value;
            const zoneVal = document.getElementById('slot-zone-filter').value;
            const typeVal = document.getElementById('slot-type-filter').value;

            const filteredData = currentData.filter(s => {
                const code = (s.slotCode || '').toLowerCase();
                const matchText = code.includes(textVal);
                const matchStatus = statusVal === '' || s.status === statusVal;
                const matchZone = zoneVal === '' || s.zoneName === zoneVal;
                const matchType = typeVal === '' || s.vehicleTypeName === typeVal;

                return matchText && matchStatus && matchZone && matchType;
            });
            
            // Paginate
            const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(s => {
                let statusBadge = '';
                switch(s.status) {
                    case 'AVAILABLE': statusBadge = '<span class="badge badge-green">Trống</span>'; break;
                    case 'OCCUPIED': statusBadge = '<span class="badge badge-red">Đã đầy</span>'; break;
                    case 'RESERVED': statusBadge = '<span class="badge badge-yellow">Đã đặt</span>'; break;
                    case 'LOCKED': statusBadge = '<span class="badge badge-gray">Khóa</span>'; break;
                    default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
                }
                tbodyHtml += `
                    <tr>
                        <td style="font-weight:700">${s.slotCode}</td>
                        <td>${s.buildingName || '-'}</td>
                        <td>${s.floorName || '-'}</td>
                        <td>${s.zoneName || '-'}</td>
                        <td>${s.vehicleTypeName || '-'}</td>
                        <td>${s.capacity}</td>
                        <td>${s.currentOccupancy}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('slots-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.slotsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.slotsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.slotsChangePage = (p) => { currentPage = p; renderTableBody(); };
        document.getElementById('slot-search').addEventListener('input', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('slot-status-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('slot-zone-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('slot-type-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        
        renderTableBody();
    },
    // ==========================================
    // 4. �?T CH?: Qu?n l� y�u c?u d?t ch? tru?c c?a kh�ch h�ng (Driver)
    // ==========================================
    async renderReservations(container) {
        const res = await Api.getReservations();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data || [];
        const today = new Date().toISOString().split('T')[0];

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý đặt chỗ</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="res-search" class="search-input" placeholder="Tìm biển số xe..." style="flex: 1;" />
                        <select id="res-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ xác nhận</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="COMPLETED">Đã hoàn thành</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                        <input type="date" id="res-date-filter" class="search-input" value="${today}" style="width: auto;" />
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Mã Đặt</th><th>Khách hàng</th><th>Biển số xe</th><th>Chỗ đỗ</th><th>TG Bắt đầu</th><th>TG Kết thúc</th><th>Trạng thái</th></tr></thead>
                        <tbody id="res-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="res-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('res-tbody');
            if(!tbody) return;
            
            // Sort
            currentData.sort((a, b) => {
                const tA = a.reservationStart ? new Date(a.reservationStart).getTime() : 0;
                const tB = b.reservationStart ? new Date(b.reservationStart).getTime() : 0;
                return tB - tA; // Mới nhất trước
            });

            // Filter
            const textVal = document.getElementById('res-search').value.toLowerCase();
            const statusVal = document.getElementById('res-status-filter').value;
            const dateVal = document.getElementById('res-date-filter').value;

            const filteredData = currentData.filter(r => {
                const plate = (r.licensePlate || '').toLowerCase();
                const matchText = plate.includes(textVal);
                const matchStatus = statusVal === '' || r.status === statusVal;
                
                let matchDate = true;
                if (dateVal && r.reservationStart) {
                    const d = new Date(r.reservationStart);
                    const rDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    matchDate = rDate === dateVal;
                } else if (dateVal && !r.reservationStart) {
                    matchDate = false;
                }

                return matchText && matchStatus && matchDate;
            });
            
            // Paginate
            const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(r => {
                let badgeClass = '';
                switch(r.status) {
                    case 'PENDING': badgeClass = 'badge-yellow'; break;
                    case 'CONFIRMED': badgeClass = 'badge-green'; break;
                    case 'CANCELLED': badgeClass = 'badge-red'; break;
                    case 'COMPLETED': badgeClass = 'badge-blue'; break;
                    default: badgeClass = 'badge-gray';
                }
                
                const canEditRes = (App.state.user.role === 'Admin' || App.state.user.role === 'ParkingManager' || App.state.user.role === 'ParkingStaff');
                const resStatusOpts = { 'PENDING': 'Chờ xác nhận', 'CONFIRMED': 'Đã xác nhận', 'COMPLETED': 'Đã hoàn thành', 'CANCELLED': 'Đã hủy' };
                const badge = canEditRes ? `
                    <select onchange="window.updateReservationStatus(${r.reservationId}, this.value)" class="badge ${badgeClass}" style="border:none; outline:none; cursor:pointer; font-weight:600; text-align:center;">
                        ${Object.entries(resStatusOpts).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                ` : `<span class="badge ${badgeClass}">${resStatusOpts[r.status] || r.status}</span>`;

                tbodyHtml += `
                <tr>
                    <td>#${r.reservationId}</td>
                    <td>${r.userFullName || r.guestName || '-'}</td>
                    <td>${r.licensePlate || '-'}</td>
                    <td>${r.slotCode || '-'}</td>
                    <td>${r.reservationStart ? new Date(r.reservationStart).toLocaleString('vi-VN') : '-'}</td>
                    <td>${r.reservationEnd ? new Date(r.reservationEnd).toLocaleString('vi-VN') : '-'}</td>
                    <td>${badge}</td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('res-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.resChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.resChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.resChangePage = (p) => { currentPage = p; renderTableBody(); };
        document.getElementById('res-search').addEventListener('input', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('res-status-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('res-date-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        
        window.resetResFilters = () => {
            document.getElementById('res-search').value = '';
            document.getElementById('res-status-filter').value = '';
            document.getElementById('res-date-filter').value = '';
            currentPage = 1;
            renderTableBody();
        };

        renderTableBody();

        window.updateReservationStatus = async (id, status) => {
            if(!status) return;
            const r = await Api.updateReservationStatus(id, status);
            if(r.success) {
                App.showToast('Cập nhật trạng thái đặt chỗ thành công', 'success');
                App.renderPage('reservations');
            } else {
                App.showToast(r.message || 'Lỗi khi cập nhật', 'error');
            }
        };
    },
    // ==========================================
    // 5. THANH TO�N: Danh s�ch c�c giao d?ch thu ph� d? xe
    // ==========================================
    async renderPayments(container) {
        const res = await Api.getPayments();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        const methods = [...new Set(data.map(p => p.paymentMethod).filter(Boolean))];

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Lịch sử thanh toán</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="pay-search" class="search-input" placeholder="Tìm mã TT, biển số..." style="flex: 1;" />
                        <select id="pay-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Đang chờ</option>
                            <option value="SUCCESS">Thành công</option>
                            <option value="FAILED">Thất bại</option>
                        </select>
                        <select id="pay-method-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả phương thức</option>
                            ${methods.map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                        <select id="pay-type-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả loại</option>
                            <option value="SESSION">Phiên gửi xe</option>
                            <option value="RESERVATION">Đặt chỗ</option>
                        </select>
                        <input type="date" id="pay-date-filter" class="search-input" style="width: auto;" />
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Mã TT</th><th>Loại thanh toán</th><th>Biển số xe</th><th>Số tiền</th><th>Phương thức</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
                        <tbody id="payments-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="payments-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('payments-tbody');
            if(!tbody) return;
            
            // Filter
            const textVal = document.getElementById('pay-search') ? document.getElementById('pay-search').value.toLowerCase() : '';
            const statusVal = document.getElementById('pay-status-filter') ? document.getElementById('pay-status-filter').value : '';
            const methodVal = document.getElementById('pay-method-filter') ? document.getElementById('pay-method-filter').value : '';
            const typeVal = document.getElementById('pay-type-filter') ? document.getElementById('pay-type-filter').value : '';
            const dateVal = document.getElementById('pay-date-filter') ? document.getElementById('pay-date-filter').value : '';

            const filteredData = currentData.filter(p => {
                const searchStrId = String(p.paymentId).toLowerCase();
                const searchStrPlate = (p.licensePlate || '').toLowerCase();
                const searchMatch = !textVal || searchStrId.includes(textVal) || searchStrPlate.includes(textVal);
                const statusMatch = !statusVal || p.paymentStatus === statusVal;
                const methodMatch = !methodVal || p.paymentMethod === methodVal;
                
                let pType = p.sessionId ? 'SESSION' : (p.reservationId ? 'RESERVATION' : 'OTHER');
                const typeMatch = !typeVal || pType === typeVal;
                
                let dateMatch = true;
                if (dateVal) {
                    const dt = p.paidAt || p.createdAt;
                    if (dt) {
                        const d = new Date(dt);
                        const rDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                        dateMatch = rDate === dateVal;
                    } else {
                        dateMatch = false;
                    }
                }
                
                return searchMatch && statusMatch && methodMatch && typeMatch && dateMatch;
            });
            
            // Paginate
            const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(p => {
                let badge = '';
                switch(p.paymentStatus) {
                    case 'PENDING': badge = '<span class="badge badge-yellow">Đang chờ</span>'; break;
                    case 'SUCCESS': badge = '<span class="badge badge-green">Thành công</span>'; break;
                    case 'FAILED': badge = '<span class="badge badge-red">Thất bại</span>'; break;
                    default: badge = `<span class="badge badge-gray">${p.paymentStatus}</span>`;
                }
                let type = p.sessionId ? 'Phiên gửi xe' : (p.reservationId ? 'Đặt chỗ' : 'Khác');
                tbodyHtml += `
                <tr>
                    <td>#${p.paymentId}</td>
                    <td>${type}</td>
                    <td>${p.licensePlate || '-'}</td>
                    <td style="font-weight:700; color:var(--green)">${p.amount.toLocaleString('vi-VN')} đ</td>
                    <td>${p.paymentMethod || '-'}</td>
                    <td>${p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '-'}</td>
                    <td>
                        ${badge}
                        ${p.paymentStatus === 'PENDING' ? `<button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; margin-left: 8px;" onclick="window.confirmPayment(${p.paymentId})">Nhận tiền mặt</button>` : ''}
                    </td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('payments-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.paymentsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.paymentsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.paymentsChangePage = (p) => { currentPage = p; renderTableBody(); };
        const attachEvt = (id) => { const el = document.getElementById(id); if(el) el.addEventListener('input', () => { currentPage = 1; renderTableBody(); }); };
        ['pay-search', 'pay-status-filter', 'pay-method-filter', 'pay-type-filter', 'pay-date-filter'].forEach(attachEvt);
        
        renderTableBody();

        window.confirmPayment = async (id) => {
            if(confirm('Xác nhận đã thu tiền mặt cho giao dịch này?')) {
                const r = await Api.confirmCash(id);
                if(r.success) {
                    App.showToast('Xác nhận thanh toán thành công', 'success');
                    App.renderPage('payments');
                } else {
                    App.showToast(r.message || 'Lỗi xác nhận', 'error');
                }
            }
        };
    },

    async renderIncidents(container) {
        const res = await Api.getIncidents();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý sự cố</h3>
                    <div class="toolbar">
                        <button class="btn btn-primary" onclick="window.showIncidentModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Báo cáo sự cố
                        </button>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Tiêu đề</th><th>Mức độ</th><th>Loại sự cố</th><th>Trạng thái</th><th>Người báo cáo</th><th>TG báo cáo</th></tr></thead>
                        <tbody id="incidents-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="incidents-pagination" style="padding: 0 20px;"></div>
            </div>

            <!-- Incident Modal -->
            <div id="incident-modal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Báo cáo sự cố mới</h3>
                        <button class="modal-close" onclick="document.getElementById('incident-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                    <form id="incident-form">
                        <div class="modal-body form-grid">
                            <div class="form-group full-width">
                                <label>Mô tả sự cố *</label>
                                <textarea id="incident-desc" required rows="3"></textarea>
                            </div>
                            <div class="form-group">
                                <label>Loại sự cố *</label>
                                <select id="incident-type" required>
                                    <option value="LOST_TICKET">Mất vé (LOST_TICKET)</option>
                                    <option value="FACILITY_DAMAGE">Hư hỏng CSVC (FACILITY_DAMAGE)</option>
                                    <option value="WRONG_LICENSE_PLATE">Sai biển số (WRONG_LICENSE_PLATE)</option>
                                    <option value="SLOT_OCCUPIED">Chỗ đã bị chiếm (SLOT_OCCUPIED)</option>
                                    <option value="OTHER">Khác (OTHER)</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>ID Phiên gửi xe (tùy chọn)</label>
                                <input type="number" id="incident-session-id" placeholder="ID nếu liên quan đến phiên" />
                            </div>
                            <div class="form-group full-width">
                                <label>URL Ảnh minh chứng (tùy chọn)</label>
                                <input type="text" id="incident-image" placeholder="https://..." />
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('incident-modal').classList.add('hidden')">Hủy</button>
                            <button type="submit" class="btn btn-primary">Gửi báo cáo</button>
                        </div>
                    </form>
                </div>
            </div>
            </div>
            `;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('incidents-tbody');
            if(!tbody) return;
            
            // Paginate
            const totalPages = Math.ceil(currentData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = currentData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(i => {
                let sevBadge = '';
                switch(i.severity) {
                    case 'LOW': sevBadge = '<span class="badge badge-blue">Thấp</span>'; break;
                    case 'MEDIUM': sevBadge = '<span class="badge badge-yellow">Vừa</span>'; break;
                    case 'HIGH': sevBadge = '<span class="badge badge-red">Cao</span>'; break;
                    case 'CRITICAL': sevBadge = '<span style="background:#991b1b;color:#fff;padding:4px 10px;border-radius:50px;font-size:.75rem;font-weight:600;">Nghiêm trọng</span>'; break;
                    default: sevBadge = `<span class="badge badge-gray">${i.severity || '-'}</span>`;
                }
                let statClass = '';
                switch(i.status) {
                    case 'REPORTED': statClass = 'badge-yellow'; break;
                    case 'OPEN': statClass = 'badge-yellow'; break;
                    case 'IN_PROGRESS': statClass = 'badge-blue'; break;
                    case 'RESOLVED': statClass = 'badge-green'; break;
                    case 'CLOSED': statClass = 'badge-gray'; break;
                    default: statClass = 'badge-gray';
                }
                
                const canEditInc = (App.state.user.role === 'Admin' || App.state.user.role === 'ParkingManager');
                const incStatusOpts = { 'REPORTED': 'Mới báo cáo', 'OPEN': 'Mở', 'IN_PROGRESS': 'Đang xử lý', 'RESOLVED': 'Đã giải quyết', 'CLOSED': 'Đã đóng' };
                const statBadge = canEditInc ? `
                    <select onchange="window.updateIncidentStatus(${i.incidentId}, this.value)" class="badge ${statClass}" style="border:none; outline:none; cursor:pointer; font-weight:600; text-align:center;">
                        ${Object.entries(incStatusOpts).map(([k, v]) => `<option value="${k}" ${i.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                    </select>
                ` : `<span class="badge ${statClass}">${incStatusOpts[i.status] || i.status}</span>`;

                tbodyHtml += `
                <tr>
                    <td>#${i.incidentId}</td>
                    <td style="font-weight:600">${i.title || i.description || '-'}</td>
                    <td>${sevBadge}</td>
                    <td>${i.incidentType || '-'}</td>
                    <td>${statBadge}</td>
                    <td>${i.reporterName || '-'}</td>
                    <td>${i.reportTime ? new Date(i.reportTime).toLocaleString('vi-VN') : (i.createdAt ? new Date(i.createdAt).toLocaleString('vi-VN') : '-')}</td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('incidents-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${currentData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.incidentsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.incidentsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.incidentsChangePage = (p) => { currentPage = p; renderTableBody(); };
        renderTableBody();

        window.showIncidentModal = () => document.getElementById('incident-modal').classList.remove('hidden');

        document.getElementById('incident-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const sid = document.getElementById('incident-session-id').value;
            const payload = {
                description: document.getElementById('incident-desc').value,
                incidentType: document.getElementById('incident-type').value,
                incidentImage: document.getElementById('incident-image').value,
                sessionId: sid ? parseInt(sid) : null
            };
            const r = await Api.createIncident(payload);
            if(r.success) {
                App.showToast('Báo cáo sự cố thành công', 'success');
                document.getElementById('incident-modal').classList.add('hidden');
                App.renderPage('incidents');
            } else {
                App.showToast(r.message || 'Lỗi khi báo cáo sự cố', 'error');
            }
        });

        window.updateIncidentStatus = async (id, status) => {
            if(!status) return;
            const r = await Api.updateIncidentStatus(id, status);
            if(r.success) {
                App.showToast('Cập nhật trạng thái sự cố thành công', 'success');
                App.renderPage('incidents');
            } else {
                App.showToast(r.message || 'Lỗi khi cập nhật', 'error');
            }
        };
    },

    async renderSubscriptions(container) {
        const res = await Api.getSubscriptions();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý Vé Tháng</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Khách hàng</th><th>Biển số xe</th><th>Chỗ/Khu vực</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Phí tháng</th><th>Trạng thái</th></tr></thead>
                        <tbody id="subscriptions-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="subscriptions-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('subscriptions-tbody');
            if(!tbody) return;
            
            // Paginate
            const totalPages = Math.ceil(currentData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = currentData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(s => {
                let badge = '';
                switch(s.status) {
                    case 'ACTIVE': badge = '<span class="badge badge-green">Đang hoạt động</span>'; break;
                    case 'EXPIRED': badge = '<span class="badge badge-red">Đã hết hạn</span>'; break;
                    case 'CANCELLED': badge = '<span class="badge badge-gray">Đã hủy</span>'; break;
                    default: badge = `<span class="badge badge-gray">${s.status}</span>`;
                }
                let boundTo = '-';
                if (s.slotCode) boundTo = s.slotCode;
                else if (s.zoneName) boundTo = s.zoneName;

                tbodyHtml += `
                <tr>
                    <td>#${s.subscriptionId}</td>
                    <td>${s.userName || '-'}</td>
                    <td style="font-weight:700">${s.licensePlate || '-'}</td>
                    <td>${boundTo}</td>
                    <td>${s.startDate ? new Date(s.startDate).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>${s.endDate ? new Date(s.endDate).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>${s.monthlyFee ? s.monthlyFee.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                    <td>${badge}</td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('subscriptions-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${currentData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.subscriptionsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.subscriptionsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.subscriptionsChangePage = (p) => { currentPage = p; renderTableBody(); };
        renderTableBody();
    },

    async renderUsers(container) {
        const res = await Api.getUsers();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý người dùng</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Họ Tên</th><th>Email</th><th>Số điện thoại</th><th>Vai trò</th><th>Trạng thái</th></tr></thead>
                        <tbody id="users-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="users-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('users-tbody');
            if(!tbody) return;
            
            // Paginate
            const totalPages = Math.ceil(currentData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = currentData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(u => {
                tbodyHtml += `
                    <tr>
                        <td>#${u.userId}</td>
                        <td style="font-weight:600">${u.fullName}</td>
                        <td>${u.email}</td>
                        <td>${u.phoneNumber}</td>
                        <td><span class="badge badge-purple">${u.roleName}</span></td>
                        <td>${u.isActive ? '<span class="badge badge-green">Hoạt động</span>' : '<span class="badge badge-red">Khóa</span>'}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('users-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${currentData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.usersChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.usersChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.usersChangePage = (p) => { currentPage = p; renderTableBody(); };
        renderTableBody();
    },

    async renderReports(container) {
        // Fetch data
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        try {
            const [payRes, occRes, preRes] = await Promise.all([
                Api.getPayments(),
                Api.getOccupancy(),
                Api.getPredictions()
            ]);

            let payments = [];
            if (payRes.success) payments = payRes.data;
            
            // Lọc thanh toán thành công
            const paidPayments = payments.filter(p => p.paymentStatus === 'PAID');
            
            // Xử lý dữ liệu doanh thu theo ngày (7 ngày gần nhất)
            const last7Days = Array.from({length: 7}, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (6 - i));
                return d;
            });
            
            const categories = last7Days.map(d => d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}));
            const revenueData = last7Days.map(d => {
                const dateStr = d.toISOString().split('T')[0];
                return paidPayments.filter(p => p.paidAt && p.paidAt.startsWith(dateStr))
                    .reduce((sum, p) => sum + p.amount, 0);
            });

            // Doanh thu tháng này
            const currentMonth = new Date().getMonth();
            const monthlyRevenue = paidPayments
                .filter(p => p.paidAt && new Date(p.paidAt).getMonth() === currentMonth)
                .reduce((sum, p) => sum + p.amount, 0);

            // Tỷ lệ lấp đầy
            const capacity = occRes.success ? occRes.data.totalSlots : 0;
            const occupied = occRes.success ? occRes.data.occupiedSlots : 0;
            const available = occRes.success ? occRes.data.availableSlots : 0;
            const occRate = occRes.success ? occRes.data.occupancyRate : 0;

            let html = `
                <div style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px;">
                    
                    <!-- Left Column: Revenue Chart -->
                    <div style="grid-column: span 8;">
                        <div class="card" style="height: 100%;">
                            <div class="card-header">
                                <h3 class="card-title">Tổng quan doanh thu (7 ngày)</h3>
                            </div>
                            <div class="card-body">
                                <div id="revenue-chart"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Column: Occupancy & Earnings -->
                    <div style="grid-column: span 4; display: flex; flex-direction: column; gap: 24px;">
                        
                        <!-- Yearly Breakup (Occupancy) -->
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Tỷ lệ lấp đầy hiện tại</h3>
                            </div>
                            <div class="card-body">
                                <div style="display: flex; align-items: center; justify-content: space-between;">
                                    <div>
                                        <div style="display: flex; flex-direction: column; gap: 12px;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="width:12px; height:12px; border-radius:50%; background:var(--accent); box-shadow: 0 0 8px var(--accent-glow);"></span>
                                                <span style="font-size:0.95rem; font-weight: 500; color:var(--text-secondary);">Đang đỗ: <strong style="color:var(--text-primary); font-size: 1.1rem;">${occupied}</strong></span>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="width:12px; height:12px; border-radius:50%; background:#e2e8f0;"></span>
                                                <span style="font-size:0.95rem; font-weight: 500; color:var(--text-secondary);">Trống: <strong style="color:var(--text-primary); font-size: 1.1rem;">${available}</strong></span>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="position: relative;">
                                        <div id="occupancy-chart" style="filter: drop-shadow(0px 8px 16px rgba(249,115,22,0.15));"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Monthly Earnings -->
                        <div class="card" style="background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white;">
                            <div class="card-body">
                                <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 16px; opacity: 0.9;">Doanh thu tháng này</h3>
                                <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 8px;">${monthlyRevenue.toLocaleString('vi-VN')} đ</h2>
                                <p style="font-size: 0.85rem; opacity: 0.8;">Cập nhật đến hôm nay</p>
                            </div>
                        </div>

                    </div>
                    
                    <!-- Prediction Table -->
                    <div style="grid-column: span 12;">
                        <div class="card">
                            <div class="card-header">
                                <h3 class="card-title">Dự đoán chỗ trống (AI/Heuristics)</h3>
                            </div>
                            <div class="card-body no-pad table-wrapper">
                                <table class="data-table">
                                    <thead>
                                        <tr>
                                            <th>Khung giờ</th>
                                            <th>Trạng thái dự kiến</th>
                                            <th>Mức độ tin cậy</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${preRes.success && preRes.data ? `
                                            <tr>
                                                <td>Trong 1 giờ tới</td>
                                                <td>${preRes.data.predictionText || 'Bình thường'}</td>
                                                <td><span class="badge badge-green">Cao</span></td>
                                            </tr>
                                        ` : `
                                            <tr><td colspan="3" style="text-align:center;">Chưa có dữ liệu dự đoán</td></tr>
                                        `}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                </div>
            `;
            container.innerHTML = html;

            // Render ApexCharts
            if (window.ApexCharts) {
                // Revenue Chart (Bar)
                const revOptions = {
                    series: [{ name: 'Doanh thu', data: revenueData }],
                    chart: { type: 'bar', height: 350, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                    colors: ['#f97316'],
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
                    dataLabels: { enabled: false },
                    stroke: { show: true, width: 2, colors: ['transparent'] },
                    xaxis: { categories: categories, axisBorder: { show: false } },
                    yaxis: { labels: { formatter: (val) => val.toLocaleString('vi-VN') + ' đ' } },
                    grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
                    fill: { opacity: 1 },
                    tooltip: { y: { formatter: (val) => val.toLocaleString('vi-VN') + ' đ' } }
                };
                new ApexCharts(document.querySelector("#revenue-chart"), revOptions).render();

                // Occupancy Chart (Donut)
                const occOptions = {
                    series: [occupied, available],
                    chart: { 
                        type: 'donut', 
                        height: 180, 
                        fontFamily: 'Inter, sans-serif',
                        animations: { enabled: true, easing: 'easeinout', speed: 800, dynamicAnimation: { enabled: true, speed: 350 } }
                    },
                    colors: ['#f97316', '#e2e8f0'],
                    labels: ['Đang đỗ', 'Trống'],
                    plotOptions: { 
                        pie: { 
                            donut: { 
                                size: '75%',
                                labels: { 
                                    show: true,
                                    name: { show: false },
                                    value: {
                                        show: true,
                                        fontSize: '1.5rem',
                                        fontWeight: 800,
                                        color: '#1e293b',
                                        formatter: function (val) { return val + ' xe' }
                                    },
                                    total: {
                                        show: true,
                                        showAlways: true,
                                        label: 'Lấp đầy',
                                        fontSize: '0.8rem',
                                        color: '#94a3b8',
                                        formatter: function (w) { return occRate.toFixed(1) + '%' }
                                    }
                                }
                            } 
                        } 
                    },
                    dataLabels: { enabled: false },
                    legend: { show: false },
                    stroke: { show: false },
                    tooltip: { theme: 'light', y: { formatter: function(val) { return val + " xe" } } }
                };
                new ApexCharts(document.querySelector("#occupancy-chart"), occOptions).render();
            }

        } catch (e) {
            container.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Lỗi: ${e.message}</p></div>`;
        }
    }
};



