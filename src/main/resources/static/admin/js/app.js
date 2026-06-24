import Api from './api.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderUsers } from './pages/users.js';
import { renderSettings } from './pages/settings.js';
import { renderLogs } from './pages/logs.js';

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
                case 'dashboard': await renderDashboard(c, this); break;
                case 'users': await renderUsers(c, this); break;
                case 'settings': await renderSettings(c, this); break;
                case 'logs': await renderLogs(c, this); break;
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
                case 'dashboard': await renderDashboard(container, this); break;
                case 'users': await renderUsers(container, this); break;
                case 'settings': await renderSettings(container, this); break;
                case 'logs': await renderLogs(container, this); break;
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

window.App = App;

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
