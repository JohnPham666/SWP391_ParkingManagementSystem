import Api from '../api.js';

export async function renderSlots(container, App) {
    const res = await Api.getSlots();
    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }

    const data = res.data;
    
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Danh sách chỗ đỗ xe</h3>
                <div class="toolbar">
                    <input type="text" id="slot-search" class="search-input" placeholder="Tìm mã chỗ..." />
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
    `;

    data.forEach(s => {
        let statusBadge = '';
        switch(s.status) {
            case 'AVAILABLE': statusBadge = '<span class="badge badge-green">Trống</span>'; break;
            case 'OCCUPIED': statusBadge = '<span class="badge badge-red">Đã đầy</span>'; break;
            case 'RESERVED': statusBadge = '<span class="badge badge-yellow">Đã đặt</span>'; break;
            case 'LOCKED': statusBadge = '<span class="badge badge-gray">Khóa</span>'; break;
            default: statusBadge = `<span class="badge badge-gray">${s.status}</span>`;
        }

        html += `
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

    html += `
                    </tbody>
                </table>
            </div>
        </div>
    `;
    container.innerHTML = html;

    // Search logic
    const searchInput = document.getElementById('slot-search');
    const tbody = document.getElementById('slots-tbody');
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value.toLowerCase();
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const code = row.children[0].textContent.toLowerCase();
            row.style.display = code.includes(val) ? '' : 'none';
        });
    });
}
