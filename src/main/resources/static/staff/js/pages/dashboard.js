    // ==========================================
    // 1. DASHBOARD: Th?ng k� t?ng quan b�i xe, t? l? l?p d?y, check-in/out nhanh
    // ==========================================
Pages.renderDashboard = async function(container) {
        const res = await Api.getDashboard();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }
        
        // Fetch reservations to calculate pending arrivals (CONFIRMED but not checked in)
        const resReservations = await Api.getReservations();
        let pendingArrivals = 0;
        if (resReservations.success && resReservations.data) {
            const d = new Date();
            const todayStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
            pendingArrivals = resReservations.data.filter(r => {
                if (r.status !== 'CONFIRMED') return false;
                const resDate = r.reservationStart ? r.reservationStart.split('T')[0] : '';
                return resDate === todayStr;
            }).length;
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
};
