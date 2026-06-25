window.Pages = window.Pages || {};

Pages.renderPayments = async function(container) {
    // Show loading
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Load data
    const res = await Api.getPayments();
    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }

    let paymentsData = res.data;
    
    // Sort by latest paid or created
    paymentsData.sort((a, b) => new Date(b.paidAt || b.createdAt || 0) - new Date(a.paidAt || a.createdAt || 0));

    let currentPage = 1;
    const itemsPerPage = 15;
    
    let html = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <h3 class="card-title">Lịch sử thanh toán</h3>
                <div class="toolbar" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="text" id="filter-customer" class="form-control" placeholder="Tìm khách hàng..." style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                    
                    <select id="filter-status" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="PENDING">Đang chờ</option>
                        <option value="SUCCESS">Thành công</option>
                        <option value="PAID">Đã thanh toán</option>
                        <option value="FAILED">Thất bại</option>
                    </select>
                </div>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mã TT</th>
                            <th>Loại thanh toán</th>
                            <th>Khách hàng</th>
                            <th>Biển số</th>
                            <th>Số tiền</th>
                            <th>Phương thức</th>
                            <th>Thời gian</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="payments-tbody">
                    </tbody>
                </table>
            </div>
            <div class="card-footer" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
                <div id="pagination-info" style="font-size: 0.85rem; color: var(--text-secondary);"></div>
                <div id="pagination-controls" style="display: flex; gap: 8px;"></div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const tbody = document.getElementById('payments-tbody');
    const customerInput = document.getElementById('filter-customer');
    const statusSelect = document.getElementById('filter-status');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    function renderTable() {
        const customerVal = customerInput.value.toLowerCase();
        const statusVal = statusSelect.value;

        // Filter
        let filtered = paymentsData.filter(p => {
            if (customerVal && !(p.customerName || '').toLowerCase().includes(customerVal)) return false;
            if (statusVal && p.paymentStatus !== statusVal) return false;
            return true;
        });

        // Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageData = filtered.slice(startIdx, startIdx + itemsPerPage);

        // Render rows
        tbody.innerHTML = pageData.map(p => {
            let badge = '';
            switch(p.paymentStatus) {
                case 'PENDING': badge = '<span class="badge badge-yellow">Đang chờ</span>'; break;
                case 'SUCCESS': badge = '<span class="badge badge-green">Thành công</span>'; break;
                case 'PAID': badge = '<span class="badge badge-green">Đã thanh toán</span>'; break;
                case 'FAILED': badge = '<span class="badge badge-red">Thất bại</span>'; break;
                default: badge = `<span class="badge badge-gray">${p.paymentStatus}</span>`;
            }
            
            let type = p.sessionId ? 'Phiên gửi xe' : (p.reservationId ? 'Đặt chỗ' : 'Khác');
            
            return `
            <tr>
                <td>#${p.paymentId}</td>
                <td>${type}</td>
                <td>
                    <div style="font-weight: 500">${p.customerName || '-'}</div>
                    <div style="font-size: 0.8rem; color: var(--text-muted)">${p.customerPhone || ''}</div>
                </td>
                <td style="font-weight: 600">${p.licensePlate || '-'}</td>
                <td style="font-weight:700; color:var(--green)">${p.amount.toLocaleString('vi-VN')} đ</td>
                <td>${p.paymentMethod || '-'}</td>
                <td>${p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '-'}</td>
                <td>
                    ${badge}
                    ${p.paymentStatus === 'PENDING' ? `<button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; margin-left: 8px;" onclick="window.confirmPayment(${p.paymentId})">Nhận tiền mặt</button>` : ''}
                </td>
            </tr>`;
        }).join('') || '<tr><td colspan="8" class="text-center">Không tìm thấy dữ liệu</td></tr>';

        // Render Pagination
        paginationInfo.textContent = `Hiển thị ${totalItems === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + itemsPerPage, totalItems)} trong số ${totalItems} bản ghi`;

        let btnHtml = `<button class="btn btn-outline" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changePaymentPage(${currentPage - 1})">Trước</button>`;
        btnHtml += `<span style="padding: 6px 12px; font-size: 0.85rem; background: var(--bg-color); border-radius: 6px; border: 1px solid var(--border-color);">Trang ${currentPage} / ${totalPages}</span>`;
        btnHtml += `<button class="btn btn-outline" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changePaymentPage(${currentPage + 1})">Sau</button>`;
        
        paginationControls.innerHTML = btnHtml;
    }

    // Bind events
    customerInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
    statusSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });

    window.changePaymentPage = (page) => {
        currentPage = page;
        renderTable();
    };

    window.confirmPayment = async (id) => {
        if(confirm('Xác nhận đã thu tiền mặt cho giao dịch này?')) {
            const r = await Api.confirmCash(id);
            if(r.success) {
                App.showToast('Xác nhận thanh toán thành công', 'success');
                Pages.renderPayments(container);
            } else {
                App.showToast(r.message || 'Lỗi xác nhận', 'error');
            }
        }
    };

    // Initial render
    renderTable();
};