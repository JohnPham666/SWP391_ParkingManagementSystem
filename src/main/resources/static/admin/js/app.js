/* ===== Core Application Logic (Admin) ===== */
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

    async silentRefresh() {
        if (!this.state.user) return;
        try {
            const c = document.getElementById('page-content');
            switch (this.state.currentPage) {
                case 'dashboard': await Pages.renderDashboard(c); break;
                case 'users': await Pages.renderUsers(c); break;
                case 'settings': await Pages.renderSettings(c); break;
                case 'logs': await Pages.renderLogs(c); break;
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
                if (res.data.role !== 'Admin') {
                    err.textContent = 'Bạn không có quyền truy cập giao diện Quản trị viên (Admin).';
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

        // Sidebar toggle
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
        
        const user = this.state.user;
        document.getElementById('sidebar-user-name').textContent = user.fullName;
        document.getElementById('sidebar-user-role').textContent = user.role;
        document.getElementById('user-avatar').textContent = user.fullName.charAt(0).toUpperCase();

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
            'dashboard': 'Admin Dashboard',
            'users': 'Quản lý Tài Khoản',
            'settings': 'Cấu hình Hệ thống',
            'logs': 'System Logs (Monitor)'
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
                case 'dashboard': await Pages.renderDashboard(container); break;
                case 'users': await Pages.renderUsers(container); break;
                case 'settings': await Pages.renderSettings(container); break;
                case 'logs': await Pages.renderLogs(container); break;
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
        let html = `
            <div class="stats-grid">
                <div class="stat-card" style="cursor: pointer;" onclick="App.navigate('users')">
                    <div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
                    <div class="stat-info">
                        <h3>Quản trị User</h3>
                        <p>Thêm Staff, Manager</p>
                    </div>
                </div>
                <div class="stat-card" style="cursor: pointer;" onclick="App.navigate('settings')">
                    <div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                    <div class="stat-info">
                        <h3>Bảo mật</h3>
                        <p>Phân quyền truy cập</p>
                    </div>
                </div>
                <div class="stat-card" style="cursor: pointer;" onclick="App.navigate('logs')">
                    <div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg></div>
                    <div class="stat-info">
                        <h3>Hệ thống Logs</h3>
                        <p>Theo dõi hoạt động</p>
                    </div>
                </div>
            </div>
            
            <div class="card mt-4">
                <div class="card-header">
                    <h3 class="card-title">Welcome to Admin Dashboard</h3>
                </div>
                <div class="card-body">
                    <p>Chào mừng System Administrator. Tại đây bạn có thể quản lý tài khoản nhân viên (Staff), quản lý cấp cao (Manager), cũng như xem cấu hình và log của hệ thống.</p>
                </div>
            </div>
        `;
        container.innerHTML = html;
    },

    async renderUsers(container) {
        const res = await Api.getUsers();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }

        // Fetch Roles for mapping
        const rolesRes = await Api.getRoles();
        let rolesMap = {};
        let rolesOptions = '';
        if (rolesRes.success && rolesRes.data) {
            rolesRes.data.forEach(r => {
                rolesMap[r.roleName] = r.roleId;
                rolesOptions += `<option value="${r.roleId}">${r.roleName}</option>`;
            });
        }

        let users = res.data;
        // Sort users by createdAt descending
        users.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        
        // Save to state for edit modal
        App.state.usersList = users;
        App.state.rolesOptions = rolesOptions;

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách Người dùng</h3>
                    <div class="toolbar" style="flex: 1; justify-content: flex-end; display: flex; gap: 10px;">
                        <select id="filter-role" class="form-control" style="width: 150px;">
                            <option value="">Tất cả Role</option>
                            ${rolesOptions}
                        </select>
                        <select id="filter-status" class="form-control" style="width: 160px;">
                            <option value="">Tất cả Trạng thái</option>
                            <option value="true">Hoạt động</option>
                            <option value="false">Đã khóa</option>
                        </select>
                        <input type="text" id="filter-search" class="search-input form-control" placeholder="Tìm tên, email, sđt..." style="width: 220px;" />
                        
                        <button class="btn btn-primary" onclick="window.showCreateUserModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Tạo Tài Khoản
                        </button>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Họ Tên</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Role</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody id="users-tbody">
                            <!-- Render by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Create User Modal -->
            <div id="create-user-modal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Tạo Tài Khoản Nhân Viên / Quản Lý</h3>
                        <button class="modal-close" onclick="document.getElementById('create-user-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                    <form id="create-user-form">
                        <div class="modal-body form-grid">
                            <div class="form-group full-width">
                                <label>Họ và Tên *</label>
                                <input type="text" id="cu-fullname" required />
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="cu-email" required />
                            </div>
                            <div class="form-group">
                                <label>Số điện thoại *</label>
                                <input type="text" id="cu-phone" required />
                            </div>
                            <div class="form-group">
                                <label>Mật khẩu tạm *</label>
                                <input type="password" id="cu-password" required />
                            </div>
                            <div class="form-group">
                                <label>Role (Quyền) *</label>
                                <select id="cu-role" required>
                                    <option value="">-- Chọn Role --</option>
                                    ${rolesOptions}
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('create-user-modal').classList.add('hidden')">Hủy</button>
                            <button type="submit" class="btn btn-primary">Tạo mới</button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Edit User Modal -->
            <div id="edit-user-modal" class="modal-overlay hidden">
                <div class="modal">
                    <div class="modal-header">
                        <h3>Chỉnh sửa Tài Khoản</h3>
                        <button class="modal-close" onclick="document.getElementById('edit-user-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                    <form id="edit-user-form">
                        <input type="hidden" id="eu-id" />
                        <div class="modal-body form-grid">
                            <div class="form-group full-width">
                                <label>Họ và Tên *</label>
                                <input type="text" id="eu-fullname" required />
                            </div>
                            <div class="form-group">
                                <label>Email *</label>
                                <input type="email" id="eu-email" required />
                            </div>
                            <div class="form-group">
                                <label>Số điện thoại *</label>
                                <input type="text" id="eu-phone" required />
                            </div>
                            <div class="form-group">
                                <label>Role (Quyền) *</label>
                                <select id="eu-role" required>
                                    <option value="">-- Chọn Role --</option>
                                    ${rolesOptions}
                                </select>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-outline" onclick="document.getElementById('edit-user-modal').classList.add('hidden')">Hủy</button>
                            <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        container.innerHTML = html;

        const renderTable = () => {
            const tbody = document.getElementById('users-tbody');
            const searchVal = document.getElementById('filter-search').value.toLowerCase();
            const roleSelect = document.getElementById('filter-role');
            const roleVal = roleSelect.options.length > 0 && roleSelect.selectedIndex >= 0 ? roleSelect.options[roleSelect.selectedIndex].text : "";
            const statusVal = document.getElementById('filter-status').value;
            const roleFilter = document.getElementById('filter-role').value;

            let filtered = users.filter(u => {
                const textMatch = (u.fullName && u.fullName.toLowerCase().includes(searchVal)) || 
                                  (u.email && u.email.toLowerCase().includes(searchVal)) || 
                                  (u.phoneNumber && u.phoneNumber.includes(searchVal));
                
                let roleMatch = true;
                if (roleFilter !== "") {
                    roleMatch = u.roleName === roleVal;
                }

                let statusMatch = true;
                if (statusVal !== "") {
                    statusMatch = (u.isActive.toString() === statusVal);
                }

                return textMatch && roleMatch && statusMatch;
            });

            tbody.innerHTML = filtered.map(u => `
                <tr>
                    <td>#${u.userId}</td>
                    <td style="font-weight:600">${u.fullName}</td>
                    <td>${u.email}</td>
                    <td>${u.phoneNumber || '-'}</td>
                    <td><span class="badge badge-gray">${u.roleName || 'N/A'}</span></td>
                    <td>${u.isActive ? '<span class="badge badge-green">Hoạt động</span>' : '<span class="badge badge-red">Đã khóa</span>'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline" onclick="window.showEditUserModal(${u.userId})" title="Sửa" style="padding: 4px 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
                        <button class="btn btn-sm ${u.isActive ? 'btn-danger' : 'btn-success'}" onclick="window.updateUserStatus(${u.userId}, ${!u.isActive})" title="${u.isActive ? 'Khóa' : 'Mở khóa'}" style="padding: 4px 8px; margin-left: 5px;">
                            ${u.isActive ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>'}
                        </button>
                    </td>
                </tr>
            `).join('');
        };

        renderTable();

        document.getElementById('filter-search').addEventListener('input', renderTable);
        document.getElementById('filter-role').addEventListener('change', renderTable);
        document.getElementById('filter-status').addEventListener('change', renderTable);

        window.showCreateUserModal = () => document.getElementById('create-user-modal').classList.remove('hidden');

        window.showEditUserModal = (id) => {
            const user = App.state.usersList.find(u => u.userId === id);
            if (user) {
                document.getElementById('eu-id').value = user.userId;
                document.getElementById('eu-fullname').value = user.fullName;
                document.getElementById('eu-email').value = user.email;
                document.getElementById('eu-phone').value = user.phoneNumber || '';
                
                const roleSelect = document.getElementById('eu-role');
                for (let i = 0; i < roleSelect.options.length; i++) {
                    if (roleSelect.options[i].text === user.roleName) {
                        roleSelect.selectedIndex = i;
                        break;
                    }
                }
                
                document.getElementById('edit-user-modal').classList.remove('hidden');
            }
        };

        window.updateUserStatus = async (id, isActive) => {
            if (confirm(isActive ? 'Bạn có chắc chắn muốn MỞ KHÓA tài khoản này?' : 'Bạn có chắc chắn muốn KHÓA tài khoản này?')) {
                const r = await Api.updateUserStatus(id, isActive);
                if (r.success) {
                    App.showToast('Cập nhật trạng thái thành công', 'success');
                    App.renderPage('users');
                } else {
                    App.showToast(r.message || 'Lỗi khi cập nhật trạng thái', 'error');
                }
            }
        };

        document.getElementById('create-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                fullName: document.getElementById('cu-fullname').value,
                email: document.getElementById('cu-email').value,
                phoneNumber: document.getElementById('cu-phone').value,
                password: document.getElementById('cu-password').value,
                roleId: parseInt(document.getElementById('cu-role').value)
            };
            
            const r = await Api.createUser(payload);
            if (r.success) {
                App.showToast('Tạo tài khoản thành công', 'success');
                document.getElementById('create-user-modal').classList.add('hidden');
                App.renderPage('users'); // refresh
            } else {
                App.showToast(r.message || 'Lỗi khi tạo', 'error');
            }
        });

        document.getElementById('edit-user-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('eu-id').value;
            const payload = {
                fullName: document.getElementById('eu-fullname').value,
                email: document.getElementById('eu-email').value,
                phoneNumber: document.getElementById('eu-phone').value,
                roleId: parseInt(document.getElementById('eu-role').value)
            };
            
            const r = await Api.updateUser(id, payload);
            if (r.success) {
                App.showToast('Cập nhật tài khoản thành công', 'success');
                document.getElementById('edit-user-modal').classList.add('hidden');
                App.renderPage('users'); // refresh
            } else {
                App.showToast(r.message || 'Lỗi khi cập nhật', 'error');
            }
        });
    },

    async renderSettings(container) {
        // Mock UI for settings
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Cấu hình Hệ thống (System Configuration)</h3>
                </div>
                <div class="card-body">
                    <form id="settings-form" class="form-grid">
                        <div class="form-group full-width">
                            <label>Tên Hệ Thống</label>
                            <input type="text" value="ParkSmart Management System" />
                        </div>
                        <div class="form-group full-width">
                            <label>Chế độ bảo trì hệ thống</label>
                            <select>
                                <option value="off" selected>Tắt (Hoạt động bình thường)</option>
                                <option value="on">Bật (Chỉ Admin truy cập được)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Thời gian lưu trữ Session Logs (Ngày)</label>
                            <input type="number" value="30" />
                        </div>
                        <div class="form-group">
                            <label>Cổng Email (SMTP Server)</label>
                            <input type="text" value="smtp.parking.vn" />
                        </div>
                        <div class="form-group full-width" style="margin-top: 20px;">
                            <button type="submit" class="btn btn-primary">Lưu Cấu Hình</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        container.innerHTML = html;

        document.getElementById('settings-form').addEventListener('submit', (e) => {
            e.preventDefault();
            App.showToast('Đã cập nhật cấu hình hệ thống (Mock)', 'success');
        });
    },

    async renderLogs(container) {
        // Mock Logs data
        const mockLogs = [
            { time: new Date().toLocaleString('vi-VN'), type: 'SECURITY', msg: 'System Administrator logged in successfully', user: 'admin@parking.vn' },
            { time: new Date(Date.now() - 15*60000).toLocaleString('vi-VN'), type: 'INFO', msg: 'New ParkingStaff account created: Tuan NV', user: 'admin@parking.vn' },
            { time: new Date(Date.now() - 120*60000).toLocaleString('vi-VN'), type: 'WARNING', msg: 'Multiple failed login attempts detected', user: 'lan.manager@parking.vn' },
            { time: new Date(Date.now() - 200*60000).toLocaleString('vi-VN'), type: 'SYSTEM', msg: 'Database connection refreshed automatically', user: 'SYSTEM' },
            { time: new Date(Date.now() - 1440*60000).toLocaleString('vi-VN'), type: 'INFO', msg: 'System configurations updated', user: 'admin@parking.vn' }
        ];

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">System Monitoring & Logs</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Thời gian</th>
                                <th>Loại Event</th>
                                <th>Mô tả / Thao tác</th>
                                <th>User thực hiện</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${mockLogs.map(l => {
                                let badge = 'badge-gray';
                                if (l.type === 'SECURITY') badge = 'badge-blue';
                                else if (l.type === 'WARNING') badge = 'badge-yellow';
                                else if (l.type === 'INFO') badge = 'badge-green';
                                
                                return `
                                    <tr>
                                        <td>${l.time}</td>
                                        <td><span class="badge ${badge}">${l.type}</span></td>
                                        <td>${l.msg}</td>
                                        <td>${l.user}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        container.innerHTML = html;
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
