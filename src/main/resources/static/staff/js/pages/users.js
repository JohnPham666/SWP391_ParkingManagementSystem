import Api from '../api.js';

export async function renderUsers(container, App) {
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
}
