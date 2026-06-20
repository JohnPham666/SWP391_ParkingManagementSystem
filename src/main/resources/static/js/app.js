/* ===== Core Application Logic ===== */
const App = {
    state: {
        user: null,
        currentPage: 'dashboard'
    },

    init() {
        this.setupEventListeners();
        const auth = Api.init();
        if (auth) {
            this.state.user = auth;
            this.showApp();
        } else {
            this.showLogin();
        }
    },

    setupEventListeners() {
        // Login form
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');
            const err = document.getElementById('login-error');
            
            btn.querySelector('span').classList.add('hidden');
            btn.querySelector('.btn-loader').classList.remove('hidden');
            btn.disabled = true;
            err.classList.add('hidden');

            const res = await Api.login(email, pass);
            
            btn.querySelector('span').classList.remove('hidden');
            btn.querySelector('.btn-loader').classList.add('hidden');
            btn.disabled = false;

            if (res.success && res.data) {
                Api.saveAuth(res.data);
                this.state.user = res.data;
                this.showApp();
            } else {
                err.textContent = res.message || 'Đăng nhập thất bại';
                err.classList.remove('hidden');
            }
        });

        // Toggle password
        document.getElementById('toggle-password').addEventListener('click', (e) => {
            const input = document.getElementById('login-password');
            const btn = e.currentTarget;
            if (input.type === 'password') {
                input.type = 'text';
                btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg>';
            } else {
                input.type = 'password';
                btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
            }
        });

        // Sidebar
        document.getElementById('sidebar-toggle').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('collapsed');
        });
        
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            Api.clearAuth();
            this.showLogin();
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
                e.currentTarget.classList.add('active');
                
                const page = e.currentTarget.dataset.page;
                this.navigate(page);
                
                // Close mobile sidebar
                if (window.innerWidth <= 1024) {
                    document.getElementById('sidebar').classList.remove('open');
                }
            });
        });

        // Clock
        setInterval(() => {
            const now = new Date();
            document.getElementById('topbar-clock').textContent = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + now.toLocaleDateString('vi-VN');
        }, 1000);
    },

    showLogin() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-password').value = '';
    },

    showApp() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        // Update user info
        const user = this.state.user;
        document.getElementById('sidebar-user-name').textContent = user.fullName;
        document.getElementById('sidebar-user-role').textContent = user.role;
        document.getElementById('user-avatar').textContent = user.fullName.charAt(0).toUpperCase();

        // Role-based access
        if (user.role !== 'Admin' && user.role !== 'ParkingManager') {
            document.getElementById('nav-users').classList.add('hidden');
            document.getElementById('nav-reports').classList.add('hidden');
        } else {
            document.getElementById('nav-users').classList.remove('hidden');
            document.getElementById('nav-reports').classList.remove('hidden');
        }

        this.navigate('dashboard');
    },

    navigate(page) {
        this.state.currentPage = page;
        const titles = {
            'dashboard': 'Dashboard',
            'sessions': 'Quản lý phiên gửi xe',
            'slots': 'Quản lý chỗ đỗ xe',
            'vehicles': 'Quản lý phương tiện',
            'reservations': 'Quản lý đặt chỗ',
            'payments': 'Quản lý thanh toán',
            'subscriptions': 'Quản lý vé tháng',
            'incidents': 'Quản lý sự cố',
            'users': 'Quản lý người dùng',
            'reports': 'Báo cáo thống kê'
        };
        
        document.getElementById('page-title').textContent = titles[page] || page;
        this.renderPage(page);
    },

    async renderPage(page) {
        const container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        
        try {
            switch(page) {
                case 'dashboard':
                    await Pages.renderDashboard(container);
                    break;
                case 'sessions':
                    await Pages.renderSessions(container);
                    break;
                case 'slots':
                    await Pages.renderSlots(container);
                    break;
                case 'vehicles':
                    await Pages.renderVehicles(container);
                    break;
                case 'reservations':
                    await Pages.renderReservations(container);
                    break;
                case 'payments':
                    await Pages.renderPayments(container);
                    break;
                case 'subscriptions':
                    await Pages.renderSubscriptions(container);
                    break;
                case 'incidents':
                    await Pages.renderIncidents(container);
                    break;
                case 'users':
                    await Pages.renderUsers(container);
                    break;
                case 'reports':
                    await Pages.renderReports(container);
                    break;
                default:
                    container.innerHTML = `
                        <div class="empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                            <p>Tính năng <b>${page}</b> đang được phát triển.</p>
                        </div>
                    `;
            }
        } catch (e) {
            container.innerHTML = `
                <div class="empty-state">
                    <p style="color: var(--red)">Đã xảy ra lỗi khi tải trang: ${e.message}</p>
                </div>
            `;
        }
    },

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

