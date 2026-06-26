Pages.renderUsers = async function(container) {
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
                        <tbody id="users-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="users-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('users-tbody');
            if(!tbody) return;
            
            // Paginate
            const totalPages = Math.ceil(currentData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = currentData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(u => {
                tbodyHtml += `
                    <tr>
                        <td>#${u.userId}</td>
                        <td style="font-weight:600">${u.fullName}</td>
                        <td>${u.email}</td>
                        <td>${u.phoneNumber}</td>
                        <td><span class="badge badge-purple">${u.roleName}</span></td>
                        <td>${u.isActive ? '<span class="badge badge-green">Hoạt động</span>' : '<span class="badge badge-red">Khóa</span>'}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('users-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${currentData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.usersChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.usersChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.usersChangePage = (p) => { currentPage = p; renderTableBody(); };
        renderTableBody();
};
