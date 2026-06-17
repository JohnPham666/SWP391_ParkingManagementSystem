/* ===== Auth handlers (login/register forms) ===== */
const Auth = {
    setupLogin() {
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-password').value;
            const btn = document.getElementById('login-btn');
            const err = document.getElementById('login-error');
            btn.disabled = true;
            btn.querySelector('span').classList.add('hidden');
            btn.querySelector('.btn-loader').classList.remove('hidden');
            err.classList.add('hidden');

            const res = await Api.login(email, pass);
            btn.disabled = false;
            btn.querySelector('span').classList.remove('hidden');
            btn.querySelector('.btn-loader').classList.add('hidden');

            if (res.success && res.data) {
                if (res.data.role !== 'Driver') {
                    err.textContent = 'Tài khoản này không phải Driver. Vui lòng dùng trang Staff.';
                    err.classList.remove('hidden');
                    return;
                }
                Api.saveAuth(res.data);
                App.state.user = res.data;
                App.showApp();
            } else {
                err.textContent = res.message || 'Đăng nhập thất bại';
                err.classList.remove('hidden');
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
        document.getElementById('register-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const err = document.getElementById('register-error');
            err.classList.add('hidden');
            const data = {
                fullName: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                phoneNumber: document.getElementById('reg-phone').value,
                password: document.getElementById('reg-password').value
            };
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
            const res = await Api.register(data);
            if (res.success && res.data) {
                Api.saveAuth(res.data);
                App.state.user = res.data;
                App.showApp();
                App.showToast('Đăng ký thành công!', 'success');
            } else {
                err.textContent = res.message || 'Đăng ký thất bại';
                err.classList.remove('hidden');
            }
        });

        document.getElementById('go-login').addEventListener('click', (e) => {
            e.preventDefault();
            App.showLogin();
        });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Auth.setupLogin();
    Auth.setupRegister();
});
