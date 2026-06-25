import Api from '../api.js';

export async function renderVehicles(container, App) {
    const res = await Api.getVehicles();
    if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
    const data = res.data;
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Quản lý phương tiện</h3>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>Biển số</th><th>Chủ xe</th><th>Loại xe</th><th>Hãng xe</th><th>Màu sắc</th><th>Ngày đăng ký</th></tr></thead>
                    <tbody>
                        ${data.map(v => `
                            <tr>
                                <td>#${v.vehicleId}</td>
                                <td style="font-weight:700">${v.licensePlate}</td>
                                <td>${v.ownerName || '-'}</td>
                                <td>${v.vehicleTypeName || '-'}</td>
                                <td>${v.brand || '-'}</td>
                                <td>${v.color || v.vehicleColor || '-'}</td>
                                <td>${v.createdAt ? new Date(v.createdAt).toLocaleDateString('vi-VN') : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;
}
