window.Pages = window.Pages || {};
Pages.renderPricing = async function(container) {
        const res = await Api.getPricingPolicies();
        if (!res.success) return container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        const data = res.data || [];
        let html = `
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Chính sách Giá (Pricing Policies)</h3>
                    <div class="toolbar">
                        <button class="btn btn-primary" onclick="alert('Tính năng thêm chính sách đang phát triển')">Thêm Chính sách</button>
                    </div>
                </div>
                <div class="card-body no-pad table-wrapper">
                    <table class="data-table">
                        <thead><tr><th>Loại xe</th><th>Tên chính sách</th><th>Giá cơ bản (VND)</th><th>Phí mỗi giờ</th><th>Giá ngày (Max)</th><th>Giá tháng</th><th>Thao tác</th></tr></thead>
                        <tbody>
                            ${data.map(p => `
                                <tr>
                                    <td><span class="badge badge-purple">${p.vehicleTypeName || '-'}</span></td>
                                    <td style="font-weight:600">${p.policyName}</td>
                                    <td>${p.basePrice ? p.basePrice.toLocaleString() : '0'} đ</td>
                                    <td>${p.hourlyRate ? p.hourlyRate.toLocaleString() : '0'} đ</td>
                                    <td>${p.maxDailyRate ? p.maxDailyRate.toLocaleString() : '0'} đ</td>
                                    <td>${p.monthlyRate ? p.monthlyRate.toLocaleString() : '0'} đ</td>
                                    <td>
                                        <button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.8rem;" onclick="alert('Tính năng chỉnh sửa đang phát triển')">Sửa</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>`;
        container.innerHTML = html;
    };