import Api from '../api.js';

export async function renderPayments(container, App) {
    const res = await Api.getPayments();
    if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
    const data = res.data;
    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Lịch sử thanh toán</h3>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead><tr><th>Mã TT</th><th>Loại thanh toán</th><th>Số tiền</th><th>Phương thức</th><th>Thời gian</th><th>Trạng thái</th></tr></thead>
                    <tbody>
                        ${data.map(p => {
                            let badge = '';
                            switch(p.paymentStatus) {
                                case 'PENDING': badge = '<span class="badge badge-yellow">Đang chờ</span>'; break;
                                case 'SUCCESS': badge = '<span class="badge badge-green">Thành công</span>'; break;
                                case 'FAILED': badge = '<span class="badge badge-red">Thất bại</span>'; break;
                                default: badge = `<span class="badge badge-gray">${p.paymentStatus}</span>`;
                            }
                            let type = p.sessionId ? 'Phiên gửi xe' : (p.reservationId ? 'Đặt chỗ' : 'Khác');
                            return `
                            <tr>
                                <td>#${p.paymentId}</td>
                                <td>${type}</td>
                                <td style="font-weight:700; color:var(--green)">${p.amount.toLocaleString('vi-VN')} đ</td>
                                <td>${p.paymentMethod || '-'}</td>
                                <td>${p.paidAt ? new Date(p.paidAt).toLocaleString('vi-VN') : '-'}</td>
                                <td>
                                    ${badge}
                                    ${p.paymentStatus === 'PENDING' ? `<button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem; margin-left: 8px;" onclick="window.confirmPayment(${p.paymentId})">Nhận tiền mặt</button>` : ''}
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    container.innerHTML = html;

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
}
