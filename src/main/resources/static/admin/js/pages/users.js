import Api from '../api.js';

export async function renderUsers(container, App) {
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
}