/* ===== Pages Modules ===== */
const Pages = {
    async renderDashboard(container) {
        const res = await Api.getDashboard();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }
        
        const data = res.data;
        const sum = data.summary;
        
        let html = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 9h22M9 21V9"/><rect x="1" y="3" width="22" height="18" rx="2"/></svg></div>
                    <div class="stat-info">
                        <h3>${sum.totalCapacity}</h3>
                        <p>Tổng số chỗ (sức chứa)</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg></div>
                    <div class="stat-info">
                        <h3>${sum.availableCapacity}</h3>
                        <p>Chỗ trống</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon red"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div>
                    <div class="stat-info">
                        <h3>${sum.currentOccupancy}</h3>
                        <p>Đang đỗ</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                    <div class="stat-info">
                        <h3>${sum.reservedSlots}</h3>
                        <p>Đã đặt</p>
                    </div>
                </div>
            </div>

            <div class="card mb-4" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h3 class="card-title">Tỷ lệ lấp đầy: ${sum.occupancyRate.toFixed(1)}%</h3>
                </div>
                <div class="card-body">
                    <div class="occupancy-bar">
                        <div class="occupancy-fill ${sum.occupancyRate < 50 ? 'low' : (sum.occupancyRate < 80 ? 'mid' : 'high')}" style="width: ${sum.occupancyRate}%"></div>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.85rem; color:var(--text-secondary)">
                        <span>0%</span>
                        <span>Sức chứa: ${sum.currentOccupancy} / ${sum.totalCapacity}</span>
                        <span>100%</span>
                    </div>
                </div>
            </div>
        `;

        if (data.buildings && data.buildings.length > 0) {
            data.buildings.forEach(b => {
                html += `<div class="card" style="margin-bottom: 24px;">
                    <div class="card-header">
                        <h3 class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"/></svg>${b.buildingName}</h3>
                        <div class="badge badge-blue">Đang đỗ: ${b.summary.currentOccupancy} / ${b.summary.totalCapacity}</div>
                    </div>
                    <div class="card-body">
                `;
                b.floors.forEach(f => {
                    html += `<div style="margin-bottom: 20px;">
                        <h4 style="font-size: .95rem; font-weight: 600; margin-bottom: 12px; color: var(--text-secondary);">${f.floorName}</h4>
                    `;
                    f.zones.forEach(z => {
                        html += `<div style="margin-bottom: 16px; background: var(--bg-page); padding: 16px; border-radius: var(--radius-sm);">
                            <h5 style="font-size: .85rem; font-weight: 600; margin-bottom: 12px; display:flex; justify-content:space-between;">
                                <span>${z.zoneName} <span style="font-weight:400; color:var(--text-muted)">(${z.description})</span></span>
                                <span class="badge badge-gray">Đang đỗ: ${z.summary.currentOccupancy} / Sức chứa: ${z.summary.totalCapacity}</span>
                            </h5>
                            <div class="slot-grid">`;
                        
                        z.slots.forEach(s => {
                            let statusClass = s.status.toLowerCase();
                            html += `
                                <div class="slot-cell ${statusClass}" title="${s.vehicleTypeName}">
                                    ${s.slotCode}
                                    <small>${s.status}</small>
                                </div>
                            `;
                        });
                        html += `</div></div>`;
                    });
                    html += `</div>`;
                });
                html += `</div></div>`;
            });
        }

        container.innerHTML = html;
    },

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
                            <button type="submit" class="btn btn-primary">Check-in</button>
                        </div>
                    </form>
                </div>
            </div>

            <div id="checkout-modal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Check-out</h3>
                        <button class="modal-close" onclick="document.getElementById('checkout-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                    <form id="checkout-form">
                        <div class="modal-body form-grid">
                            <div class="form-group full-width">
                                <label>Phiên gửi xe ID *</label>
                                <input type="number" id="checkout-session-id" required />
                            </div>
                            <div class="form-group full-width">
                                <label>Cổng ra</label>
                                <select id="checkout-gate">
                                    <option value="Gate A">Cổng A (Gate A)</option>
                                    <option value="Gate B">Cổng B (Gate B)</option>
                                    <option value="Gate C">Cổng C (Gate C)</option>
                                    <option value="Gate D">Cổng D (Gate D)</option>
                                </select>
                            </div>
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
                            <button type="submit" class="btn btn-success">Check-out</button>
                        </div>
                    </form>
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
        window.showCheckoutModal = () => document.getElementById('checkout-modal').classList.remove('hidden');
        window.showResCheckinModal = () => document.getElementById('res-checkin-modal').classList.remove('hidden');

        // Form submits
        document.getElementById('walkin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                licensePlate: document.getElementById('walkin-plate').value,
                vehicleTypeId: parseInt(document.getElementById('walkin-type').value),
                entryGate: document.getElementById('walkin-gate').value
            };
            const r = await Api.walkIn(payload);
            if(r.success) {
                App.showToast('Check-in vãng lai thành công', 'success');
                document.getElementById('walkin-modal').classList.add('hidden');
                App.renderPage('sessions');
            } else {
                App.showToast(r.message, 'error');
            }
        });

        document.getElementById('checkout-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const sessionId = document.getElementById('checkout-session-id').value;
            const exitGate = document.getElementById('checkout-gate').value;
            const paymentMethod = document.getElementById('checkout-payment-method').value;

            // Step 1: Tạo thanh toán
            const paymentPayload = {
                sessionId: parseInt(sessionId),
                paymentMethod: paymentMethod
            };
            const pRes = await Api.createPayment(paymentPayload);
            if (!pRes.success && pRes.message && !pRes.message.includes('already has a PENDING payment')) {
                App.showToast(pRes.message || 'Lỗi tạo thanh toán', 'error');
                return;
            }

            const paymentId = pRes.data ? pRes.data.paymentId : null;
            if (!paymentId) {
                App.showToast('Không lấy được ID thanh toán.', 'error');
                return;
            }

            // Step 2: Xử lý theo phương thức thanh toán
            if (paymentMethod === 'CASH') {
                // Tiền mặt: Xác nhận thu tiền ngay, backend sẽ tự động Check-out session
                const cRes = await Api.confirmCash(paymentId);
                if (cRes.success) {
                    App.showToast('Đã thu tiền mặt và check-out thành công!', 'success');
                    document.getElementById('checkout-modal').classList.add('hidden');
                    App.renderPage('sessions');
                } else {
                    App.showToast(cRes.message || 'Lỗi xác nhận tiền mặt', 'error');
                }
            } else {
                // Chuyển khoản hoặc Ví điện tử: Tạo VNPay URL và mở sang tab mới
                const vnRes = await Api.createVnPayUrl(paymentId);
                if (vnRes.success && vnRes.data && vnRes.data.paymentUrl) {
                    window.open(vnRes.data.paymentUrl, '_blank');
                    App.showToast('Đã mở cổng thanh toán VNPay. Phiên sẽ tự động check-out khi thanh toán hoàn tất.', 'info');
                    document.getElementById('checkout-modal').classList.add('hidden');
                    App.renderPage('sessions');
                } else {
                    App.showToast(vnRes.message || 'Lỗi tạo link VNPay', 'error');
                }
            }
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
    },

    async renderSlots(container) {
        const res = await Api.getSlots();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }

        const data = res.data;
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách chỗ đỗ xe</h3>
                    <div class="toolbar">
                        <input type="text" id="slot-search" class="search-input" placeholder="Tìm mã chỗ..." />
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
        `;

        data.forEach(s => {
            let statusBadge = '';
            switch(s.status) {
                case 'AVAILABLE': statusBadge = '<span class="badge badge-green">Trống</span>'; break;
                case 'OCCUPIED': statusBadge = '<span class="badge badge-red">Đã đầy</span>'; break;
                case 'RESERVED': statusBadge = '<span class="badge badge-yellow">Đã đặt</span>'; break;
                case 'LOCKED': statusBadge = '<span class="badge badge-gray">Khóa</span>'; break;
                default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
            }

            html += `
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

        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;

        // Search logic
        const searchInput = document.getElementById('slot-search');
        const tbody = document.getElementById('slots-tbody');
        searchInput.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            const rows = tbody.querySelectorAll('tr');
            rows.forEach(row => {
                const code = row.children[0].textContent.toLowerCase();
                row.style.display = code.includes(val) ? '' : 'none';
            });
        });
    },

    async renderVehicles(container) {
        const res = await Api.getVehicles();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý phương tiện</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Biển số</th><th>Chủ xe</th><th>Loại xe</th><th>Hãng xe</th><th>Màu sắc</th><th>Ngày đăng ký</th></tr></thead>
                        <tbody>
                            ${data.map(v => `
                                <tr>
                                    <td>#${v.vehicleId}</td>
                                    <td style="font-weight:700">${v.licensePlate}</td>
                                    <td>${v.ownerName || '-'}</td>
                                    <td>${v.vehicleTypeName || '-'}</td>
                                    <td>${v.brand || '-'}</td>
                                    <td>${v.color || v.vehicleColor || '-'}</td>
                                    <td>${v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;
    },

    async renderReservations(container) {
        const res = await Api.getReservations();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý đặt chỗ</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Mã Đặt</th><th>Khách hàng</th><th>Biển số xe</th><th>Chỗ đỗ</th><th>TG Bắt đầu</th><th>TG Kết thúc</th><th>Trạng thái</th></tr></thead>
                        <tbody>
                            ${data.map(r => {
                                let badge = '';
                                switch(r.status) {
                                    case 'PENDING': badge = '<span class="badge badge-yellow">Chờ xác nhận</span>'; break;
                                    case 'CONFIRMED': badge = '<span class="badge badge-green">Đã xác nhận</span>'; break;
                                    case 'CANCELLED': badge = '<span class="badge badge-red">Đã hủy</span>'; break;
                                    case 'COMPLETED': badge = '<span class="badge badge-blue">Đã hoàn thành</span>'; break;
                                    default: badge = `<span class="badge badge-gray">${r.status}</span>`;
                                }
                                return `
                                <tr>
                                    <td>#${r.reservationId}</td>
                                    <td>${r.userName || '-'}</td>
                                    <td>${r.licensePlate || '-'}</td>
                                    <td>${r.slotCode || '-'}</td>
                                    <td>${new Date(r.startTime).toLocaleString('vi-VN')}</td>
                                    <td>${new Date(r.endTime).toLocaleString('vi-VN')}</td>
                                    <td>
                                        ${badge}
                                        ${(App.state.user.role === 'Admin' || App.state.user.role === 'ParkingManager' || App.state.user.role === 'ParkingStaff') ? `
                                            <select onchange="window.updateReservationStatus(${r.reservationId}, this.value)" style="font-size:0.75rem; padding:2px; margin-top:4px; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-card); color: var(--text-main);">
                                                <option value="">-- Đổi --</option>
                                                <option value="PENDING">Chờ xác nhận</option>
                                                <option value="CONFIRMED">Đã xác nhận</option>
                                                <option value="COMPLETED">Đã hoàn thành</option>
                                                <option value="CANCELLED">Đã hủy</option>
                                            </select>
                                        ` : ''}
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;

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

    async renderPayments(container) {
        const res = await Api.getPayments();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Lịch sử thanh toán</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Mã TT</th><th>Loại thanh toán</th><th>Số tiền</th><th>Phương thức</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
                        <tbody>
                            ${data.map(p => {
                                let badge = '';
                                switch(p.paymentStatus) {
                                    case 'PENDING': badge = '<span class="badge badge-yellow">Đang chờ</span>'; break;
                                    case 'SUCCESS': badge = '<span class="badge badge-green">Thành công</span>'; break;
                                    case 'FAILED': badge = '<span class="badge badge-red">Thất bại</span>'; break;
                                    default: badge = `<span class="badge badge-gray">${p.paymentStatus}</span>`;
                                }
                                let type = p.sessionId ? 'Phiên gửi xe' : (p.reservationId ? 'Đặt chỗ' : 'Khác');
                                return `
                                <tr>
                                    <td>#${p.paymentId}</td>
                                    <td>${type}</td>
                                    <td style="font-weight:700; color:var(--green)">${p.amount.toLocaleString('vi-VN')} đ</td>
                                    <td>${p.paymentMethod || '-'}</td>
                                    <td>${p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '-'}</td>
                                    <td>
                                        ${badge}
                                        ${p.paymentStatus === 'PENDING' ? `<button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; margin-left: 8px;" onclick="window.confirmPayment(${p.paymentId})">Nhận tiền mặt</button>` : ''}
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;

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
                        <tbody>
                            ${data.map(i => {
                                let sevBadge = '';
                                switch(i.severity) {
                                    case 'LOW': sevBadge = '<span class="badge badge-blue">Thấp</span>'; break;
                                    case 'MEDIUM': sevBadge = '<span class="badge badge-yellow">Vừa</span>'; break;
                                    case 'HIGH': sevBadge = '<span class="badge badge-red">Cao</span>'; break;
                                    case 'CRITICAL': sevBadge = '<span style="background:#991b1b;color:#fff;padding:4px 10px;border-radius:50px;font-size:.75rem;font-weight:600;">Nghiêm trọng</span>'; break;
                                    default: sevBadge = `<span class="badge badge-gray">${i.severity || '-'}</span>`;
                                }
                                let statBadge = '';
                                switch(i.status) {
                                    case 'REPORTED': statBadge = '<span class="badge badge-yellow">Mới báo cáo</span>'; break;
                                    case 'OPEN': statBadge = '<span class="badge badge-yellow">Mở</span>'; break;
                                    case 'IN_PROGRESS': statBadge = '<span class="badge badge-blue">Đang xử lý</span>'; break;
                                    case 'RESOLVED': statBadge = '<span class="badge badge-green">Đã giải quyết</span>'; break;
                                    case 'CLOSED': statBadge = '<span class="badge badge-gray">Đã đóng</span>'; break;
                                    default: statBadge = `<span class="badge badge-gray">${i.status}</span>`;
                                }
                                return `
                                <tr>
                                    <td>#${i.incidentId}</td>
                                    <td style="font-weight:600">${i.title || i.description || '-'}</td>
                                    <td>${sevBadge}</td>
                                    <td>${i.incidentType || '-'}</td>
                                    <td>
                                        ${statBadge}
                                        ${(App.state.user.role === 'Admin' || App.state.user.role === 'ParkingManager') ? `
                                            <select onchange="window.updateIncidentStatus(${i.incidentId}, this.value)" style="font-size:0.75rem; padding:2px; margin-top:4px; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background-color: var(--bg-card); color: var(--text-main);">
                                                <option value="">-- Đổi --</option>
                                                <option value="OPEN">Mở</option>
                                                <option value="IN_PROGRESS">Đang xử lý</option>
                                                <option value="RESOLVED">Đã giải quyết</option>
                                                <option value="CLOSED">Đã đóng</option>
                                            </select>
                                        ` : ''}
                                    </td>
                                    <td>${i.reporterName || '-'}</td>
                                    <td>${i.reportTime ? new Date(i.reportTime).toLocaleString('vi-VN') : (i.createdAt ? new Date(i.createdAt).toLocaleString('vi-VN') : '-')}</td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
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
            `;
        container.innerHTML = html;

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
                        <tbody>
                            ${data.map(s => {
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

                                return `
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
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;
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
                        <tbody>
                            ${data.map(u => `
                                <tr>
                                    <td>#${u.userId}</td>
                                    <td style="font-weight:600">${u.fullName}</td>
                                    <td>${u.email}</td>
                                    <td>${u.phoneNumber}</td>
                                    <td><span class="badge badge-purple">${u.roleName}</span></td>
                                    <td>${u.isActive ? '<span class="badge badge-green">Hoạt động</span>' : '<span class="badge badge-red">Khóa</span>'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;
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
            const capacity = occRes.success ? occRes.data.totalCapacity : 0;
            const occupied = occRes.success ? occRes.data.occupiedSlots : 0;
            const available = capacity - occupied;
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
                                        <h2 style="font-size: 1.8rem; font-weight: 800; margin-bottom: 8px;">${occRate.toFixed(1)}%</h2>
                                        <div style="display: flex; flex-direction: column; gap: 8px;">
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="width:10px; height:10px; border-radius:50%; background:var(--accent);"></span>
                                                <span style="font-size:0.85rem; color:var(--text-secondary);">Đang đỗ (${occupied})</span>
                                            </div>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <span style="width:10px; height:10px; border-radius:50%; background:#ecf2ff;"></span>
                                                <span style="font-size:0.85rem; color:var(--text-secondary);">Trống (${available})</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div id="occupancy-chart"></div>
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
                    chart: { type: 'donut', height: 150, fontFamily: 'Inter, sans-serif' },
                    colors: ['#f97316', '#ecf2ff'],
                    labels: ['Đang đỗ', 'Trống'],
                    plotOptions: { pie: { donut: { size: '75%' } } },
                    dataLabels: { enabled: false },
                    legend: { show: false },
                    stroke: { show: false },
                    tooltip: { theme: 'light' }
                };
                new ApexCharts(document.querySelector("#occupancy-chart"), occOptions).render();
            }

        } catch (e) {
            container.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Lỗi: ${e.message}</p></div>`;
        }
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
