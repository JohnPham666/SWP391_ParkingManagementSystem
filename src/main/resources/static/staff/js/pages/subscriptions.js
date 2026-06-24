import Api from '../api.js';

export async function renderSubscriptions(container, App) {
    const res = await Api.getSubscriptions();
    if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
    const data = res.data;
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Quản lý Vé Tháng</h3>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead><tr><th>ID</th><th>Khách hàng</th><th>Biển số xe</th><th>Chỗ/Khu vực</th><th>Ngày bắt đầu</th><th>Ngày kết thúc</th><th>Phí tháng</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                        ${data.map(s => {
                            let badge = '';
                            switch(s.status) {
                                case 'ACTIVE': badge = '<span class="badge badge-green">Đang hoạt động</span>'; break;
                                case 'EXPIRED': badge = '<span class="badge badge-red">Đã hết hạn</span>'; break;
                                case 'CANCELLED': badge = '<span class="badge badge-gray">Đã hủy</span>'; break;
                                default: badge = `<span class="badge badge-gray">${s.status}</span>`;
                            }
                            let boundTo = '-';
                            if (s.slotCode) boundTo = s.slotCode;
                            else if (s.zoneName) boundTo = s.zoneName;

                            return `
                            <tr>
                                <td>#${s.subscriptionId}</td>
                                <td>${s.userName || '-'}</td>
                                <td style="font-weight:700">${s.licensePlate || '-'}</td>
                                <td>${boundTo}</td>
                                <td>${s.startDate ? new Date(s.startDate).toLocaleDateString('vi-VN') : '-'}</td>
                                <td>${s.endDate ? new Date(s.endDate).toLocaleDateString('vi-VN') : '-'}</td>
                                <td>${s.monthlyFee ? s.monthlyFee.toLocaleString('vi-VN') + ' đ' : '-'}</td>
                                <td>${badge}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;
}
