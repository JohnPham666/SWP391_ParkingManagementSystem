import Api from '../api.js';

export async function renderReservations(container, App) {
    const res = await Api.getReservations();
    if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
    const data = res.data;
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Quản lý đặt chỗ</h3>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Mã Đặt</th><th>Khách hàng</th><th>Biển số xe</th><th>Chỗ đỗ</th><th>TG Bắt đầu</th><th>TG Kết thúc</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                        ${data.map(r => {
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

                            return `
                            <tr>
                                <td>#${r.reservationId}</td>
                                <td>${r.userName || '-'}</td>
                                <td>${r.licensePlate || '-'}</td>
                                <td>${r.slotCode || '-'}</td>
                                <td>${new Date(r.startTime).toLocaleString('vi-VN')}</td>
                                <td>${new Date(r.endTime).toLocaleString('vi-VN')}</td>
                                <td>${badge}</td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;

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
}
