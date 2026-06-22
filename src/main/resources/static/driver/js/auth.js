/* ===== Auth handlers (login/register forms) ===== */
const Auth = {
    setupLogin() {
        const form = document.getElementById('login-form');
        if (form.dataset.authReady === 'true') return;
        form.dataset.authReady = 'true';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value.trim();
            const pass = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');
            const err = document.getElementById('login-error');
            btn.disabled = true;
            btn.querySelector('span').classList.add('hidden');
            btn.querySelector('.btn-loader').classList.remove('hidden');
            err.classList.add('hidden');

            if (!window.Api || typeof window.Api.login !== "function") {
                throw new Error("Driver API module chưa được tải. Hãy kiểm tra thứ tự script trong index.html.");
            }

            try {
                const res = await window.Api.login(email, pass);

                if (res.success && res.data) {
                    if (!window.Api.isDriverRole(res.data.role || res.data.roleName)) {
                        err.textContent = 'Tài khoản này không phải Driver. Vui lòng dùng trang Staff.';
                        err.classList.remove('hidden');
                        window.Api.clearAuth();
                        return;
                    }
                    const auth = window.Api.saveAuth(res.data);
                    App.state.user = auth;
                    App.showApp();
                    App.showToast('Đăng nhập thành công!', 'success');
                } else {
                    err.textContent = res.message || 'Đăng nhập thất bại';
                    err.classList.remove('hidden');
                }
            } catch (error) {
                err.textContent = error.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
                err.classList.remove('hidden');
            } finally {
                btn.disabled = false;
                btn.querySelector('span').classList.remove('hidden');
                btn.querySelector('.btn-loader').classList.add('hidden');
            }
        });

        document.getElementById('toggle-password').addEventListener('click', () => {
            const inp = document.getElementById('login-password');
            inp.type = inp.type === 'password' ? 'text' : 'password';
        });

        document.getElementById('go-register').addEventListener('click', (e) => {
            e.preventDefault();
            App.showRegister();
        });
    },

    setupRegister() {
        const form = document.getElementById('register-form');
        if (form.dataset.authReady === 'true') return;
        form.dataset.authReady = 'true';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('register-error');
            err.classList.add('hidden');
            const data = {
                fullName: document.getElementById('reg-name').value.trim(),
                email: document.getElementById('reg-email').value.trim(),
                phoneNumber: document.getElementById('reg-phone').value.trim(),
                password: document.getElementById('reg-password').value
            };
            if (!data.fullName || !data.email || !data.phoneNumber || !data.password) {
                err.textContent = 'Vui lòng điền đầy đủ thông tin bắt buộc.';
                err.classList.remove('hidden');
                return;
            }
            if (data.password !== document.getElementById('reg-confirm').value) {
                err.textContent = 'Mật khẩu xác nhận không khớp';
                err.classList.remove('hidden');
                return;
            }
            if (!document.getElementById('reg-agree').checked) {
                err.textContent = 'Vui lòng đồng ý với Chính sách bảo mật và Điều khoản sử dụng trước khi đăng ký.';
                err.classList.remove('hidden');
                return;
            }
            try {
                const res = await window.Api.register(data);
                if (res.success) {
                    if (res.data && res.data.token) {
                        // Auto-login: register API already returns JWT token
                        const auth = window.Api.saveAuth(res.data);
                        App.state.user = auth;
                        App.showApp();
                        App.showToast('Đăng ký thành công! Chào mừng bạn.', 'success');
                    } else {
                        App.showLogin();
                        App.showToast('Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.', 'success');
                    }
                } else {
                    err.textContent = res.message || 'Đăng ký thất bại';
                    err.classList.remove('hidden');
                }
            } catch (error) {
                err.textContent = error.message || 'Đăng ký thất bại. Vui lòng thử lại.';
                err.classList.remove('hidden');
            }
        });

        document.getElementById('go-login').addEventListener('click', (e) => {
            e.preventDefault();
            App.showLogin();
        });
    },

    setupForgotPassword() {
        document.getElementById('go-forgot-password').addEventListener('click', (e) => {
            e.preventDefault();
            App.showForgotPassword();
        });

        document.getElementById('go-login-from-forgot').addEventListener('click', (e) => {
            e.preventDefault();
            App.showLogin();
        });

        document.getElementById('forgot-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('forgot-email').value;
            const btn = document.getElementById('forgot-btn');
            const err = document.getElementById('forgot-error');
            btn.disabled = true;
            btn.querySelector('span').classList.add('hidden');
            btn.querySelector('.btn-loader').classList.remove('hidden');
            err.classList.add('hidden');

            const res = await window.Api.forgotPassword(email);
            btn.disabled = false;
            btn.querySelector('span').classList.remove('hidden');
            btn.querySelector('.btn-loader').classList.add('hidden');

            if (res.success) {
                App.showToast(res.message, 'success');
                // clear form
                document.getElementById('forgot-email').value = '';
            } else {
                err.textContent = res.message;
                err.classList.remove('hidden');
            }
        });
    },

    setupResetPassword() {
        document.getElementById('go-login-from-reset').addEventListener('click', (e) => {
            e.preventDefault();
            // remove token from url
            window.history.replaceState({}, document.title, window.location.pathname);
            App.showLogin();
        });

        document.getElementById('reset-password-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const token = document.getElementById('reset-token').value;
            const newPassword = document.getElementById('reset-new-password').value;
            const confirmPassword = document.getElementById('reset-confirm-password').value;
            const btn = document.getElementById('reset-btn');
            const err = document.getElementById('reset-error');
            
            err.classList.add('hidden');

            if (newPassword !== confirmPassword) {
                err.textContent = 'Mật khẩu xác nhận không khớp';
                err.classList.remove('hidden');
                return;
            }

            btn.disabled = true;
            btn.querySelector('span').classList.add('hidden');
            btn.querySelector('.btn-loader').classList.remove('hidden');

            const res = await window.Api.resetPassword(token, newPassword);
            btn.disabled = false;
            btn.querySelector('span').classList.remove('hidden');
            btn.querySelector('.btn-loader').classList.add('hidden');

            if (res.success) {
                App.showToast(res.message, 'success');
                // remove token from url
                window.history.replaceState({}, document.title, window.location.pathname);
                App.showLogin();
            } else {
                err.textContent = res.message;
                err.classList.remove('hidden');
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.setupLogin();
    Auth.setupRegister();
    Auth.setupForgotPassword();
    Auth.setupResetPassword();
});
