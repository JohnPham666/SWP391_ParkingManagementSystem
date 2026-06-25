window.Pages = window.Pages || {};

Pages.renderIncidents = async function(container) {
    // Show loading
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    
    // Load data
    const res = await Api.getIncidents();
    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }

    let incidentsData = res.data;
    
    // Sort by latest reported
    incidentsData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    let currentPage = 1;
    const itemsPerPage = 15;
    
    let html = `
        <div class="card">
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
                <h3 class="card-title">Quản lý sự cố</h3>
                <div class="toolbar" style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
                    <select id="filter-status" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem;">
                        <option value="">Tất cả trạng thái</option>
                        <option value="REPORTED">Mới báo cáo</option>
                        <option value="OPEN">Mở</option>
                        <option value="IN_PROGRESS">Đang xử lý</option>
                        <option value="RESOLVED">Đã giải quyết</option>
                        <option value="CLOSED">Đã đóng</option>
                    </select>

                    <button class="btn btn-primary" onclick="window.showIncidentModal()" style="padding: 6px 12px; font-size: 0.85rem;">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M12 5v14M5 12h14"/></svg> Báo cáo
                    </button>
                </div>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Tiêu đề / Mô tả</th>
                            <th>Loại sự cố</th>
                            <th>Trạng thái</th>
                            <th>Người báo cáo</th>
                            <th>TG báo cáo</th>
                        </tr>
                    </thead>
                    <tbody id="incidents-tbody">
                    </tbody>
                </table>
            </div>
            <div class="card-footer" style="padding: 16px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color);">
                <div id="pagination-info" style="font-size: 0.85rem; color: var(--text-secondary);"></div>
                <div id="pagination-controls" style="display: flex; gap: 8px;"></div>
            </div>
        </div>
        
        <!-- Incident Modal -->
        <div id="incident-modal" class="modal-overlay hidden">
            <div class="modal">
                <div class="modal-header">
                    <h3>Báo cáo sự cố mới</h3>
                    <button class="modal-close" onclick="document.getElementById('incident-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                </div>
                <form id="incident-form">
                    <div class="modal-body form-grid">
                        <div class="form-group full-width">
                            <label>Mô tả sự cố *</label>
                            <textarea id="incident-desc" required rows="3"></textarea>
                        </div>
                        <div class="form-group">
                            <label>Loại sự cố *</label>
                            <select id="incident-type" required>
                                <option value="LOST_TICKET">Mất vé (LOST_TICKET)</option>
                                <option value="FACILITY_DAMAGE">Hư hỏng CSVC (FACILITY_DAMAGE)</option>
                                <option value="WRONG_LICENSE_PLATE">Sai biển số (WRONG_LICENSE_PLATE)</option>
                                <option value="SLOT_OCCUPIED">Chỗ đã bị chiếm (SLOT_OCCUPIED)</option>
                                <option value="OTHER">Khác (OTHER)</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>ID Phiên gửi xe (tùy chọn)</label>
                            <input type="number" id="incident-session-id" placeholder="ID nếu liên quan đến phiên" />
                        </div>
                        <div class="form-group full-width">
                            <label>URL Ảnh minh chứng (tùy chọn)</label>
                            <input type="text" id="incident-image" placeholder="https://..." />
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('incident-modal').classList.add('hidden')">Hủy</button>
                        <button type="submit" class="btn btn-primary">Gửi báo cáo</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    container.innerHTML = html;

    const tbody = document.getElementById('incidents-tbody');
    const statusSelect = document.getElementById('filter-status');
    const paginationInfo = document.getElementById('pagination-info');
    const paginationControls = document.getElementById('pagination-controls');

    function renderTable() {
        const statusVal = statusSelect.value;

        // Filter
        let filtered = incidentsData.filter(i => {
            if (statusVal && i.status !== statusVal) return false;
            return true;
        });

        // Pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        const startIdx = (currentPage - 1) * itemsPerPage;
        const pageData = filtered.slice(startIdx, startIdx + itemsPerPage);

        // Render rows
        tbody.innerHTML = pageData.map(i => {
            let statClass = '';
            switch(i.status) {
                case 'REPORTED': statClass = 'badge-yellow'; break;
                case 'OPEN': statClass = 'badge-yellow'; break;
                case 'IN_PROGRESS': statClass = 'badge-blue'; break;
                case 'RESOLVED': statClass = 'badge-green'; break;
                case 'CLOSED': statClass = 'badge-gray'; break;
                default: statClass = 'badge-gray';
            }
            
            const canEditInc = (App.state.user.role === 'Admin' || App.state.user.role === 'ParkingManager');
            const incStatusOpts = { 'REPORTED': 'Mới báo cáo', 'OPEN': 'Mở', 'IN_PROGRESS': 'Đang xử lý', 'RESOLVED': 'Đã giải quyết', 'CLOSED': 'Đã đóng' };
            const statBadge = canEditInc ? `
                <select onchange="window.updateIncidentStatus(${i.incidentId}, this.value)" class="badge ${statClass}" style="border:none; outline:none; cursor:pointer; font-weight:600; text-align:center;">
                    ${Object.entries(incStatusOpts).map(([k, v]) => `<option value="${k}" ${i.status === k ? 'selected' : ''}>${v}</option>`).join('')}
                </select>
            ` : `<span class="badge ${statClass}">${incStatusOpts[i.status] || i.status}</span>`;

            return `
            <tr>
                <td>#${i.incidentId}</td>
                <td style="font-weight:600">${i.title || i.description || '-'}</td>
                <td>${i.incidentType || '-'}</td>
                <td>${statBadge}</td>
                <td style="font-weight: 500;">${i.reportedByName || '-'}</td>
                <td>${i.reportTime ? new Date(i.reportTime).toLocaleString('vi-VN') : (i.createdAt ? new Date(i.createdAt).toLocaleString('vi-VN') : '-')}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="6" class="text-center">Không tìm thấy dữ liệu</td></tr>';

        // Render Pagination
        paginationInfo.textContent = `Hiển thị ${totalItems === 0 ? 0 : startIdx + 1} - ${Math.min(startIdx + itemsPerPage, totalItems)} trong số ${totalItems} bản ghi`;

        let btnHtml = `<button class="btn btn-outline" ${currentPage === 1 ? 'disabled' : ''} onclick="window.changeIncidentPage(${currentPage - 1})">Trước</button>`;
        btnHtml += `<span style="padding: 6px 12px; font-size: 0.85rem; background: var(--bg-color); border-radius: 6px; border: 1px solid var(--border-color);">Trang ${currentPage} / ${totalPages}</span>`;
        btnHtml += `<button class="btn btn-outline" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.changeIncidentPage(${currentPage + 1})">Sau</button>`;
        
        paginationControls.innerHTML = btnHtml;
    }

    // Bind events
    statusSelect.addEventListener('change', () => { currentPage = 1; renderTable(); });

    window.changeIncidentPage = (page) => {
        currentPage = page;
        renderTable();
    };

    window.showIncidentModal = () => document.getElementById('incident-modal').classList.remove('hidden');

    document.getElementById('incident-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const sid = document.getElementById('incident-session-id').value;
        const payload = {
            description: document.getElementById('incident-desc').value,
            incidentType: document.getElementById('incident-type').value,
            incidentImage: document.getElementById('incident-image').value,
            sessionId: sid ? parseInt(sid) : null
        };
        const r = await Api.createIncident(payload);
        if(r.success) {
            App.showToast('Báo cáo sự cố thành công', 'success');
            document.getElementById('incident-modal').classList.add('hidden');
            App.renderPage('incidents');
        } else {
            App.showToast(r.message || 'Lỗi khi báo cáo sự cố', 'error');
        }
    });

    window.updateIncidentStatus = async (id, status) => {
        if(!status) return;
        const r = await Api.updateIncidentStatus(id, status);
        if(r.success) {
            App.showToast('Cập nhật trạng thái sự cố thành công', 'success');
            App.renderPage('incidents');
        } else {
            App.showToast(r.message || 'Lỗi khi cập nhật', 'error');
        }
    };

    // Initial render
    renderTable();
};