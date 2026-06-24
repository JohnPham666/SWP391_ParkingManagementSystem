import Api from '../api.js';

export async function renderSessions(container, App) {
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
                <div class="toolbar">
                    <input type="text" id="session-search" class="search-input" placeholder="Tìm biển số xe..." />
                    <button class="btn btn-primary" onclick="window.showWalkInModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Check-in Vãng lai
                    </button>
                    <button class="btn btn-outline" style="border-color: var(--blue); color: var(--blue);" onclick="window.showResCheckinModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> Check-in Đặt chỗ
                    </button>
                    <button class="btn btn-success" onclick="window.showCheckoutModal()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg> Check-out
                    </button>
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
    `;

    data.forEach(s => {
        let statusBadge = '';
        switch(s.status) {
            case 'PARKING': statusBadge = '<span class="badge badge-blue">Đang đỗ</span>'; break;
            case 'COMPLETED': statusBadge = '<span class="badge badge-green">Hoàn thành</span>'; break;
            case 'UNPAID': statusBadge = '<span class="badge badge-yellow">Chưa thanh toán</span>'; break;
            case 'LOST_TICKET': statusBadge = '<span class="badge badge-red">Mất vé</span>'; break;
            default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
        }

        html += `
            <tr>
                <td>#${s.sessionId}</td>
                <td style="font-weight:600">${s.licensePlate || '-'}</td>
                <td>${s.slotCode || '-'}</td>
                <td>${s.vehicleTypeName || '-'}</td>
                <td>${s.entryTime ? new Date(s.entryTime).toLocaleString('vi-VN') : '-'}</td>
                <td>${s.entryGate || '-'}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    });

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Modals
    html += `
        <div id="walkin-modal" class="modal-overlay hidden">
            <div class="modal">
                <div class="modal-header">
                    <h3>Check-in Khách Vãng Lai</h3>
                    <button class="modal-close" onclick="document.getElementById('walkin-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <form id="walkin-form">
                    <div class="modal-body form-grid">
                        <div class="form-group full-width">
                            <label>Hình ảnh lúc vào (Biển số) *</label>
                            <input type="file" id="walkin-image" accept="image/*" required />
                        </div>
                        <div class="form-group full-width">
                            <label>Biển số xe *</label>
                            <input type="text" id="walkin-plate" required />
                        </div>
                        <div class="form-group">
                            <label>Loại xe *</label>
                            <select id="walkin-type" required></select>
                        </div>
                        <div class="form-group">
                            <label>Cổng vào</label>
                            <select id="walkin-gate">
                                <option value="Gate A">Cổng A (Gate A)</option>
                                <option value="Gate B">Cổng B (Gate B)</option>
                                <option value="Gate C">Cổng C (Gate C)</option>
                                <option value="Gate D">Cổng D (Gate D)</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('walkin-modal').classList.add('hidden')">Hủy</button>
                        <button type="submit" class="btn btn-primary" id="walkin-submit-btn">Check-in</button>
                    </div>
                </form>
            </div>
        </div>

        <div id="walkin-summary-modal" class="modal-overlay hidden">
            <div class="modal" style="max-width: 400px;">
                <div class="modal-header">
                    <h3>Thông tin Phiên Gửi Xe</h3>
                    <button class="modal-close" onclick="document.getElementById('walkin-summary-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <div class="modal-body">
                    <div style="text-align: center; margin-bottom: 15px;">
                        <img id="summary-image" src="" onerror="this.src='https://via.placeholder.com/400x200?text=No+Image'" alt="Xe vào" style="width:100%; max-height:200px; object-fit:cover; border-radius:8px;" />
                    </div>
                    <p><strong>Biển số:</strong> <span id="summary-plate"></span></p>
                    <p><strong>Loại xe:</strong> <span id="summary-type"></span></p>
                    <p><strong>Giờ vào:</strong> <span id="summary-time"></span></p>
                    <p><strong>Cổng vào:</strong> <span id="summary-gate"></span></p>
                </div>
                <div class="modal-footer" style="justify-content: center;">
                    <button type="button" class="btn btn-primary" onclick="document.getElementById('walkin-summary-modal').classList.add('hidden')">Đóng</button>
                </div>
            </div>
        </div>

        <div id="checkout-modal" class="modal-overlay hidden">
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Check-out</h3>
                    <button class="modal-close" onclick="document.getElementById('checkout-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <div class="modal-body">
                    <!-- Step 1 -->
                    <form id="checkout-search-form" style="display:flex; gap:10px; align-items:flex-end; margin-bottom: 20px;">
                        <div class="form-group" style="flex:1;">
                            <label>Hình ảnh lúc ra *</label>
                            <input type="file" id="checkout-exit-image" accept="image/*" required />
                        </div>
                        <div class="form-group" style="flex:1;">
                            <label>Biển số xe *</label>
                            <input type="text" id="checkout-plate" required />
                        </div>
                        <div class="form-group">
                            <button type="submit" class="btn btn-primary" id="checkout-search-btn">Tìm kiếm</button>
                        </div>
                    </form>

                    <!-- Step 2 -->
                    <form id="checkout-confirm-form" class="hidden">
                        <input type="hidden" id="checkout-session-id" />
                        <input type="hidden" id="checkout-payment-id" />
                        
                        <div style="display:flex; gap:15px; margin-bottom:20px;">
                            <div style="flex:1; text-align:center;">
                                <p style="font-weight:600; margin-bottom:5px;">Ảnh lúc vào</p>
                                <img id="checkout-img-in" src="" onerror="this.src='https://via.placeholder.com/300x150?text=No+Image'" style="width:100%; height:150px; object-fit:cover; border-radius:4px; border:1px solid #ddd;" />
                            </div>
                            <div style="flex:1; text-align:center;">
                                <p style="font-weight:600; margin-bottom:5px;">Ảnh lúc ra</p>
                                <img id="checkout-img-out" src="" onerror="this.src='https://via.placeholder.com/300x150?text=No+Image'" style="width:100%; height:150px; object-fit:cover; border-radius:4px; border:1px solid #ddd;" />
                            </div>
                        </div>
                        
                        <div style="background:var(--bg-page); padding:15px; border-radius:8px; margin-bottom:20px;">
                            <p><strong>Biển số:</strong> <span id="co-info-plate"></span></p>
                            <p><strong>Loại xe:</strong> <span id="co-info-type"></span></p>
                            <p><strong>Giờ vào:</strong> <span id="co-info-entry"></span></p>
                            <p><strong>Giờ ra (HT):</strong> <span id="co-info-exit"></span></p>
                            <p><strong>Phí thanh toán:</strong> <span id="co-info-fee" style="color:var(--red); font-size:1.1em; font-weight:700;"></span></p>
                        </div>

                        <div class="form-grid">
                            <div class="form-group full-width">
                                <label>Phương thức thanh toán</label>
                                <select id="checkout-payment-method">
                                    <option value="CASH">Tiền mặt (Nhận tại quầy)</option>
                                    <option value="BANK_TRANSFER">Chuyển khoản ngân hàng</option>
                                    <option value="E_WALLET">Ví điện tử</option>
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('checkout-modal').classList.add('hidden')">Hủy</button>
                            <button type="submit" class="btn btn-success" id="checkout-confirm-btn">Xác nhận Thanh toán</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <div id="res-checkin-modal" class="modal-overlay hidden">
            <div class="modal">
                <div class="modal-header">
                    <h3>Check-in Đặt Chỗ</h3>
                    <button class="modal-close" onclick="document.getElementById('res-checkin-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <form id="res-checkin-form">
                    <div class="modal-body form-grid">
                        <div class="form-group full-width">
                            <label>Mã Đặt Chỗ (Reservation ID) *</label>
                            <input type="number" id="res-checkin-id" required />
                        </div>
                        <div class="form-group full-width">
                            <label>Cổng vào</label>
                            <select id="res-checkin-gate">
                                <option value="Gate A">Cổng A (Gate A)</option>
                                <option value="Gate B">Cổng B (Gate B)</option>
                                <option value="Gate C">Cổng C (Gate C)</option>
                                <option value="Gate D">Cổng D (Gate D)</option>
                            </select>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('res-checkin-modal').classList.add('hidden')">Hủy</button>
                        <button type="submit" class="btn btn-primary" style="background-color: var(--blue); border-color: var(--blue);">Check-in</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    container.innerHTML = html;

    // Populate Vehicle Types for WalkIn
    const typeSelect = document.getElementById('walkin-type');
    const vtypesRes = await Api.getVehicleTypes();
    if(vtypesRes.success && vtypesRes.data) {
        vtypesRes.data.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.vehicleTypeId;
            opt.textContent = t.typeName;
            typeSelect.appendChild(opt);
        });
    }

    // Search logic
    const searchInput = document.getElementById('session-search');
    const tbody = document.getElementById('sessions-tbody');
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const plate = row.children[1].textContent.toLowerCase();
            row.style.display = plate.includes(val) ? '' : 'none';
        });
    });

    // Global functions for modals
    window.showWalkInModal = () => document.getElementById('walkin-modal').classList.remove('hidden');
    window.showCheckoutModal = () => {
        document.getElementById('checkout-modal').classList.remove('hidden');
        document.getElementById('checkout-confirm-form').classList.add('hidden');
        document.getElementById('checkout-search-form').classList.remove('hidden');
        document.getElementById('checkout-search-form').reset();
    };
    window.showResCheckinModal = () => document.getElementById('res-checkin-modal').classList.remove('hidden');

    // Form submits
    document.getElementById('walkin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('walkin-submit-btn');
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        const payload = {
            licensePlate: document.getElementById('walkin-plate').value,
            vehicleTypeId: parseInt(document.getElementById('walkin-type').value),
            entryGate: document.getElementById('walkin-gate').value
        };
        const r = await Api.walkIn(payload);
        if(r.success) {
            let session = r.data;
            const fileInput = document.getElementById('walkin-image');
            if (fileInput.files.length > 0) {
                const uploadRes = await Api.uploadSessionImage(session.sessionId, fileInput.files[0], 'entry');
                if (uploadRes.success) session = uploadRes.data;
            }

            document.getElementById('walkin-modal').classList.add('hidden');
            
            // Show summary
            document.getElementById('summary-image').src = session.entryImage || '';
            document.getElementById('summary-plate').textContent = session.licensePlate;
            document.getElementById('summary-type').textContent = session.vehicleTypeName;
            document.getElementById('summary-time').textContent = new Date(session.entryTime).toLocaleString('vi-VN');
            document.getElementById('summary-gate').textContent = session.entryGate;
            document.getElementById('walkin-summary-modal').classList.remove('hidden');

            App.renderPage('sessions');
            App.showToast('Check-in vãng lai thành công', 'success');
        } else {
            App.showToast(r.message, 'error');
        }
        btn.disabled = false;
        btn.textContent = 'Check-in';
    });

    // Checkout Search Step
    document.getElementById('checkout-search-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('checkout-search-btn');
        btn.disabled = true;
        btn.textContent = 'Đang tìm...';

        const plate = document.getElementById('checkout-plate').value;
        const res = await Api.getActiveByPlate(plate);
        
        if (res.success && res.data) {
            const session = res.data;
            
            // create payment to get FinalFee
            const pRes = await Api.createPayment({ sessionId: session.sessionId, paymentMethod: 'CASH' });
            if (!pRes.success && pRes.message && !pRes.message.includes('already has a PENDING payment')) {
                App.showToast(pRes.message || 'Lỗi tạo thanh toán', 'error');
                btn.disabled = false; btn.textContent = 'Tìm kiếm';
                return;
            }

            let paymentId = pRes.data ? pRes.data.paymentId : null;
            let finalFee = pRes.data ? pRes.data.amount : (session.estimatedFee || 0);

            if (!paymentId && pRes.message) {
                const match = pRes.message.match(/Payment ID:\s*(\d+)/);
                if (match) {
                    paymentId = parseInt(match[1], 10);
                    // Fetch the existing payment to get the amount
                    const existingPRes = await Api.getPayment(paymentId);
                    if (existingPRes.success && existingPRes.data) {
                        finalFee = existingPRes.data.amount;
                    }
                }
            }

            if (!paymentId) {
                App.showToast('Lỗi: Không thể khởi tạo giao dịch thanh toán', 'error');
                btn.disabled = false; btn.textContent = 'Tìm kiếm';
                return;
            }

            // Populate Step 2
            document.getElementById('checkout-session-id').value = session.sessionId;
            document.getElementById('checkout-payment-id').value = paymentId;
            document.getElementById('co-info-plate').textContent = session.licensePlate;
            document.getElementById('co-info-type').textContent = session.vehicleTypeName;
            document.getElementById('co-info-entry').textContent = new Date(session.entryTime).toLocaleString('vi-VN');
            document.getElementById('co-info-exit').textContent = new Date().toLocaleString('vi-VN');
            document.getElementById('co-info-fee').textContent = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(finalFee);
            
            document.getElementById('checkout-img-in').src = session.entryImage || '';
            
            const fileInput = document.getElementById('checkout-exit-image');
            if (fileInput.files.length > 0) {
                document.getElementById('checkout-img-out').src = URL.createObjectURL(fileInput.files[0]);
            }

            document.getElementById('checkout-search-form').classList.add('hidden');
            document.getElementById('checkout-confirm-form').classList.remove('hidden');
        } else {
            App.showToast(res.message || 'Không tìm thấy xe đang đỗ', 'error');
        }
        btn.disabled = false;
        btn.textContent = 'Tìm kiếm';
    });

    // Checkout Confirm Step
    document.getElementById('checkout-confirm-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('checkout-confirm-btn');
        btn.disabled = true;
        btn.textContent = 'Đang xử lý...';

        const sessionId = document.getElementById('checkout-session-id').value;
        const paymentId = document.getElementById('checkout-payment-id').value;
        const method = document.getElementById('checkout-payment-method').value;

        // Upload exit image first
        const fileInput = document.getElementById('checkout-exit-image');
        if (fileInput.files.length > 0) {
            await Api.uploadSessionImage(sessionId, fileInput.files[0], 'exit');
        }

        // Confirm payment
        if (method === 'CASH') {
            const cRes = await Api.confirmCash(paymentId);
            if (cRes.success) {
                App.showToast('Check-out thành công!', 'success');
                document.getElementById('checkout-modal').classList.add('hidden');
                App.renderPage('sessions');
            } else {
                App.showToast(cRes.message || 'Lỗi xác nhận', 'error');
            }
        } else {
            const vnRes = await Api.createVnPayUrl(paymentId);
            if (vnRes.success && vnRes.data && vnRes.data.paymentUrl) {
                window.open(vnRes.data.paymentUrl, '_blank');
                App.showToast('Đã mở cổng thanh toán VNPay', 'info');
                document.getElementById('checkout-modal').classList.add('hidden');
                App.renderPage('sessions');
            } else {
                App.showToast(vnRes.message || 'Lỗi tạo link VNPay', 'error');
            }
        }
        btn.disabled = false;
        btn.textContent = 'Xác nhận Thanh toán';
    });

    document.getElementById('res-checkin-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            reservationId: parseInt(document.getElementById('res-checkin-id').value),
            entryGate: document.getElementById('res-checkin-gate').value
        };
        const r = await Api.checkIn(payload);
        if(r.success) {
            App.showToast('Check-in đặt chỗ thành công', 'success');
            document.getElementById('res-checkin-modal').classList.add('hidden');
            App.renderPage('sessions');
        } else {
            App.showToast(r.message || 'Lỗi khi check-in', 'error');
        }
    });
}
