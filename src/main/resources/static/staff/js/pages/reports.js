import Api from '../api.js';

export async function renderReports(container, App) {
    // Fetch data
    container.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    try {
        const [payRes, occRes, preRes] = await Promise.all([
            Api.getPayments(),
            Api.getOccupancy(),
            Api.getPredictions()
        ]);

        let payments = [];
        if (payRes.success) payments = payRes.data;
        
        // Lọc thanh toán thành công
        const paidPayments = payments.filter(p => p.paymentStatus === 'PAID');
        
        // Xử lý dữ liệu doanh thu theo ngày (7 ngày gần nhất)
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            return d;
        });
        
        const categories = last7Days.map(d => d.toLocaleDateString('vi-VN', {day: '2-digit', month: '2-digit'}));
        const revenueData = last7Days.map(d => {
            const dateStr = d.toISOString().split('T')[0];
            return paidPayments.filter(p => p.paidAt && p.paidAt.startsWith(dateStr))
                .reduce((sum, p) => sum + p.amount, 0);
        });

        // Doanh thu tháng này
        const currentMonth = new Date().getMonth();
        const monthlyRevenue = paidPayments
            .filter(p => p.paidAt && new Date(p.paidAt).getMonth() === currentMonth)
            .reduce((sum, p) => sum + p.amount, 0);

        // Tỷ lệ lấp đầy
        const capacity = occRes.success ? occRes.data.totalSlots : 0;
        const occupied = occRes.success ? occRes.data.occupiedSlots : 0;
        const available = occRes.success ? occRes.data.availableSlots : 0;
        const occRate = occRes.success ? occRes.data.occupancyRate : 0;

        let html = `
            <div style="display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px;">
                
                <!-- Left Column: Revenue Chart -->
                <div style="grid-column: span 8;">
                    <div class="card" style="height: 100%;">
                        <div class="card-header">
                            <h3 class="card-title">Tổng quan doanh thu (7 ngày)</h3>
                        </div>
                        <div class="card-body">
                            <div id="revenue-chart"></div>
                        </div>
                    </div>
                </div>

                <!-- Right Column: Occupancy & Earnings -->
                <div style="grid-column: span 4; display: flex; flex-direction: column; gap: 24px;">
                    
                    <!-- Yearly Breakup (Occupancy) -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Tỷ lệ lấp đầy hiện tại</h3>
                        </div>
                        <div class="card-body">
                            <div style="display: flex; align-items: center; justify-content: space-between;">
                                <div>
                                    <div style="display: flex; flex-direction: column; gap: 12px;">
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="width:12px; height:12px; border-radius:50%; background:var(--accent); box-shadow: 0 0 8px var(--accent-glow);"></span>
                                            <span style="font-size:0.95rem; font-weight: 500; color:var(--text-secondary);">Đang đỗ: <strong style="color:var(--text-primary); font-size: 1.1rem;">${occupied}</strong></span>
                                        </div>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span style="width:12px; height:12px; border-radius:50%; background:#e2e8f0;"></span>
                                            <span style="font-size:0.95rem; font-weight: 500; color:var(--text-secondary);">Trống: <strong style="color:var(--text-primary); font-size: 1.1rem;">${available}</strong></span>
                                        </div>
                                    </div>
                                </div>
                                <div style="position: relative;">
                                    <div id="occupancy-chart" style="filter: drop-shadow(0px 8px 16px rgba(249,115,22,0.15));"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Monthly Earnings -->
                    <div class="card" style="background: linear-gradient(135deg, var(--accent), var(--accent-dark)); color: white;">
                        <div class="card-body">
                            <h3 style="font-size: 1rem; font-weight: 600; margin-bottom: 16px; opacity: 0.9;">Doanh thu tháng này</h3>
                            <h2 style="font-size: 2rem; font-weight: 800; margin-bottom: 8px;">${monthlyRevenue.toLocaleString('vi-VN')} đ</h2>
                            <p style="font-size: 0.85rem; opacity: 0.8;">Cập nhật đến hôm nay</p>
                        </div>
                    </div>

                </div>
                
                <!-- Prediction Table -->
                <div style="grid-column: span 12;">
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Dự đoán chỗ trống (AI/Heuristics)</h3>
                        </div>
                        <div class="card-body no-pad table-wrapper">
                            <table class="data-table">
                                <thead>
                                    <tr>
                                        <th>Khung giờ</th>
                                        <th>Trạng thái dự kiến</th>
                                        <th>Mức độ tin cậy</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${preRes.success && preRes.data ? `
                                        <tr>
                                            <td>Trong 1 giờ tới</td>
                                            <td>${preRes.data.predictionText || 'Bình thường'}</td>
                                            <td><span class="badge badge-green">Cao</span></td>
                                        </tr>
                                    ` : `
                                        <tr><td colspan="3" style="text-align:center;">Chưa có dữ liệu dự đoán</td></tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        `;
        container.innerHTML = html;

        // Render ApexCharts
        if (window.ApexCharts) {
            // Revenue Chart (Bar)
            const revOptions = {
                series: [{ name: 'Doanh thu', data: revenueData }],
                chart: { type: 'bar', height: 350, toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
                colors: ['#f97316'],
                plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
                dataLabels: { enabled: false },
                stroke: { show: true, width: 2, colors: ['transparent'] },
                xaxis: { categories: categories, axisBorder: { show: false } },
                yaxis: { labels: { formatter: (val) => val.toLocaleString('vi-VN') + ' đ' } },
                grid: { borderColor: '#e2e8f0', strokeDashArray: 4 },
                fill: { opacity: 1 },
                tooltip: { y: { formatter: (val) => val.toLocaleString('vi-VN') + ' đ' } }
            };
            new ApexCharts(document.querySelector("#revenue-chart"), revOptions).render();

            // Occupancy Chart (Donut)
            const occOptions = {
                series: [occupied, available],
                chart: { 
                    type: 'donut', 
                    height: 180, 
                    fontFamily: 'Inter, sans-serif',
                    animations: { enabled: true, easing: 'easeinout', speed: 800, dynamicAnimation: { enabled: true, speed: 350 } }
                },
                colors: ['#f97316', '#e2e8f0'],
                labels: ['Đang đỗ', 'Trống'],
                plotOptions: { 
                    pie: { 
                        donut: { 
                            size: '75%',
                            labels: { 
                                show: true,
                                name: { show: false },
                                value: {
                                    show: true,
                                    fontSize: '1.5rem',
                                    fontWeight: 800,
                                    color: '#1e293b',
                                    formatter: function (val) { return val + ' xe' }
                                },
                                total: {
                                    show: true,
                                    showAlways: true,
                                    label: 'Lấp đầy',
                                    fontSize: '0.8rem',
                                    color: '#94a3b8',
                                    formatter: function (w) { return occRate.toFixed(1) + '%' }
                                }
                            }
                        } 
                    } 
                },
                dataLabels: { enabled: false },
                legend: { show: false },
                stroke: { show: false },
                tooltip: { theme: 'light', y: { formatter: function(val) { return val + " xe" } } }
            };
            new ApexCharts(document.querySelector("#occupancy-chart"), occOptions).render();
        }

    } catch (e) {
        container.innerHTML = `<div class="empty-state"><p style="color:var(--red)">Lỗi: ${e.message}</p></div>`;
    }
}
