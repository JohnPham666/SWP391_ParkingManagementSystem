Pages.renderSubscriptions = async function(container) {
        const res = await Api.getSubscriptions();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý Vé Tháng</h3>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Khách hàng</th><th>Biển số xe</th><th>Chỗ/Khu vực</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Phí tháng</th><th>Trạng thái</th></tr></thead>
                        <tbody id="subscriptions-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="subscriptions-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('subscriptions-tbody');
            if(!tbody) return;
            
            // Paginate
            const totalPages = Math.ceil(currentData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = currentData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(s => {
                let badge = '';
                switch(s.status) {
                    case 'ACTIVE': badge = '<span class="badge badge-green">Đang hoạt động</span>'; break;
                    case 'EXPIRED': badge = '<span class="badge badge-red">Đã hết hạn</span>'; break;
                    case 'CANCELLED': badge = '<span class="badge badge-gray">Đã hủy</span>'; break;
                    default: badge = `<span class="badge badge-gray">${s.status}</span>`;
                }
                let boundTo = '-';
                if (s.slotCode) boundTo = s.slotCode;
                else if (s.zoneName) boundTo = s.zoneName;

                tbodyHtml += `
                <tr>
                    <td>#${s.subscriptionId}</td>
                    <td>${s.userName || '-'}</td>
                    <td style="font-weight:700">${s.licensePlate || '-'}</td>
                    <td>${boundTo}</td>
                    <td>${s.startDate ? new Date(s.startDate).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>${s.endDate ? new Date(s.endDate).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>${s.monthlyFee ? s.monthlyFee.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                    <td>${badge}</td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('subscriptions-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${currentData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.subscriptionsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.subscriptionsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.subscriptionsChangePage = (p) => { currentPage = p; renderTableBody(); };
        renderTableBody();
};
