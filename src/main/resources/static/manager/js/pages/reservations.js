window.Pages = window.Pages || {};

Pages.renderReservations = async function(container) {
    // Show loading
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Load data
    const res = await Api.getReservations();
    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }

    let reservationsData = res.data;
    
    // Sort by latest created or start time first
    reservationsData.sort((a, b) => new Date(b.createdAt || b.reservationStart) - new Date(a.createdAt || a.reservationStart));

    let currentPage = 1;
    const itemsPerPage = 15;
    
    let html = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <h3 class="card-title">Quản lý đặt chỗ</h3>
                <div class="toolbar" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="text" id="filter-plate" class="form-control" placeholder="Tìm biển số..." style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                    <input type="text" id="filter-customer" class="form-control" placeholder="Tìm khách hàng..." style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                    
                    <select id="filter-status" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ xác nhận</option>
                        <option value="CONFIRMED">Đã xác nhận</option>
                        <option value="COMPLETED">Đã hoàn thành</option>
                        <option value="CANCELLED">Đã hủy</option>
                    </select>
                </div>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Mã Đặt</th>
                            <th>Khách hàng</th>
                            <th>Biển số xe</th>
                            <th>Chỗ đỗ</th>
                            <th>TG Bắt đầu</th>
                            <th>TG Kết thúc</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="reservations-tbody">
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

    const tbody = document.getElementById('reservations-tbody');
    const plateInput = document.getElementById('filter-plate');
    const customerInput = document.getElementById('filter-customer');
    const statusSelect = document.getElementById('filter-status');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    function renderTable() {
        const plateVal = plateInput.value.toLowerCase();
        const customerVal = customerInput.value.toLowerCase();
        const statusVal = statusSelect.value;

        // Filter
        let filtered = reservationsData.filter(r => {
            if (plateVal && !(r.licensePlate || '').toLowerCase().includes(plateVal)) return false;
            
            const customerName = r.userFullName || r.guestName || '';
            if (customerVal && !customerName.toLowerCase().includes(customerVal)) return false;
            
            if (statusVal && r.status !== statusVal) return false;
            return true;
        });

        // Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageData = filtered.slice(startIdx, startIdx + itemsPerPage);

        // Render rows
        tbody.innerHTML = pageData.map(r => {
            let badgeClass = '';
            switch(r.status) {
                case 'PENDING': badgeClass = 'badge-yellow'; break;
                case 'CONFIRMED': badgeClass = 'badge-green'; break;
                case 'CANCELLED': badgeClass = 'badge-red'; break;
                case 'COMPLETED': badgeClass = 'badge-blue'; break;
                default: badgeClass = 'badge-gray';
            }
            
            const canEditRes = (App.state.user.role === 'Admin' || App.state.user.role === 'ParkingManager' || App.state.user.role === 'ParkingStaff');
            const resStatusOpts = { 'PENDING': 'Chờ xác nhận', 'CONFIRMED': 'Đã xác nhận', 'COMPLETED': 'Đã hoàn thành', 'CANCELLED': 'Đã hủy' };
            
            const badge = canEditRes ? `
                <select onchange="window.updateReservationStatus(${r.reservationId}, this.value)" class="badge ${badgeClass}" style="border:none; outline:none; cursor:pointer; font-weight:600; text-align:center;">
                    ${Object.entries(resStatusOpts).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
            ` : `<span class="badge ${badgeClass}">${resStatusOpts[r.status] || r.status}</span>`;

            return `
            <tr>
                <td>#${r.reservationId}</td>
                <td style="font-weight: 600;">${r.userFullName || r.guestName || '-'}</td>
                <td>${r.licensePlate || '-'}</td>
                <td>${r.slotCode || '-'}</td>
                <td>${r.reservationStart ? new Date(r.reservationStart).toLocaleString('vi-VN') : '-'}</td>
                <td>${r.reservationEnd ? new Date(r.reservationEnd).toLocaleString('vi-VN') : '-'}</td>
                <td>${badge}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="7" class="text-center">Không tìm thấy dữ liệu</td></tr>';

        // Render Pagination
        paginationInfo.textContent = `Hiển thị ${totalItems === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + itemsPerPage, totalItems)} trong số ${totalItems} bản ghi`;

        let btnHtml = `<button class="btn btn-outline" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changeReservationPage(${currentPage - 1})">Trước</button>`;
        btnHtml += `<span style="padding: 6px 12px; font-size: 0.85rem; background: var(--bg-color); border-radius: 6px; border: 1px solid var(--border-color);">Trang ${currentPage} / ${totalPages}</span>`;
        btnHtml += `<button class="btn btn-outline" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changeReservationPage(${currentPage + 1})">Sau</button>`;
        
        paginationControls.innerHTML = btnHtml;
    }

    // Bind events
    plateInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
    customerInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
    statusSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });

    window.changeReservationPage = (page) => {
        currentPage = page;
        renderTable();
    };

    window.updateReservationStatus = async (id, status) => {
        if(!status) return;
        const r = await Api.updateReservationStatus(id, status);
        if(r.success) {
            App.showToast('Cập nhật trạng thái đặt chỗ thành công', 'success');
            App.renderPage('reservations');
        } else {
            App.showToast(r.message || 'Lỗi khi cập nhật', 'error');
        }
    };

    // Initial render
    renderTable();
};