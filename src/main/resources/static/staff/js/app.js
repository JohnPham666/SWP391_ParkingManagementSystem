/* ===== Core Application Logic ===== */
// App: –?i tu?ng qu?n l˝ to‡n b? tr?ng th·i, kh?i t?o, v‡ d?nh tuy?n (routing) c?a trang web
const App = {
    state: {
        user: null,
        currentPage: 'dashboard'
    },
    // Kh?i t?o h? th?ng: Thi?t l?p s? ki?n, ki?m tra dang nh?p v‡ b?t d?u vÚng l?p auto-refresh
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
    // L‡m m?i d? li?u ng?m (Auto-refresh) m?i 10 gi‚y m‡ khÙng l‡m ch?p m‡n hÏnh (gi? nguyÍn tr?i nghi?m ngu?i d˘ng)
    async silentRefresh() {
        if (!this.state.user) return;
        try {
            const searchInput = document.querySelector('.search-input');
            const searchValue = searchInput ? searchInput.value : '';
            
            const c = document.getElementById('page-content');
            switch (this.state.currentPage) {
                case 'dashboard': await Pages.renderDashboard(c); break;
                case 'sessions': await Pages.renderSessions(c); break;
                case 'slots': await Pages.renderSlots(c); break;
                case 'reservations': await Pages.renderReservations(c); break;
                case 'payments': await Pages.renderPayments(c); break;
                case 'subscriptions': await Pages.renderSubscriptions(c); break;
                case 'incidents': await Pages.renderIncidents(c); break;
                case 'users': await Pages.renderUsers(c); break;
                case 'reports': await Pages.renderReports(c); break;
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
    // Thi?t l?p t?t c? c·c s? ki?n tuong t·c chung (click, submit) trÍn to‡n trang (Login, Sidebar, Logout)
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
                    err.textContent = 'B·∫°n kh√¥ng c√≥ quy·ªÅn truy c·∫≠p giao di·ªán nh√¢n vi√™n.';
                    err.classList.remove('hidden');
                    // Optional: auto logout or just prevent login
                    return;
                }
                Api.saveAuth(res.data);
                this.state.user = res.data;
                this.showApp();
            } else {
                err.textContent = res.message || 'ƒêƒÉng nh·∫≠p th·∫•t b·∫°i';
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
    // Hi?n th? m‡n hÏnh –ang nh?p v‡ ?n giao di?n App chÌnh
    showLogin() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-password').value = '';
    },
    // Hi?n th? giao di?n App chÌnh sau khi dang nh?p th‡nh cÙng v‡ khÙi ph?c trang cu?i c˘ng ngu?i d˘ng xem
    showApp() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        
        // Update user info
        const user = this.state.user;
        document.getElementById('sidebar-user-name').textContent = user.fullName;
        document.getElementById('sidebar-user-role').textContent = user.role;
        document.getElementById('user-avatar').textContent = user.fullName.charAt(0).toUpperCase();

        const savedPage = localStorage.getItem('staffCurrentPage') || 'dashboard';
        this.navigate(savedPage);
    },
    // H‡m di?u hu?ng (Routing) chuy?n d?i gi?a c·c trang tÌnh nang trong Sidebar
    navigate(page) {
        this.state.currentPage = page;
        localStorage.setItem('staffCurrentPage', page);
        
        // Update sidebar active state
        document.querySelectorAll('.nav-item').forEach(n => {
            if (n.dataset.page === page) {
                n.classList.add('active');
            } else {
                n.classList.remove('active');
            }
        });

        const titles = {
            'dashboard': 'Dashboard',
            'sessions': 'Qu·∫£n l√Ω phi√™n g·ª≠i xe',
            'slots': 'Qu·∫£n l√Ω ch·ªó ƒë·ªó xe',
            'reservations': 'Qu·∫£n l√Ω ƒë·∫∑t ch·ªó',
            'payments': 'Qu·∫£n l√Ω thanh to√°n',
            'subscriptions': 'Qu·∫£n l√Ω v√© th√°ng',
            'incidents': 'Qu·∫£n l√Ω s·ª± c·ªë',
            'users': 'Qu·∫£n l√Ω ng∆∞·ªùi d√πng',
            'reports': 'B√°o c√°o th·ªëng k√™'
        };
        
        document.getElementById('page-title').textContent = titles[page] || page;
        this.renderPage(page);
    },
    // G?i c·c h‡m render tuong ?ng t? d?i tu?ng 'Pages' d?a trÍn tÍn trang dang du?c ch?n
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
                            <p>T√≠nh nƒÉng <b>${page}</b> ƒëang ƒë∆∞·ª£c ph√°t tri·ªÉn.</p>
                        </div>
                    `;
            }
        } catch (e) {
            container.innerHTML = `
                <div class="empty-state">
                    <p style="color: var(--red)">ƒê√£ x·∫£y ra l·ªói khi t·∫£i trang: ${e.message}</p>
                </div>
            `;
        }
    },
    // Hi?n th? thÙng b·o (Toast) gÛc trÍn c˘ng m‡n hÏnh (th‡nh cÙng, l?i, c?nh b·o)
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



// Initialize App
window.App = App;
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});


