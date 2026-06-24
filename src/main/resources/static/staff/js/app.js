import Api from './api.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderSessions } from './pages/sessions.js';
import { renderSlots } from './pages/slots.js';
import { renderVehicles } from './pages/vehicles.js';
import { renderReservations } from './pages/reservations.js';
import { renderPayments } from './pages/payments.js';
import { renderIncidents } from './pages/incidents.js';
import { renderUsers } from './pages/users.js';
import { renderReports } from './pages/reports.js';
import { renderSubscriptions } from './pages/subscriptions.js';

/* ===== Core Application Logic (App Shell & Router) ===== */
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
        
        // Setup Hash Router
        window.addEventListener('hashchange', () => this.handleRouteChange());

        // Auto Refresh Polling
        setInterval(() => {
            if (!this.state.user) return;
            const openModals = document.querySelectorAll('.modal-overlay:not(.hidden)');
            if (openModals.length > 0) return;
            const active = document.activeElement;
            if (active && (active.tagName === 'INPUT' || active.tagName === 'SELECT' || active.tagName === 'TEXTAREA')) return;
            this.silentRefresh();
        }, 10000);
    },

    handleRouteChange() {
        if (!this.state.user) return;
        
        let hash = window.location.hash.substring(1); // Remove '#'
        if (!hash) hash = 'dashboard';
        
        this.navigate(hash, false);
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

        // Trigger initial route
        this.handleRouteChange();
    },

    navigate(page, updateHash = true) {
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
        
        // Update active class in sidebar
        document.querySelectorAll('.nav-item').forEach(el => {
            el.classList.remove('active');
            if (el.dataset.page === page) {
                el.classList.add('active');
            }
        });

        // Update URL hash without triggering hashchange event loop
        if (updateHash && window.location.hash !== `#${page}`) {
            window.history.pushState(null, null, `#${page}`);
        }

        this.renderPage(page);
    },

    async renderPage(page) {
        const container = document.getElementById('page-content');
        container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        
        try {
            switch(page) {
                case 'dashboard': await renderDashboard(container, this); break;
                case 'sessions': await renderSessions(container, this); break;
                case 'slots': await renderSlots(container, this); break;
                case 'vehicles': await renderVehicles(container, this); break;
                case 'reservations': await renderReservations(container, this); break;
                case 'payments': await renderPayments(container, this); break;
                case 'subscriptions': await renderSubscriptions(container, this); break;
                case 'incidents': await renderIncidents(container, this); break;
                case 'users': await renderUsers(container, this); break;
                case 'reports': await renderReports(container, this); break;
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

    async silentRefresh() {
        if (!this.state.user) return;
        try {
            const searchInput = document.querySelector('.search-input');
            const searchValue = searchInput ? searchInput.value : '';
            
            const c = document.getElementById('page-content');
            switch (this.state.currentPage) {
                case 'dashboard': await renderDashboard(c, this); break;
                case 'sessions': await renderSessions(c, this); break;
                case 'slots': await renderSlots(c, this); break;
                case 'vehicles': await renderVehicles(c, this); break;
                case 'reservations': await renderReservations(c, this); break;
                case 'payments': await renderPayments(c, this); break;
                case 'subscriptions': await renderSubscriptions(c, this); break;
                case 'incidents': await renderIncidents(c, this); break;
                case 'users': await renderUsers(c, this); break;
                case 'reports': await renderReports(c, this); break;
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
                if (res.data.role !== 'ParkingStaff' && res.data.role !== 'Admin') {
                    err.textContent = 'Bạn không có quyền truy cập giao diện nhân viên.';
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
            window.location.hash = ''; // clear hash
            this.showLogin();
        });

        // Navigation (Clicking on sidebar items)
        document.querySelectorAll('.nav-item').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                this.navigate(page, true);
                
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
    }
};

// Expose App to window globally so legacy scripts/handlers (if any) can access it
window.App = App;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
