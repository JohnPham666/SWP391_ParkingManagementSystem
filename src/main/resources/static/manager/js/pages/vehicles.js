window.Pages = window.Pages || {};

Pages.renderVehicles = async function (container) {
    // Show loading
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

    // Load data
    const [res, vTypeRes] = await Promise.all([
        Api.getVehicles(),
        Api.getVehicleTypes()
    ]);

    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }

    let vehiclesData = res.data;
    let vehicleTypes = vTypeRes.success && vTypeRes.data ? vTypeRes.data : [];

    // Sort by latest first
    vehiclesData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    let currentPage = 1;
    const itemsPerPage = 15;

    let html = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <h3 class="card-title">Quản lý phương tiện</h3>
                <div class="toolbar" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="text" id="filter-plate" class="form-control" placeholder="Tìm biển số..." style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                    <input type="text" id="filter-owner" class="form-control" placeholder="Tìm chủ xe..." style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                    
                    <select id="filter-type" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả loại xe</option>
                        ${vehicleTypes.map(t => `<option value="${t.typeName}">${t.typeName}</option>`).join('')}
                    </select>

                    <select id="filter-status" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="PENDING">Chờ duyệt</option>
                        <option value="APPROVED">Đã duyệt</option>
                        <option value="REJECTED">Từ chối</option>
                    </select>
                </div>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Biển số</th>
                            <th>Chủ xe</th>
                            <th>Loại xe</th>
                            <th>Hãng xe</th>
                            <th>Ngày đăng ký</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="vehicles-tbody">
                    </tbody>
                </table>
            </div>
            <div class="card-footer" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
                <div id="pagination-info" style="font-size: 0.85rem; color: var(--text-secondary);"></div>
                <div id="pagination-controls" style="display: flex; gap: 8px;"></div>
            </div>
        </div>

        <!-- Approval Modal -->
        <div id="approval-modal" class="modal-overlay hidden">
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Chi tiết & Duyệt Phương tiện</h3>
                    <button class="modal-close" onclick="document.getElementById('approval-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <div class="modal-body form-grid" id="approval-modal-content">
                    <!-- Dynamic content -->
                </div>
                <div class="modal-footer" id="approval-modal-actions">
                    <!-- Dynamic actions -->
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const tbody = document.getElementById('vehicles-tbody');
    const plateInput = document.getElementById('filter-plate');
    const ownerInput = document.getElementById('filter-owner');
    const typeSelect = document.getElementById('filter-type');
    const statusSelect = document.getElementById('filter-status');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    function renderTable() {
        const plateVal = plateInput.value.toLowerCase();
        const ownerVal = ownerInput.value.toLowerCase();
        const typeVal = typeSelect.value;
        const statusVal = statusSelect.value;

        // Filter
        let filtered = vehiclesData.filter(v => {
            if (plateVal && !(v.licensePlate || '').toLowerCase().includes(plateVal)) return false;
            if (ownerVal && !(v.ownerName || '').toLowerCase().includes(ownerVal)) return false;
            if (typeVal && v.vehicleTypeName !== typeVal) return false;
            if (statusVal && v.status !== statusVal) return false;
            return true;
        });

        // Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageData = filtered.slice(startIdx, startIdx + itemsPerPage);

        // Render rows
        tbody.innerHTML = pageData.map(v => {
            let badge = '';
            if (v.status === 'PENDING') badge = '<span class="badge badge-yellow">Chờ duyệt</span>';
            else if (v.status === 'APPROVED') badge = '<span class="badge badge-green">Đã duyệt</span>';
            else if (v.status === 'REJECTED') badge = '<span class="badge badge-red">Từ chối</span>';
            else badge = `<span class="badge badge-gray">${v.status || 'N/A'}</span>`;

            let actionBtn = `<button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.viewVehicle(${v.vehicleId})">Xem chi tiết</button>`;

            return `
                <tr>
                    <td>#${v.vehicleId}</td>
                    <td style="font-weight:700">${v.licensePlate || '-'}</td>
                    <td>${v.ownerName || '-'}</td>
                    <td>${v.vehicleTypeName || '-'}</td>
                    <td>${v.brand || '-'}</td>
                    <td>${v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                    <td>${badge}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="8" class="text-center">Không tìm thấy dữ liệu</td></tr>';

        // Render Pagination
        paginationInfo.textContent = `Hiển thị ${totalItems === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + itemsPerPage, totalItems)} trong số ${totalItems} bản ghi`;

        let btnHtml = `<button class="btn btn-outline" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changeVehiclePage(${currentPage - 1})">Trước</button>`;
        btnHtml += `<span style="padding: 6px 12px; font-size: 0.85rem; background: var(--bg-color); border-radius: 6px; border: 1px solid var(--border-color);">Trang ${currentPage} / ${totalPages}</span>`;
        btnHtml += `<button class="btn btn-outline" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changeVehiclePage(${currentPage + 1})">Sau</button>`;

        paginationControls.innerHTML = btnHtml;
    }

    // Bind events
    plateInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
    ownerInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
    typeSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });
    statusSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });

    window.changeVehiclePage = (page) => {
        currentPage = page;
        renderTable();
    };

    window.viewVehicle = (id) => {
        const v = vehiclesData.find(x => x.vehicleId === id);
        if (!v) return;

        let content = `
            <div class="form-group"><label>Chủ xe:</label> <p style="margin:4px 0; font-weight:600;">${v.ownerName || '-'}</p></div>
            <div class="form-group"><label>Số điện thoại:</label> <p style="margin:4px 0;">${v.ownerPhone || '-'}</p></div>
            <div class="form-group"><label>Biển số xe:</label> <p style="margin:4px 0; font-weight:700; color:var(--primary-color);">${v.licensePlate || '-'}</p></div>
            <div class="form-group"><label>Loại xe:</label> <p style="margin:4px 0;">${v.vehicleTypeName || '-'}</p></div>
            <div class="form-group"><label>Hãng xe:</label> <p style="margin:4px 0;">${v.brand || '-'}</p></div>
            <div class="form-group"><label>Màu sắc:</label> <p style="margin:4px 0;">${v.vehicleColor || '-'}</p></div>
            <div class="form-group"><label>Số khung:</label> <p style="margin:4px 0;">${v.chassisNumber || '-'}</p></div>
            <div class="form-group"><label>Số máy:</label> <p style="margin:4px 0;">${v.engineNumber || '-'}</p></div>
            
            <div class="form-group full-width" style="margin-top: 16px;">
                <label>Ảnh Giấy tờ xe (Cà vẹt):</label>
                <div style="border: 1px dashed var(--border-color); padding: 8px; border-radius: 8px; text-align: center; margin-top: 8px; background: var(--bg-color);">
                    ${v.registrationPhoto ? `<img src="${v.registrationPhoto}" style="max-width:100%; max-height:250px; border-radius:4px; object-fit:contain;" />` : '<p style="color:var(--text-secondary); margin: 20px 0;">Không có ảnh chụp</p>'}
                </div>
            </div>
        `;

        document.getElementById('approval-modal-content').innerHTML = content;

        let actions = `<button class="btn btn-outline" onclick="document.getElementById('approval-modal').classList.add('hidden')">Đóng</button>`;

        if (v.status === 'PENDING') {
            actions = `
                <button class="btn btn-outline" style="color: var(--red); border-color: var(--red);" onclick="window.approveVehicle(${id}, false)">Từ chối</button>
                <button class="btn btn-primary" style="background: var(--green); border-color: var(--green);" onclick="window.approveVehicle(${id}, true)">Đồng ý Duyệt</button>
                <button class="btn btn-outline" onclick="document.getElementById('approval-modal').classList.add('hidden')">Hủy</button>
            `;
        }

        document.getElementById('approval-modal-actions').innerHTML = actions;
        document.getElementById('approval-modal').classList.remove('hidden');
    };

    window.approveVehicle = async (id, isApproved) => {
        if (!confirm(isApproved ? 'Bạn có chắc chắn muốn DUYỆT xe này?' : 'Bạn có chắc chắn muốn TỪ CHỐI xe này?')) return;

        const r = await Api.approveVehicle(id, isApproved);
        if (r.success) {
            App.showToast(isApproved ? 'Đã duyệt thành công!' : 'Đã từ chối thành công!', 'success');
            document.getElementById('approval-modal').classList.add('hidden');
            // Reload page to get new status
            App.renderPage('vehicles');
        } else {
            App.showToast(r.message || 'Lỗi xử lý', 'error');
        }
    };

    // Initial render
    renderTable();
};