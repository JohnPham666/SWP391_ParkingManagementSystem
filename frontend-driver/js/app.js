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
        document.addEventListener('click', (e) => {
            const dd = document.getElementById('user-dropdown');
            if (dd && !dd.classList.contains('hidden') && !e.target.closest('#header-avatar') && !e.target.closest('#user-dropdown')) {
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    async renderPage(page) {
        const c = document.getElementById('page-content');
        c.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        try {
            switch (page) {
                case 'home': await Pages.home(c); break;
                case 'parking': await Pages.parking(c); break;
                case 'vehicles': await Pages.vehicles(c); break;
                case 'reservations': await Pages.reservations(c); break;
                case 'account': await Pages.account(c); break;
                case 'session': await Pages.session(c); break;
                case 'payment': await Pages.payment(c); break;
                case 'pricing': await Pages.pricing(c); break;
                case 'history': await Pages.history(c); break;
                case 'incident': await Pages.incident(c); break;
                default:
                    c.innerHTML = '<div class="empty-state"><p>Trang đang phát triển</p></div>';
            }
        } catch (e) {
            console.error(e);
            c.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Lỗi: ${e.message}</p></div>`;
        }
    },

    showToast(msg, type = 'info') {
        const ct = document.getElementById('toast-container');
        const t = document.createElement('div');
        t.className = `toast toast-${type}`;
        const icon = type === 'success'
            ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>'
            : type === 'error'
                ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>'
                : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>';
        t.innerHTML = `<div style="display:flex;align-items:center;gap:8px">${icon}<span>${msg}</span></div>`;
        ct.appendChild(t);
        setTimeout(() => {
            t.style.opacity = '0';
            t.style.transform = 'translateX(40px)';
            setTimeout(() => t.remove(), 300);
        }, 3000);
    },

    logout() {
        Api.clearAuth();
        this.state.user = null;
        this.showLogin();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
