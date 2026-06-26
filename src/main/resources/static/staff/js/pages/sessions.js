    // ==========================================
    // 2. PHI�N G?I XE: Qu?n l� c�c xe dang d?u trong b�i v� l?ch s? ra v�o
    // ==========================================
Pages.renderSessions = async function(container) {
        const res = await Api.getSessions();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }

        const data = res.data;
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách phiên gửi xe</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="session-search" class="search-input" placeholder="Tìm biển số xe..." style="flex: 1;" />
                        <select id="session-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PARKING">Đang đỗ</option>
                            <option value="COMPLETED">Hoàn thành</option>
                            <option value="UNPAID">Chưa thanh toán</option>
                            <option value="LOST_TICKET">Mất vé</option>
                        </select>
                        <select id="session-time-sort" class="search-input" style="width: auto;">
                            <option value="desc">Mới nhất -> Cũ nhất</option>
                            <option value="asc">Cũ nhất -> Mới nhất</option>
                        </select>
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
                                <th>Cổng vào</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody id="sessions-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="sessions-pagination" style="padding: 0 20px;"></div>
            </div>
            
            <!-- Session Detail Modal -->
            <div id="session-detail-modal" class="modal-overlay hidden">
                <div class="modal" style="max-width: 600px;">
                    <div class="modal-header">
                        <h3>Chi tiết phiên gửi xe #<span id="sd-id"></span></h3>
                        <button class="modal-close" onclick="document.getElementById('session-detail-modal').classList.add('hidden')"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg></button>
                    </div>
                    <div class="modal-body" style="line-height: 1.8; font-size: 0.95rem;">
                        <div id="sd-content">Đang tải...</div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-outline" onclick="document.getElementById('session-detail-modal').classList.add('hidden')">Đóng</button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('sessions-tbody');
            if(!tbody) return;
            
            // Sort
            const sortVal = document.getElementById('session-time-sort').value;
            currentData.sort((a, b) => {
                const timeA = a.entryTime ? new Date(a.entryTime).getTime() : 0;
                const timeB = b.entryTime ? new Date(b.entryTime).getTime() : 0;
                return sortVal === 'desc' ? timeB - timeA : timeA - timeB;
            });
            
            // Filter
            const textVal = document.getElementById('session-search').value.toLowerCase();
            const statusVal = document.getElementById('session-status-filter').value;
            
            const filteredData = currentData.filter(s => {
                const plate = (s.licensePlate || '').toLowerCase();
                const matchText = plate.includes(textVal);
                const matchStatus = statusVal === '' || s.status === statusVal;
                return matchText && matchStatus;
            });
            
            // Paginate
            const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(s => {
                let statusBadge = '';
                switch(s.status) {
                    case 'PARKING': statusBadge = '<span class="badge badge-blue">Đang đỗ</span>'; break;
                    case 'COMPLETED': statusBadge = '<span class="badge badge-green">Hoàn thành</span>'; break;
                    case 'UNPAID': statusBadge = '<span class="badge badge-yellow">Chưa thanh toán</span>'; break;
                    case 'LOST_TICKET': statusBadge = '<span class="badge badge-red">Mất vé</span>'; break;
                    default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
                }
                tbodyHtml += `
                    <tr onclick="window.showSessionDetail(${s.sessionId})" style="cursor: pointer;" class="hoverable-row">
                        <td style="color: var(--blue); font-weight: 700;">#${s.sessionId}</td>
                        <td style="font-weight:600">${s.licensePlate || '-'}</td>
                        <td>${s.slotCode || '-'}</td>
                        <td>${s.vehicleTypeName || '-'}</td>
                        <td>${s.entryTime ? new Date(s.entryTime).toLocaleString('vi-VN') : '-'}</td>
                        <td>${s.entryGate || '-'}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('sessions-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.sessionsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.sessionsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.sessionsChangePage = (p) => { currentPage = p; renderTableBody(); };

        document.getElementById('session-search').addEventListener('input', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('session-status-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('session-time-sort').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        
        renderTableBody();

        window.showSessionDetail = async (id) => {
            const modal = document.getElementById('session-detail-modal');
            const content = document.getElementById('sd-content');
            document.getElementById('sd-id').textContent = id;
            content.innerHTML = '<div style="text-align:center; padding: 20px;">Đang tải dữ liệu...</div>';
            modal.classList.remove('hidden');

            const res = await Api.getSession(id);
            if (!res.success) {
                content.innerHTML = `<p style="color: var(--red);">${res.message || 'Lỗi tải dữ liệu'}</p>`;
                return;
            }
            
            const s = res.data;
            
            let statusBadge = '';
            switch(s.status) {
                case 'PARKING': statusBadge = '<span class="badge badge-blue">Đang đỗ</span>'; break;
                case 'COMPLETED': statusBadge = '<span class="badge badge-green">Hoàn thành</span>'; break;
                case 'UNPAID': statusBadge = '<span class="badge badge-yellow">Chưa thanh toán</span>'; break;
                case 'LOST_TICKET': statusBadge = '<span class="badge badge-red">Mất vé</span>'; break;
                default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
            }

            content.innerHTML = `
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div><strong>Biển số xe:</strong> ${s.licensePlate || '-'}</div>
                    <div><strong>Trạng thái:</strong> ${statusBadge}</div>
                    
                    <div><strong>Chỗ đỗ:</strong> ${s.slotCode || '-'}</div>
                    <div><strong>Loại xe:</strong> ${s.vehicleTypeName || '-'}</div>
                    
                    <div><strong>Khách hàng:</strong> ${s.customerName || '-'}</div>
                    <div><strong>Số điện thoại:</strong> ${s.customerPhone || '-'}</div>
                    
                    <div><strong>Giờ vào:</strong> ${s.entryTime ? new Date(s.entryTime).toLocaleString('vi-VN') : '-'}</div>
                    <div><strong>Cổng vào:</strong> ${s.entryGate || '-'}</div>
                    
                    <div><strong>Giờ ra:</strong> ${s.exitTime ? new Date(s.exitTime).toLocaleString('vi-VN') : '-'}</div>
                    <div><strong>Cổng ra:</strong> ${s.exitGate || '-'}</div>
                    
                    <div><strong>Phí dự kiến:</strong> <span style="color:var(--orange); font-weight:600;">${s.estimatedFee != null ? s.estimatedFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
                    <div><strong>Phí thực tế:</strong> <span style="color:var(--green); font-weight:700;">${s.finalFee != null ? s.finalFee.toLocaleString('vi-VN') + ' đ' : '-'}</span></div>
                </div>
            `;
        };
};
