window.Pages = window.Pages || {};

Pages.renderSubscriptions = async function(container) {
    // Show loading
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Load data (sub, slots, zones)
    const [res, slotsRes, zonesRes] = await Promise.all([
        Api.getSubscriptions(),
        Api.getSlots(),
        Api.getZones()
    ]);
    
    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }

    let subscriptionsData = res.data;
    
    // Create dictionary for slot and zone names
    let slotMap = {};
    if (slotsRes.success && Array.isArray(slotsRes.data)) {
        slotsRes.data.forEach(s => { slotMap[s.slotId] = s.slotCode; });
    }
    let zoneMap = {};
    if (zonesRes.success && Array.isArray(zonesRes.data)) {
        zonesRes.data.forEach(z => { zoneMap[z.zoneId] = z.zoneName; });
    }
    
    // Sort by newest first
    subscriptionsData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    let currentPage = 1;
    const itemsPerPage = 15;
    
    let html = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <h3 class="card-title">Quản lý Vé Tháng</h3>
                <div class="toolbar" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="text" id="filter-customer" class="form-control" placeholder="Tìm khách hàng..." style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                    
                    <select id="filter-status" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="ACTIVE">Đang hoạt động</option>
                        <option value="EXPIRED">Đã hết hạn</option>
                        <option value="CANCELLED">Đã hủy</option>
                    </select>
                </div>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Khách hàng</th>
                            <th>Biển số xe</th>
                            <th>Chỗ/Khu vực</th>
                            <th>Ngày bắt đầu</th>
                            <th>Ngày kết thúc</th>
                            <th>Phí tháng</th>
                            <th>Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody id="subscriptions-tbody">
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

    const tbody = document.getElementById('subscriptions-tbody');
    const customerInput = document.getElementById('filter-customer');
    const statusSelect = document.getElementById('filter-status');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    function renderTable() {
        const customerVal = customerInput.value.toLowerCase();
        const statusVal = statusSelect.value;

        // Filter
        let filtered = subscriptionsData.filter(s => {
            const customerName = s.userFullName || '';
            if (customerVal && !customerName.toLowerCase().includes(customerVal)) return false;
            if (statusVal && s.status !== statusVal) return false;
            return true;
        });

        // Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageData = filtered.slice(startIdx, startIdx + itemsPerPage);

        // Render rows
        tbody.innerHTML = pageData.map(s => {
            let badge = '';
            switch(s.status) {
                case 'ACTIVE': badge = '<span class="badge badge-green">Đang hoạt động</span>'; break;
                case 'EXPIRED': badge = '<span class="badge badge-red">Đã hết hạn</span>'; break;
                case 'CANCELLED': badge = '<span class="badge badge-gray">Đã hủy</span>'; break;
                default: badge = `<span class="badge badge-gray">${s.status}</span>`;
            }
            
            let boundTo = '-';
            if (s.slotId && slotMap[s.slotId]) boundTo = `Chỗ: ${slotMap[s.slotId]}`;
            else if (s.zoneId && zoneMap[s.zoneId]) boundTo = `Khu vực: ${zoneMap[s.zoneId]}`;
            else if (s.slotId) boundTo = `Chỗ ID: ${s.slotId}`;
            else if (s.zoneId) boundTo = `Khu vực ID: ${s.zoneId}`;

            return `
            <tr>
                <td>#${s.subscriptionId}</td>
                <td style="font-weight: 500;">${s.userFullName || '-'}</td>
                <td style="font-weight: 700;">${s.licensePlate || '-'}</td>
                <td>${boundTo}</td>
                <td>${s.startDate ? new Date(s.startDate).toLocaleDateString('vi-VN') : '-'}</td>
                <td>${s.endDate ? new Date(s.endDate).toLocaleDateString('vi-VN') : '-'}</td>
                <td style="color: var(--green); font-weight: 600;">${s.monthlyFee ? s.monthlyFee.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                <td>${badge}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="8" class="text-center">Không tìm thấy dữ liệu</td></tr>';

        // Render Pagination
        paginationInfo.textContent = `Hiển thị ${totalItems === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + itemsPerPage, totalItems)} trong số ${totalItems} bản ghi`;

        let btnHtml = `<button class="btn btn-outline" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changeSubscriptionPage(${currentPage - 1})">Trước</button>`;
        btnHtml += `<span style="padding: 6px 12px; font-size: 0.85rem; background: var(--bg-color); border-radius: 6px; border: 1px solid var(--border-color);">Trang ${currentPage} / ${totalPages}</span>`;
        btnHtml += `<button class="btn btn-outline" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changeSubscriptionPage(${currentPage + 1})">Sau</button>`;
        
        paginationControls.innerHTML = btnHtml;
    }

    // Bind events
    customerInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
    statusSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });

    window.changeSubscriptionPage = (page) => {
        currentPage = page;
        renderTable();
    };

    // Initial render
    renderTable();
};