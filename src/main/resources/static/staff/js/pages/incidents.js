Pages.renderIncidents = async function(container) {
        const res = await Api.getIncidents();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý sự cố</h3>
                    <div class="toolbar">
                        <button class="btn btn-primary" onclick="window.showIncidentModal()">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg> Báo cáo sự cố
                        </button>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>ID</th><th>Tiêu đề</th><th>Mức độ</th><th>Loại sự cố</th><th>Trạng thái</th><th>Người báo cáo</th><th>TG báo cáo</th></tr></thead>
                        <tbody id="incidents-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="incidents-pagination" style="padding: 0 20px;"></div>
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
            </div>
            `;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('incidents-tbody');
            if(!tbody) return;
            
            // Paginate
            const totalPages = Math.ceil(currentData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = currentData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(i => {
                let sevBadge = '';
                switch(i.severity) {
                    case 'LOW': sevBadge = '<span class="badge badge-blue">Thấp</span>'; break;
                    case 'MEDIUM': sevBadge = '<span class="badge badge-yellow">Vừa</span>'; break;
                    case 'HIGH': sevBadge = '<span class="badge badge-red">Cao</span>'; break;
                    case 'CRITICAL': sevBadge = '<span style="background:#991b1b;color:#fff;padding:4px 10px;border-radius:50px;font-size:.75rem;font-weight:600;">Nghiêm trọng</span>'; break;
                    default: sevBadge = `<span class="badge badge-gray">${i.severity || '-'}</span>`;
                }
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

                tbodyHtml += `
                <tr>
                    <td>#${i.incidentId}</td>
                    <td style="font-weight:600">${i.title || i.description || '-'}</td>
                    <td>${sevBadge}</td>
                    <td>${i.incidentType || '-'}</td>
                    <td>${statBadge}</td>
                    <td>${i.reporterName || '-'}</td>
                    <td>${i.reportTime ? new Date(i.reportTime).toLocaleString('vi-VN') : (i.createdAt ? new Date(i.createdAt).toLocaleString('vi-VN') : '-')}</td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('incidents-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${currentData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.incidentsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.incidentsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.incidentsChangePage = (p) => { currentPage = p; renderTableBody(); };
        renderTableBody();

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
};
