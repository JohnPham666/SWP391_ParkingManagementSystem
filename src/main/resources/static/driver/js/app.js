/* ===== Landing Hero Carousel ===== */
const HeroCarousel = {
    images: [
        { src: 'assets/images/hero/parking-hero-1.jpg', alt: 'Bãi đỗ xe tự động nhiều tầng' },
        { src: 'assets/images/hero/parking-hero-2.jpg', alt: 'Hệ thống bãi đỗ xe xoay vòng hiện đại' },
        { src: 'assets/images/hero/parking-hero-3.jpg', alt: 'Tòa nhà bãi đỗ xe về đêm' },
        { src: 'assets/images/hero/parking-hero-4.jpg', alt: 'Bãi đỗ xe ngoài trời đông phương tiện' },
        { src: 'assets/images/hero/parking-hero-5.jpg', alt: 'Thang nâng xe trong bãi đỗ tự động' }
    ],
    currentIndex: 0,
    intervalId: null,
    touchStartX: 0,
    isBuilt: false,
    transitionTimer: null,

    init() {
        if (!document.getElementById('hero-card-stack')) return;
        this.build();
        this.update();
        this.setupTouch();
        this.start();
    },

    build() {
        if (this.isBuilt) return;
        const stack = document.getElementById('hero-card-stack');
        const dots = document.getElementById('hero-carousel-dots');
        if (!stack || !dots) return;

        stack.innerHTML = `
            ${this.images.map((image, index) => `
                <figure class="hero-card" data-hero-index="${index}" aria-hidden="true">
                    <img src="${image.src}" alt="${image.alt}" loading="${index === 0 ? 'eager' : 'lazy'}">
                </figure>
            `).join('')}
            <div class="hero-parking-icon" aria-hidden="true">P</div>
        `;

        dots.innerHTML = this.images.map((_, index) => `
            <button class="hero-dot" type="button" onclick="HeroCarousel.goTo(${index})" aria-label="Chọn ảnh ${index + 1}"></button>
        `).join('');

        this.isBuilt = true;
    },

    update() {
        const carousel = document.getElementById('hero-carousel');
        const cards = document.querySelectorAll('.hero-card');
        const dots = document.querySelectorAll('.hero-dot');
        if (!carousel || !cards.length || !dots.length) return;

        carousel.classList.add('is-transitioning');
        cards.forEach((card, index) => {
            const stateClass = this.getCardClass(index);
            card.className = `hero-card ${stateClass}`;
            card.setAttribute('aria-hidden', index !== this.currentIndex);
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === this.currentIndex);
        });

        const icon = document.querySelector('.hero-parking-icon');
        const activeCard = document.querySelector('.hero-card.active');
        if (icon && activeCard) activeCard.appendChild(icon);

        window.clearTimeout(this.transitionTimer);
        this.transitionTimer = window.setTimeout(() => {
            carousel.classList.remove('is-transitioning');
        }, 900);
    },

    getCardClass(index) {
        const total = this.images.length;
        const diff = (index - this.currentIndex + total) % total;
        if (diff === 0) return 'active';
        if (diff === 1) return 'right';
        if (diff === total - 1) return 'left';
        return diff < total / 2 ? 'deep-right' : 'deep-left';
    },

    start() {
        this.stop();
        this.intervalId = setInterval(() => this.next(false), 4200);
    },

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        window.clearTimeout(this.transitionTimer);
        const carousel = document.getElementById('hero-carousel');
        if (carousel) carousel.classList.remove('is-transitioning');
    },

    next(restart = true) {
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.update();
        if (restart) this.start();
    },

    prev() {
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.update();
        this.start();
    },

    goTo(index) {
        if (index === this.currentIndex) return;
        this.currentIndex = index;
        this.update();
        this.start();
    },

    setupTouch() {
        const carousel = document.getElementById('hero-carousel');
        if (!carousel || carousel.dataset.touchReady === 'true') return;
        carousel.dataset.touchReady = 'true';

        carousel.addEventListener('touchstart', (e) => {
            this.touchStartX = e.touches[0].clientX;
        }, { passive: true });

        carousel.addEventListener('touchend', (e) => {
            const endX = e.changedTouches[0].clientX;
            const diff = endX - this.touchStartX;
            if (Math.abs(diff) < 42) return;
            diff < 0 ? this.next() : this.prev();
        }, { passive: true });
    }
};

window.HeroCarousel = HeroCarousel;

/* ===== Driver App Core ===== */
const App = {
    state: { user: null, currentPage: 'home' },

    init() {
        const savedAuth = Api.init();
        if (savedAuth?.token && Api.isDriverRole(savedAuth.role || savedAuth.roleName)) {
            this.state.user = savedAuth;
            this.showApp();
        } else {
            if (savedAuth) Api.clearAuth();
            this.showLanding();
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

    showLanding() {
        document.getElementById('landing-page').classList.remove('hidden');
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('app').classList.add('hidden');
        HeroCarousel.init();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    showLogin() {
        HeroCarousel.stop();
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    showRegister() {
        HeroCarousel.stop();
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('register-page').classList.remove('hidden');
        document.getElementById('app').classList.add('hidden');
    },

    showApp() {
        HeroCarousel.stop();
        document.getElementById('landing-page').classList.add('hidden');
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('register-page').classList.add('hidden');
        document.getElementById('app').classList.remove('hidden');
        const u = this.state.user || Api.user || { fullName: 'Tài xế' };
        document.getElementById('header-user-name').textContent = u.fullName || 'Tài xế';
        document.getElementById('header-avatar').textContent = (u.fullName || 'T').charAt(0).toUpperCase();
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
        this.showLanding();
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
