    // ==========================================
    // 5. THANH TO�N: Danh s�ch c�c giao d?ch thu ph� d? xe
    // ==========================================
Pages.renderPayments = async function(container) {
        const res = await Api.getPayments();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data;
        const methods = [...new Set(data.map(p => p.paymentMethod).filter(Boolean))];

        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Lịch sử thanh toán</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="pay-search" class="search-input" placeholder="Tìm mã TT, biển số..." style="flex: 1;" />
                        <select id="pay-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="PENDING">Đang chờ</option>
                            <option value="SUCCESS">Thành công</option>
                            <option value="FAILED">Thất bại</option>
                        </select>
                        <select id="pay-method-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả phương thức</option>
                            ${methods.map(m => `<option value="${m}">${m}</option>`).join('')}
                        </select>
                        <select id="pay-type-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả loại</option>
                            <option value="SESSION">Phiên gửi xe</option>
                            <option value="RESERVATION">Đặt chỗ</option>
                        </select>
                        <input type="date" id="pay-date-filter" class="search-input" style="width: auto;" />
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Mã TT</th><th>Loại thanh toán</th><th>Biển số xe</th><th>Số tiền</th><th>Phương thức</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
                        <tbody id="payments-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="payments-pagination" style="padding: 0 20px;"></div>
            </div>`;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('payments-tbody');
            if(!tbody) return;
            
            // Filter
            const textVal = document.getElementById('pay-search') ? document.getElementById('pay-search').value.toLowerCase() : '';
            const statusVal = document.getElementById('pay-status-filter') ? document.getElementById('pay-status-filter').value : '';
            const methodVal = document.getElementById('pay-method-filter') ? document.getElementById('pay-method-filter').value : '';
            const typeVal = document.getElementById('pay-type-filter') ? document.getElementById('pay-type-filter').value : '';
            const dateVal = document.getElementById('pay-date-filter') ? document.getElementById('pay-date-filter').value : '';

            const filteredData = currentData.filter(p => {
                const searchStrId = String(p.paymentId).toLowerCase();
                const searchStrPlate = (p.licensePlate || '').toLowerCase();
                const searchMatch = !textVal || searchStrId.includes(textVal) || searchStrPlate.includes(textVal);
                const statusMatch = !statusVal || p.paymentStatus === statusVal;
                const methodMatch = !methodVal || p.paymentMethod === methodVal;
                
                let pType = p.sessionId ? 'SESSION' : (p.reservationId ? 'RESERVATION' : 'OTHER');
                const typeMatch = !typeVal || pType === typeVal;
                
                let dateMatch = true;
                if (dateVal) {
                    const dt = p.paidAt || p.createdAt;
                    if (dt) {
                        const d = new Date(dt);
                        const rDate = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
                        dateMatch = rDate === dateVal;
                    } else {
                        dateMatch = false;
                    }
                }
                
                return searchMatch && statusMatch && methodMatch && typeMatch && dateMatch;
            });
            
            // Paginate
            const totalPages = Math.ceil(filteredData.length / rowsPerPage) || 1;
            if(currentPage > totalPages) currentPage = totalPages;
            if(currentPage < 1) currentPage = 1;
            
            const startIndex = (currentPage - 1) * rowsPerPage;
            const pageData = filteredData.slice(startIndex, startIndex + rowsPerPage);
            
            let tbodyHtml = '';
            pageData.forEach(p => {
                let badge = '';
                switch(p.paymentStatus) {
                    case 'PENDING': badge = '<span class="badge badge-yellow">Đang chờ</span>'; break;
                    case 'SUCCESS': badge = '<span class="badge badge-green">Thành công</span>'; break;
                    case 'FAILED': badge = '<span class="badge badge-red">Thất bại</span>'; break;
                    default: badge = `<span class="badge badge-gray">${p.paymentStatus}</span>`;
                }
                let type = p.sessionId ? 'Phiên gửi xe' : (p.reservationId ? 'Đặt chỗ' : 'Khác');
                tbodyHtml += `
                <tr>
                    <td>#${p.paymentId}</td>
                    <td>${type}</td>
                    <td>${p.licensePlate || '-'}</td>
                    <td style="font-weight:700; color:var(--green)">${p.amount.toLocaleString('vi-VN')} đ</td>
                    <td>${p.paymentMethod || '-'}</td>
                    <td>${p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '-'}</td>
                    <td>
                        ${badge}
                        ${p.paymentStatus === 'PENDING' ? `<button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; margin-left: 8px;" onclick="window.confirmPayment(${p.paymentId})">Nhận tiền mặt</button>` : ''}
                    </td>
                </tr>`;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('payments-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.paymentsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.paymentsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.paymentsChangePage = (p) => { currentPage = p; renderTableBody(); };
        const attachEvt = (id) => { const el = document.getElementById(id); if(el) el.addEventListener('input', () => { currentPage = 1; renderTableBody(); }); };
        ['pay-search', 'pay-status-filter', 'pay-method-filter', 'pay-type-filter', 'pay-date-filter'].forEach(attachEvt);
        
        renderTableBody();

        window.confirmPayment = async (id) => {
            if(confirm('Xác nhận đã thu tiền mặt cho giao dịch này?')) {
                const r = await Api.confirmCash(id);
                if(r.success) {
                    App.showToast('Xác nhận thanh toán thành công', 'success');
                    App.renderPage('payments');
                } else {
                    App.showToast(r.message || 'Lỗi xác nhận', 'error');
                }
            }
        };
};
