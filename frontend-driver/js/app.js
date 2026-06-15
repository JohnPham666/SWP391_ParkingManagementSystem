/* ===== Driver App Core ===== */
const App = {
    state: { user: null, currentPage: 'home' },

    init() {
        const auth = Api.init();
        if (auth && auth.role === 'Driver') {
            this.state.user = auth;
            this.showApp();
        } else {
            Api.clearAuth();
            this.showLogin();
        }
        this.setupGlobal();
    },

    setupGlobal() {
        // Clock not needed for driver; toast setup
        document.addEventListener('click', (e) => {
            const dd = document.getElementById('user-dropdown');
            if (dd && !dd.classList.contains('hidden') && !e.target.closest('#user-menu-btn') && !e.target.closest('#user-dropdown')) {
                dd.classList.add('hidden');
            }
        });
    },

    showLogin() {
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    showRegister() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('register-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    showApp() {
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        const u = this.state.user;
        document.getElementById('header-user-name').textContent = u.fullName;
        document.getElementById('header-avatar').textContent = u.fullName.charAt(0).toUpperCase();
        this.navigate('home');
    },

    navigate(page) {
        this.state.currentPage = page;
        document.querySelectorAll('.bottom-nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.page === page);
        });
        this.renderPage(page);
    },

    async renderPage(page) {
        const c = document.getElementById('page-content');
        c.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        try {
            switch(page) {
                case 'home': await Pages.home(c); break;
                case 'parking': await Pages.parking(c); break;
                case 'vehicles': await Pages.vehicles(c); break;
                case 'reservations': await Pages.reservations(c); break;
                case 'account': await Pages.account(c); break;
                default: c.innerHTML = '<div class="empty-state"><p>Trang đang phát triển</p></div>';
            }
        } catch(e) {
            c.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Lỗi: ${e.message}</p></div>`;
        }
    },

    showToast(msg, type='info') {
        const ct = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        t.textContent = msg;
        ct.appendChild(t);
        setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 300); }, 3000);
    },

    logout() {
        Api.clearAuth();
        this.state.user = null;
        this.showLogin();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
