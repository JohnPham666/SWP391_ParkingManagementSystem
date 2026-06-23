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
        
        // Auto Refresh Polling
        setInterval(() => {
            if (!this.state.user) return;
            const openModals = document.querySelectorAll('.modal:not(.hidden)');
            if (openModals.length > 0) return;
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) return;
            this.silentRefresh();
        }, 10000);
    },

    async silentRefresh() {
        if (!this.state.user) return;
        try {
            const searchInput = document.querySelector('.search-input');
            const searchValue = searchInput ? searchInput.value : '';
            
            const c = document.getElementById('page-content');
            switch (this.state.currentPage) {
                case 'dashboard': await this.renderDashboard(c); break;
                case 'sessions': await this.renderSessions(c); break;
                case 'slots': await this.renderSlots(c); break;
                case 'vehicles': await this.renderVehicles(c); break;
                case 'reservations': await this.renderReservations(c); break;
                case 'payments': await this.renderPayments(c); break;
                case 'subscriptions': await this.renderSubscriptions(c); break;
                case 'incidents': await this.renderIncidents(c); break;
                case 'users': await this.renderUsers(c); break;
                case 'reports': await this.renderReports(c); break;
                case 'buildings': await this.renderBuildings(c); break;
                case 'pricing': await this.renderPricing(c); break;
            }

            if (searchValue) {
                const newSearch = document.querySelector('.search-input');
                if (newSearch) {
                    newSearch.value = searchValue;
                    newSearch.dispatchEvent(new Event('input'));
                }
            }
        } catch(e) { console.error('Silent refresh failed:', e); }
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
                if (res.data.role !== 'ParkingManager' && res.data.role !== 'Admin') {
                    err.textContent = 'Bạn không có quyền truy cập giao diện Quản lý.';
                    err.classList.remove('hidden');
                    return;
                }
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

        // Managers always see everything, no need to hide
        const navUsers = document.getElementById('nav-users');
        if (navUsers) navUsers.classList.add('hidden'); // Hide users for Manager
        
        const navReports = document.getElementById('nav-reports');
        if (navReports) navReports.classList.remove('hidden');

        window.addEventListener('hashchange', () => this.handleHashChange());
        
        if (!window.location.hash) {
            window.location.hash = '#dashboard';
        } else {
            this.handleHashChange();
        }
    },

    handleHashChange() {
        let hash = window.location.hash.substring(1);
        if (!hash) hash = 'dashboard';
        this.navigateInternal(hash);
    },

    navigate(page) {
        window.location.hash = '#' + page;
    },

    navigateInternal(page) {
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
            'reports': 'Báo cáo thống kê',
            'buildings': 'Cấu hình Bãi đỗ xe',
            'pricing': 'Chính sách Giá'
        };
        
        document.getElementById('page-title').textContent = titles[page] || page;
        
        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(n => {
            n.classList.remove('active');
            if (n.dataset.page === page) {
                n.classList.add('active');
            }
        });

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
                case 'buildings':
                    await Pages.renderBuildings(container);
                    break;
                case 'pricing':
                    await Pages.renderPricing(container);
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

            <div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h3 class="card-title">Cấu trúc Tòa nhà Đỗ xe</h3>
                    <div class="toolbar">
                        <select id="db-filter-status" class="form-control" style="width: 150px; display: inline-block;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="AVAILABLE">Trống</option>
                            <option value="OCCUPIED">Đang đỗ</option>
                            <option value="RESERVED">Đã đặt</option>
                            <option value="LOCKED">Khóa (Bảo trì)</option>
                        </select>
                        <select id="db-filter-type" class="form-control" style="width: 150px; display: inline-block;">
                            <option value="">Tất cả loại xe</option>
                        </select>
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
                            let onclick = '';
                            if (s.status === 'AVAILABLE') onclick = `onclick="window.updateSlotStatus(${s.slotId}, 'LOCKED')"`;
                            if (s.status === 'LOCKED') onclick = `onclick="window.updateSlotStatus(${s.slotId}, 'AVAILABLE')"`;
                            
                            html += `
                                <div class="slot-cell ${statusClass}" title="${s.vehicleTypeName}" data-status="${s.status}" data-type="${s.vehicleTypeName}" style="${onclick ? 'cursor: pointer;' : ''}" ${onclick}>
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

        // Populate Vehicle Types in filter
        const typeSelect = document.getElementById('db-filter-type');
        if (typeSelect) {
            const vtypesRes = await Api.getVehicleTypes();
            if(vtypesRes.success && vtypesRes.data) {
                vtypesRes.data.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.typeName;
                    opt.textContent = t.typeName;
                    typeSelect.appendChild(opt);
                });
            }

            // Filter logic
            const statusFilter = document.getElementById('db-filter-status');
            const applyFilter = () => {
                const sVal = statusFilter.value;
                const tVal = typeSelect.value;
                document.querySelectorAll('.slot-cell').forEach(cell => {
                    const st = cell.getAttribute('data-status');
                    const ty = cell.getAttribute('data-type');
                    let show = true;
                    if (sVal && st !== sVal) show = false;
                    if (tVal && ty !== tVal) show = false;
                    cell.style.display = show ? 'flex' : 'none';
                });
            };
            statusFilter.addEventListener('change', applyFilter);
            typeSelect.addEventListener('change', applyFilter);
        }

        window.updateSlotStatus = async (id, status) => {
            if(!confirm(`Xác nhận chuyển trạng thái slot thành ${status}?`)) return;
            const r = await Api.updateSlotStatus(id, { status: status });
            if(r.success) {
                App.showToast('Cập nhật trạng thái slot thành công', 'success');
                App.renderPage('dashboard');
            } else {
                App.showToast(r.message || 'Lỗi cập nhật trạng thái', 'error');
            }
        };
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

        container.innerHTML = html;

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
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody id="slots-tbody">
        `;

        data.forEach(s => {
            let statusBadge = '';
            let actionBtn = '';
            switch(s.status) {
                case 'AVAILABLE': 
                    statusBadge = '<span class="badge badge-green">Trống</span>'; 
                    actionBtn = `<button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.8rem;" onclick="window.updateSlotStatus(${s.slotId}, 'LOCKED')">Khóa</button>`;
                    break;
                case 'OCCUPIED': 
                    statusBadge = '<span class="badge badge-red">Đã đầy</span>'; 
                    break;
                case 'RESERVED': 
                    statusBadge = '<span class="badge badge-yellow">Đã đặt</span>'; 
                    break;
                case 'LOCKED': 
                    statusBadge = '<span class="badge badge-gray">Khóa</span>'; 
                    actionBtn = `<button class="btn btn-primary" style="padding: 2px 8px; font-size: 0.8rem;" onclick="window.updateSlotStatus(${s.slotId}, 'AVAILABLE')">Mở</button>`;
                    break;
                default: 
                    statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
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
                    <td>${actionBtn}</td>
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

        window.updateSlotStatus = async (id, status) => {
            if(!confirm(`Xác nhận chuyển trạng thái slot thành ${status}?`)) return;
            const r = await Api.updateSlotStatus(id, { status: status });
            if(r.success) {
                App.showToast('Cập nhật trạng thái slot thành công', 'success');
                App.renderPage('slots');
            } else {
                App.showToast(r.message || 'Lỗi cập nhật trạng thái', 'error');
            }
        };
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

                                return `
                                <tr>
                                    <td>#${r.reservationId}</td>
                                    <td>${r.userName || '-'}</td>
                                    <td>${r.licensePlate || '-'}</td>
                                    <td>${r.slotCode || '-'}</td>
                                    <td>${new Date(r.startTime).toLocaleString('vi-VN')}</td>
                                    <td>${new Date(r.endTime).toLocaleString('vi-VN')}</td>
                                    <td>${badge}</td>
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

    async renderPayments(container, page = 0, size = 10) {
        const res = await Api.getPayments(page, size);
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const pageData = res.data;
        const data = pageData.content;
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Lịch sử thanh toán</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Mã TT</th><th>Loại thanh toán</th><th>Khách hàng</th><th>Biển số</th><th>Số tiền</th><th>Phương thức</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
                        <tbody>
                            ${data.map(p => {
                                let badge = '';
                                switch(p.paymentStatus) {
                                    case 'PENDING': badge = '<span class="badge badge-yellow">Đang chờ</span>'; break;
                                    case 'SUCCESS': badge = '<span class="badge badge-green">Thành công</span>'; break;
                                    case 'PAID': badge = '<span class="badge badge-green">Đã thanh toán</span>'; break;
                                    case 'FAILED': badge = '<span class="badge badge-red">Thất bại</span>'; break;
                                    default: badge = `<span class="badge badge-gray">${p.paymentStatus}</span>`;
                                }
                                let type = p.sessionId ? 'Phiên gửi xe' : (p.reservationId ? 'Đặt chỗ' : 'Khác');
                                return `
                                <tr>
                                    <td>#${p.paymentId}</td>
                                    <td>${type}</td>
                                    <td>
                                        <div style="font-weight: 500">${p.customerName || '-'}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted)">${p.customerPhone || ''}</div>
                                    </td>
                                    <td style="font-weight: 600">${p.licensePlate || '-'}</td>
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
                <div class="card-footer" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        Hiển thị ${(pageData.pageNo * pageData.pageSize) + (data.length > 0 ? 1 : 0)} - ${(pageData.pageNo * pageData.pageSize) + data.length} trong số ${pageData.totalElements} bản ghi
                    </div>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-outline" ${pageData.pageNo === 0 ? 'disabled' : ''} onclick="Pages.renderPayments(document.getElementById('page-content'), ${pageData.pageNo - 1}, ${size})">Trước</button>
                        <button class="btn btn-outline" ${pageData.last ? 'disabled' : ''} onclick="Pages.renderPayments(document.getElementById('page-content'), ${pageData.pageNo + 1}, ${size})">Sau</button>
                    </div>
                </div>
            </div>`;
        container.innerHTML = html;

        window.confirmPayment = async (id) => {
            if(confirm('Xác nhận đã thu tiền mặt cho giao dịch này?')) {
                const r = await Api.confirmCash(id);
                if(r.success) {
                    App.showToast('Xác nhận thanh toán thành công', 'success');
                    Pages.renderPayments(container, page, size);
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

                                return `
                                <tr>
                                    <td>#${i.incidentId}</td>
                                    <td style="font-weight:600">${i.title || i.description || '-'}</td>
                                    <td>${sevBadge}</td>
                                    <td>${i.incidentType || '-'}</td>
                                    <td>${statBadge}</td>
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
                // Fix UTC timezone shift issue
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                return paidPayments.filter(p => p.paidAt && p.paidAt.startsWith(dateStr))
                    .reduce((sum, p) => sum + p.amount, 0);
            });

            // Doanh thu tháng này
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const monthlyRevenue = paidPayments
                .filter(p => {
                    if (!p.paidAt) return false;
                    const pDate = new Date(p.paidAt);
                    return pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
                })
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
    },

    async renderBuildings(container) {
        const res = await Api.getBuildings();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data || [];
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Cấu hình Bãi đỗ xe (Buildings & Zones)</h3>
                    <div class="toolbar">
                        <button class="btn btn-primary" onclick="alert('Tính năng thêm tòa nhà đang phát triển')">Thêm Tòa nhà</button>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Tên Tòa nhà</th><th>Địa chỉ</th><th>Số tầng</th><th>Giờ hoạt động</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            ${data.map(b => `
                                <tr>
                                    <td>#${b.buildingId}</td>
                                    <td style="font-weight:600">${b.buildingName}</td>
                                    <td>${b.address || '-'}</td>
                                    <td>${b.totalFloors || 0}</td>
                                    <td>${b.operatingStartTime ? b.operatingStartTime.substring(0,5) : '-'} đến ${b.operatingEndTime ? b.operatingEndTime.substring(0,5) : '-'}</td>
                                    <td>
                                        <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.8rem;" onclick="alert('Tính năng chỉnh sửa đang phát triển')">Sửa</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;
    },

    async renderPricing(container) {
        const res = await Api.getPricingPolicies();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data || [];
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Chính sách Giá (Pricing Policies)</h3>
                    <div class="toolbar">
                        <button class="btn btn-primary" onclick="alert('Tính năng thêm chính sách đang phát triển')">Thêm Chính sách</button>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Loại xe</th><th>Tên chính sách</th><th>Giá cơ bản (VND)</th><th>Phí mỗi giờ</th><th>Giá ngày (Max)</th><th>Giá tháng</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            ${data.map(p => `
                                <tr>
                                    <td><span class="badge badge-purple">${p.vehicleTypeName || '-'}</span></td>
                                    <td style="font-weight:600">${p.policyName}</td>
                                    <td>${p.basePrice ? p.basePrice.toLocaleString() : '0'} đ</td>
                                    <td>${p.hourlyRate ? p.hourlyRate.toLocaleString() : '0'} đ</td>
                                    <td>${p.maxDailyRate ? p.maxDailyRate.toLocaleString() : '0'} đ</td>
                                    <td>${p.monthlyRate ? p.monthlyRate.toLocaleString() : '0'} đ</td>
                                    <td>
                                        <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.8rem;" onclick="alert('Tính năng chỉnh sửa đang phát triển')">Sửa</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
