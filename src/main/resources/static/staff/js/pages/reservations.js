    // ==========================================
    // 4. �?T CH?: Qu?n l� y�u c?u d?t ch? tru?c c?a kh�ch h�ng (Driver)
    // ==========================================
Pages.renderReservations = async function(container) {
        const res = await Api.getReservations();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data || [];
        const d = new Date();
        const today = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Quản lý đặt chỗ</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="res-search" class="search-input" placeholder="Tìm biển số xe..." style="flex: 1;" />
                        <select id="res-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ xác nhận</option>
                            <option value="CONFIRMED">Đã xác nhận</option>
                            <option value="COMPLETED">Đã hoàn thành</option>
                            <option value="CANCELLED">Đã hủy</option>
                        </select>
                        <input type="date" id="res-date-filter" class="search-input" value="${today}" style="width: auto;" />
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Mã Đặt</th><th>Khách hàng</th><th>Biển số xe</th><th>Chỗ đỗ</th><th>TG Bắt đầu</th><th>TG Kết thúc</th><th>Trạng thái</th></tr></thead>
                        <tbody id="res-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="res-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('res-tbody');
            if(!tbody) return;
            
            // Sort
            currentData.sort((a, b) => {
                const tA = a.reservationStart ? new Date(a.reservationStart).getTime() : 0;
                const tB = b.reservationStart ? new Date(b.reservationStart).getTime() : 0;
                return tB - tA; // Mới nhất trước
            });

            // Filter
            const textVal = document.getElementById('res-search').value.toLowerCase();
            const statusVal = document.getElementById('res-status-filter').value;
            const dateVal = document.getElementById('res-date-filter').value;

            const filteredData = currentData.filter(r => {
                const plate = (r.licensePlate || '').toLowerCase();
                const matchText = plate.includes(textVal);
                const matchStatus = statusVal === '' || r.status === statusVal;
                
                let matchDate = true;
                if (dateVal && r.reservationStart) {
                    const d = new Date(r.reservationStart);
                    const rDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                    matchDate = rDate === dateVal;
                } else if (dateVal && !r.reservationStart) {
                    matchDate = false;
                }

                return matchText && matchStatus && matchDate;
            });
            
            // Paginate
            const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(r => {
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

                tbodyHtml += `
                <tr>
                    <td>#${r.reservationId}</td>
                    <td>${r.userFullName || r.guestName || '-'}</td>
                    <td>${r.licensePlate || '-'}</td>
                    <td>${r.slotCode || '-'}</td>
                    <td>${r.reservationStart ? new Date(r.reservationStart).toLocaleString('vi-VN') : '-'}</td>
                    <td>${r.reservationEnd ? new Date(r.reservationEnd).toLocaleString('vi-VN') : '-'}</td>
                    <td>${badge}</td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('res-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.resChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.resChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.resChangePage = (p) => { currentPage = p; renderTableBody(); };
        document.getElementById('res-search').addEventListener('input', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('res-status-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('res-date-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        
        window.resetResFilters = () => {
            document.getElementById('res-search').value = '';
            document.getElementById('res-status-filter').value = '';
            document.getElementById('res-date-filter').value = '';
            currentPage = 1;
            renderTableBody();
        };

        renderTableBody();

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
};
