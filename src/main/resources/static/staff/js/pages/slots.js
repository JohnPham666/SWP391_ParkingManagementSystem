    // ==========================================
    // 3. CH? �? XE: Qu?n l� danh s�ch c�c � d?u xe, tr?ng th�i tr?ng/d?y/d� d?t
    // ==========================================
Pages.renderSlots = async function(container) {
        const res = await Api.getSlots();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }

        const data = res.data;
        const zones = [...new Set(data.map(s => s.zoneName).filter(Boolean))];
        const vTypes = [...new Set(data.map(s => s.vehicleTypeName).filter(Boolean))];
        
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Danh sách chỗ đỗ xe</h3>
                    <div class="toolbar" style="display: flex; gap: 10px;">
                        <input type="text" id="slot-search" class="search-input" placeholder="Tìm mã chỗ..." style="flex: 1;" />
                        <select id="slot-status-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="AVAILABLE">Trống</option>
                            <option value="OCCUPIED">Đã đầy</option>
                            <option value="RESERVED">Đã đặt</option>
                            <option value="LOCKED">Khóa</option>
                        </select>
                        <select id="slot-zone-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả khu vực</option>
                            ${zones.map(z => `<option value="${z}">${z}</option>`).join('')}
                        </select>
                        <select id="slot-type-filter" class="search-input" style="width: auto;">
                            <option value="">Tất cả loại xe</option>
                            ${vTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Mã chỗ</th>
                                <th>Tòa nhà</th>
                                <th>Tầng</th>
                                <th>Khu vực</th>
                                <th>Loại xe</th>
                                <th>Sức chứa</th>
                                <th>Đang đỗ</th>
                                <th>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody id="slots-tbody">
                        </tbody>
                    </table>
                </div>
                <div id="slots-pagination" style="padding: 0 20px;"></div>
            </div>
        `;
        container.innerHTML = html;

        let currentData = data;
        let currentPage = 1;
        const rowsPerPage = 15;

        const renderTableBody = () => {
            const tbody = document.getElementById('slots-tbody');
            if(!tbody) return;
            
            // Filter
            const textVal = document.getElementById('slot-search').value.toLowerCase();
            const statusVal = document.getElementById('slot-status-filter').value;
            const zoneVal = document.getElementById('slot-zone-filter').value;
            const typeVal = document.getElementById('slot-type-filter').value;

            const filteredData = currentData.filter(s => {
                const code = (s.slotCode || '').toLowerCase();
                const matchText = code.includes(textVal);
                const matchStatus = statusVal === '' || s.status === statusVal;
                const matchZone = zoneVal === '' || s.zoneName === zoneVal;
                const matchType = typeVal === '' || s.vehicleTypeName === typeVal;

                return matchText && matchStatus && matchZone && matchType;
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
                    case 'AVAILABLE': statusBadge = '<span class="badge badge-green">Trống</span>'; break;
                    case 'OCCUPIED': statusBadge = '<span class="badge badge-red">Đã đầy</span>'; break;
                    case 'RESERVED': statusBadge = '<span class="badge badge-yellow">Đã đặt</span>'; break;
                    case 'LOCKED': statusBadge = '<span class="badge badge-gray">Khóa</span>'; break;
                    default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
                }
                tbodyHtml += `
                    <tr>
                        <td style="font-weight:700">${s.slotCode}</td>
                        <td>${s.buildingName || '-'}</td>
                        <td>${s.floorName || '-'}</td>
                        <td>${s.zoneName || '-'}</td>
                        <td>${s.vehicleTypeName || '-'}</td>
                        <td>${s.capacity}</td>
                        <td>${s.currentOccupancy}</td>
                        <td>${statusBadge}</td>
                    </tr>
                `;
            });
            tbody.innerHTML = tbodyHtml;
            
            // Pagination controls
            const pCont = document.getElementById('slots-pagination');
            if(pCont) {
                pCont.innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; gap: 10px; padding: 15px 0;">
                        <span style="font-size: 0.9rem; color: var(--text-muted)">Trang ${currentPage} / ${totalPages} (${filteredData.length} kết quả)</span>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === 1 ? 'disabled' : ''} onclick="window.slotsChangePage(${currentPage - 1})">Trước</button>
                        <button class="btn btn-outline" style="padding: 4px 12px;" ${currentPage === totalPages ? 'disabled' : ''} onclick="window.slotsChangePage(${currentPage + 1})">Sau</button>
                    </div>
                `;
            }
        };

        window.slotsChangePage = (p) => { currentPage = p; renderTableBody(); };
        document.getElementById('slot-search').addEventListener('input', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('slot-status-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('slot-zone-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        document.getElementById('slot-type-filter').addEventListener('change', () => { currentPage = 1; renderTableBody(); });
        
        renderTableBody();
};
