window.Pages = window.Pages || {};

Pages.renderSessions = async function(container) {
    // Show loading
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Load data
    const [res, vTypeRes] = await Promise.all([
        Api.getSessions(),
        Api.getVehicleTypes()
    ]);
    
    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }

    let sessionsData = res.data;
    let vehicleTypes = vTypeRes.success && vTypeRes.data ? vTypeRes.data : [];
    
    // Sort sessions by latest first (entryTime descending)
    sessionsData.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

    let currentPage = 1;
    const itemsPerPage = 15;
    
    let html = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <h3 class="card-title">Danh sách phiên gửi xe</h3>
                <div class="toolbar" style="display: flex; gap: 8px; flex-wrap: wrap;">
                    <input type="text" id="filter-plate" class="form-control" placeholder="Tìm biển số..." style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                    
                    <select id="filter-status" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="PARKING">Đang đỗ</option>
                        <option value="COMPLETED">Hoàn thành</option>
                        <option value="UNPAID">Chưa thanh toán</option>
                        <option value="LOST_TICKET">Mất vé</option>
                    </select>

                    <select id="filter-type" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả loại xe</option>
                        ${vehicleTypes.map(t => `<option value="${t.typeName}">${t.typeName}</option>`).join('')}
                    </select>
                    
                    <input type="date" id="filter-date" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;" />
                </div>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Biển số</th>
                            <th>Chỗ đỗ</th>
                            <th>Loại xe</th>
                            <th>Giờ vào</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody id="sessions-tbody">
                    </tbody>
                </table>
            </div>
            <div class="card-footer" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
                <div id="pagination-info" style="font-size: 0.85rem; color: var(--text-secondary);"></div>
                <div id="pagination-controls" style="display: flex; gap: 8px;"></div>
            </div>
        </div>

        <!-- Detail Modal -->
        <div id="session-detail-modal" class="modal-overlay hidden">
            <div class="modal" style="max-width: 600px;">
                <div class="modal-header">
                    <h3>Chi tiết phiên gửi xe</h3>
                    <button class="modal-close" onclick="document.getElementById('session-detail-modal').classList.add('hidden')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
                <div class="modal-body" id="session-detail-content">
                    <!-- Loaded dynamically -->
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const tbody = document.getElementById('sessions-tbody');
    const plateInput = document.getElementById('filter-plate');
    const statusSelect = document.getElementById('filter-status');
    const typeSelect = document.getElementById('filter-type');
    const dateInput = document.getElementById('filter-date');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    function renderTable() {
        const plateVal = plateInput.value.toLowerCase();
        const statusVal = statusSelect.value;
        const typeVal = typeSelect.value;
        const dateVal = dateInput.value;

        // Filter
        let filtered = sessionsData.filter(s => {
            if (plateVal && !(s.licensePlate || '').toLowerCase().includes(plateVal)) return false;
            if (statusVal && s.status !== statusVal) return false;
            if (typeVal && s.vehicleTypeName !== typeVal) return false;
            if (dateVal && s.entryTime) {
                const sDate = new Date(s.entryTime).toISOString().split('T')[0];
                if (sDate !== dateVal) return false;
            } else if (dateVal && !s.entryTime) {
                return false;
            }
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
            let statusBadge = '';
            switch(s.status) {
                case 'PARKING': statusBadge = '<span class="badge badge-blue">Đang đỗ</span>'; break;
                case 'COMPLETED': statusBadge = '<span class="badge badge-green">Hoàn thành</span>'; break;
                case 'UNPAID': statusBadge = '<span class="badge badge-yellow">Chưa thanh toán</span>'; break;
                case 'LOST_TICKET': statusBadge = '<span class="badge badge-red">Mất vé</span>'; break;
                default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
            }

            return `
                <tr>
                    <td>#${s.sessionId}</td>
                    <td style="font-weight:600">${s.licensePlate || '-'}</td>
                    <td>${s.slotCode || '-'}</td>
                    <td>${s.vehicleTypeName || '-'}</td>
                    <td>${s.entryTime ? new Date(s.entryTime).toLocaleString('vi-VN') : '-'}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.8rem;" onclick="window.viewSession(${s.sessionId})">Xem</button>
                    </td>
                </tr>
            `;
        }).join('') || '<tr><td colspan="7" class="text-center">Không tìm thấy dữ liệu</td></tr>';

        // Render Pagination
        paginationInfo.textContent = `Hiển thị ${totalItems === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + itemsPerPage, totalItems)} trong số ${totalItems} bản ghi`;

        let btnHtml = `<button class="btn btn-outline" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changeSessionPage(${currentPage - 1})">Trước</button>`;
        btnHtml += `<span style="padding: 6px 12px; font-size: 0.85rem; background: var(--bg-color); border-radius: 6px; border: 1px solid var(--border-color);">Trang ${currentPage} / ${totalPages}</span>`;
        btnHtml += `<button class="btn btn-outline" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changeSessionPage(${currentPage + 1})">Sau</button>`;
        
        paginationControls.innerHTML = btnHtml;
    }

    // Bind events
    plateInput.addEventListener('input', () => { currentPage = 1; renderTable(); });
    statusSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });
    typeSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });
    dateInput.addEventListener('change', () => { currentPage = 1; renderTable(); });

    window.changeSessionPage = (page) => {
        currentPage = page;
        renderTable();
    };

    window.viewSession = async (id) => {
        const session = sessionsData.find(s => s.sessionId === id);
        if (!session) return;
        
        let statusBadge = '';
        switch(session.status) {
            case 'PARKING': statusBadge = '<span class="badge badge-blue">Đang đỗ</span>'; break;
            case 'COMPLETED': statusBadge = '<span class="badge badge-green">Hoàn thành</span>'; break;
            case 'UNPAID': statusBadge = '<span class="badge badge-yellow">Chưa thanh toán</span>'; break;
            case 'LOST_TICKET': statusBadge = '<span class="badge badge-red">Mất vé</span>'; break;
            default: statusBadge = `<span class="badge badge-gray">${session.status}</span>`;
        }

        const modalContent = document.getElementById('session-detail-content');
        modalContent.innerHTML = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">ID Phiên</p>
                    <p style="font-weight: 600; font-size: 1rem;">#${session.sessionId}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Trạng thái</p>
                    <p>${statusBadge}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Biển số xe</p>
                    <p style="font-weight: 600;">${session.licensePlate || '-'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Loại xe</p>
                    <p>${session.vehicleTypeName || '-'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Giờ vào</p>
                    <p>${session.entryTime ? new Date(session.entryTime).toLocaleString('vi-VN') : '-'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Cổng vào</p>
                    <p>${session.entryGate || '-'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Giờ ra</p>
                    <p>${session.exitTime ? new Date(session.exitTime).toLocaleString('vi-VN') : '-'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Cổng ra</p>
                    <p>${session.exitGate || '-'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Chỗ đỗ</p>
                    <p>${session.slotCode || '-'}</p>
                </div>
                <div>
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 4px;">Nhân viên (Vào/Ra)</p>
                    <p>${session.entryStaffName || '-'} / ${session.exitStaffName || '-'}</p>
                </div>
                <div style="grid-column: 1 / -1; margin-top: 16px; border-top: 1px solid var(--border-color); padding-top: 16px;">
                    <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 8px;">Ảnh lúc vào</p>
                    ${session.entryImageUrl ? `<img src="${session.entryImageUrl}" alt="Entry Image" style="width: 100%; border-radius: 8px; max-height: 200px; object-fit: cover;" />` : '<p style="color: #999; font-size: 0.9rem; font-style: italic;">Không có hình ảnh</p>'}
                </div>
            </div>
        `;

        document.getElementById('session-detail-modal').classList.remove('hidden');
    };

    // Initial render
    renderTable();
};