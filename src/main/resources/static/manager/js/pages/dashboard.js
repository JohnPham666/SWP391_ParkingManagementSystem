window.Pages = window.Pages || {};
Pages.renderDashboard = async function(container) {
        const res = await Api.getDashboard();
        if (!res.success) {
            container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
            return;
        }
        
        const data = res.data;
        const sum = data.summary;
        
        let html = `
            <div class="dashboard-header-cards" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; margin-bottom: 24px;">
                <div class="stat-card premium-card">
                    <div class="stat-icon-wrapper" style="background: rgba(234,88,12,.1); color: #ea580c;">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 12z"></path><path d="M21 3v9h-9"></path></svg>
                    </div>
                    <div class="stat-content">
                        <h3>${sum.currentOccupancy} <span style="font-size: 1rem; color: #94a3b8; font-weight: 500;">/ ${sum.totalCapacity}</span></h3>
                        <p>Chỗ đang đỗ</p>
                        <span class="stat-trend" style="color: #ea580c; font-weight: 600; font-size: 0.8rem;">${sum.occupancyRate.toFixed(1)}% tỷ lệ lấp đầy</span>
                    </div>
                </div>
                <div class="stat-card premium-card">
                    <div class="stat-icon-wrapper" style="background: rgba(245,158,11,.1); color: #f59e0b;">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
                    </div>
                    <div class="stat-content">
                        <h3>${sum.availableCapacity}</h3>
                        <p>Chỗ trống hiện tại</p>
                        <span class="stat-trend" style="color: #f59e0b; font-weight: 600; font-size: 0.8rem;">Sẵn sàng phục vụ</span>
                    </div>
                </div>
                <div class="stat-card premium-card">
                    <div class="stat-icon-wrapper" style="background: rgba(34,197,94,.1); color: #16a34a;">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                    </div>
                    <div class="stat-content">
                        <h3>${sum.reservedSlots}</h3>
                        <p>Đã đặt trước</p>
                        <span class="stat-trend" style="color: #16a34a; font-weight: 600; font-size: 0.8rem;">Chờ nhận xe</span>
                    </div>
                </div>
            </div>

            <div class="dashboard-grid" style="display: grid; grid-template-columns: 1fr; gap: 24px;">
                <div class="dashboard-chart-section premium-card card">
                    <div class="card-header border-none pb-0" style="border-bottom: none; padding-bottom: 0;">
                        <h3 class="card-title" style="font-size: 1.1rem; color: #1e293b;">Tỷ lệ lấp đầy theo thời gian</h3>
                    </div>
                    <div class="card-body">
                        <div id="occupancyChart" style="min-height: 250px;"></div>
                    </div>
                </div>
            </div>
            
            <div class="dashboard-buildings-section premium-card card" style="margin-top: 24px;">
                <div class="card-header border-none pb-0" style="border-bottom: none; padding-bottom: 0;">
                    <h3 class="card-title" style="font-size: 1.1rem; color: #1e293b;">Bảng thống kê lấp đầy (Tình trạng khu vực)</h3>
                </div>
                <div class="card-body no-pad table-wrapper" style="padding-top: 10px;">
                    <table class="data-table dashboard-table" style="width: 100%;">
                        <thead>
                            <tr style="border-bottom: 1px solid #f1f5f9;">
                                <th style="background: #fff; color: #64748b; font-weight: 600; padding: 16px; position: sticky; top: 0; z-index: 10;">Khu vực/Tầng</th>
                                <th style="background: #fff; color: #64748b; font-weight: 600; padding: 16px; position: sticky; top: 0; z-index: 10;">Tổng chỗ</th>
                                <th style="background: #fff; color: #64748b; font-weight: 600; padding: 16px; position: sticky; top: 0; z-index: 10;">Đang đỗ</th>
                                <th style="background: #fff; color: #64748b; font-weight: 600; padding: 16px; position: sticky; top: 0; z-index: 10;">Trống</th>
                                <th style="background: #fff; color: #64748b; font-weight: 600; padding: 16px; position: sticky; top: 0; z-index: 10;">Tỷ lệ lấp đầy</th>
                            </tr>
                        </thead>
                        <tbody id="buildings-tbody">
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="dashboard-slots-section premium-card card" style="margin-top: 24px;">
                <div class="card-header border-none pb-0" style="display: flex; justify-content: space-between; align-items: center; border-bottom: none; padding-bottom: 0;">
                    <h3 class="card-title" style="font-size: 1.1rem; color: #1e293b;">Sơ đồ bãi đỗ xe chi tiết</h3>
                    <div class="toolbar" style="gap: 8px;">
                        <select id="db-filter-status" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0;">
                            <option value="">Tất cả trạng thái</option>
                            <option value="AVAILABLE">Trống</option>
                            <option value="OCCUPIED">Đang đỗ</option>
                            <option value="RESERVED">Đã đặt</option>
                        </select>
                        <select id="db-filter-type" class="form-control" style="width: auto; padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; background: #f8fafc; border: 1px solid #e2e8f0;">
                            <option value="">Tất cả loại xe</option>
                        </select>
                    </div>
                </div>
                <div class="card-body scrollable-slots" style="max-height: 450px; overflow-y: auto;">
                    <div id="slots-container"></div>
                </div>
            </div>
        `;

        container.innerHTML = html;

        let slotsHtml = `
            <table class="data-table dashboard-table" style="width: 100%;">
                <thead>
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                        <th style="background: #fff; color: #64748b; font-weight: 600; padding: 12px; position: sticky; top: 0; z-index: 10;">Mã chỗ</th>
                        <th style="background: #fff; color: #64748b; font-weight: 600; padding: 12px; position: sticky; top: 0; z-index: 10;">Vị trí</th>
                        <th style="background: #fff; color: #64748b; font-weight: 600; padding: 12px; position: sticky; top: 0; z-index: 10;">Loại xe</th>
                        <th style="background: #fff; color: #64748b; font-weight: 600; padding: 12px; position: sticky; top: 0; z-index: 10;">Trạng thái</th>
                        <th style="background: #fff; color: #64748b; font-weight: 600; padding: 12px; position: sticky; top: 0; z-index: 10;">Thao tác</th>
                    </tr>
                </thead>
                <tbody>
        `;
        let tableHtml = '';
        
        if (data.buildings && data.buildings.length > 0) {
            data.buildings.forEach(b => {
                b.floors.forEach(f => {
                    let fTotal = 0, fOccupied = 0, fAvailable = 0;
                    
                    f.zones.forEach(z => {
                        fTotal += z.summary.totalCapacity;
                        fOccupied += z.summary.currentOccupancy;
                        fAvailable += z.summary.availableCapacity;
                        
                        z.slots.forEach(s => {
                            let statusBadge = '';
                            let actionBtn = '';
                            switch(s.status) {
                                case 'AVAILABLE': 
                                    statusBadge = '<span class="badge badge-green" style="font-size: 0.75rem;">Trống</span>'; 
                                    actionBtn = `<button class="btn btn-outline" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.updateSlotStatus(${s.slotId}, 'LOCKED')">Khóa</button>`;
                                    break;
                                case 'OCCUPIED': 
                                    statusBadge = '<span class="badge badge-red" style="font-size: 0.75rem;">Đang đỗ</span>'; 
                                    break;
                                case 'RESERVED': 
                                    statusBadge = '<span class="badge badge-yellow" style="font-size: 0.75rem;">Đã đặt</span>'; 
                                    break;
                                case 'LOCKED': 
                                    statusBadge = '<span class="badge badge-gray" style="font-size: 0.75rem;">Khóa</span>'; 
                                    actionBtn = `<button class="btn btn-primary" style="padding: 2px 8px; font-size: 0.75rem;" onclick="window.updateSlotStatus(${s.slotId}, 'AVAILABLE')">Mở</button>`;
                                    break;
                                default: 
                                    statusBadge = `<span class="badge badge-gray" style="font-size: 0.75rem;">${s.status}</span>`;
                            }
                            
                            slotsHtml += `
                                <tr class="slot-row" data-status="${s.status}" data-type="${s.vehicleTypeName}">
                                    <td style="font-weight: 600; color: #1e293b; padding: 12px;">${s.slotCode}</td>
                                    <td style="padding: 12px;">${b.buildingName} - ${f.floorName} - ${z.zoneName}</td>
                                    <td style="padding: 12px;">${s.vehicleTypeName}</td>
                                    <td style="padding: 12px;">${statusBadge}</td>
                                    <td style="padding: 12px;">${actionBtn}</td>
                                </tr>
                            `;
                        });
                    });
                    
                    let rate = fTotal ? ((fOccupied / fTotal) * 100).toFixed(0) : 0;
                    tableHtml += `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                            <td style="font-weight: 600; color: #334155; padding: 16px;">${b.buildingName} - ${f.floorName}</td>
                            <td style="padding: 16px; color: #475569;">${fTotal}</td>
                            <td style="padding: 16px; color: #475569;">${fOccupied}</td>
                            <td style="padding: 16px; color: #475569;">${fAvailable}</td>
                            <td style="padding: 16px;"><span style="font-weight: 600; color: ${rate > 80 ? '#ef4444' : '#10b981'}">${rate}%</span></td>
                        </tr>
                    `;
                });
            });
        }
        slotsHtml += `</tbody></table>`;
        
        document.getElementById('slots-container').innerHTML = slotsHtml || '<div class="empty-state"><p>Không có dữ liệu chỗ đỗ</p></div>';
        document.getElementById('buildings-tbody').innerHTML = tableHtml || '<tr><td colspan="5" class="text-center">Không có dữ liệu</td></tr>';

        // Render Chart
        if (window.ApexCharts) {
            const chartOptions = {
                series: [{
                    name: 'Tỷ lệ lấp đầy',
                    data: [35, 42, 38, 55, 48, 60, sum.occupancyRate] 
                }],
                chart: {
                    type: 'area',
                    height: 250,
                    toolbar: { show: false },
                    fontFamily: 'Inter, sans-serif'
                },
                colors: ['#f97316'], // Orange
                fill: {
                    type: 'gradient',
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.4,
                        opacityTo: 0.05,
                        stops: [0, 100]
                    }
                },
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 2 },
                xaxis: {
                    categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                    labels: { style: { colors: '#94a3b8' } }
                },
                yaxis: {
                    labels: { 
                        formatter: (value) => value.toFixed(0) + "%",
                        style: { colors: '#94a3b8' }
                    },
                    min: 0,
                    max: 100
                },
                grid: {
                    borderColor: '#f1f5f9',
                    strokeDashArray: 4,
                }
            };
            const chart = new ApexCharts(document.querySelector("#occupancyChart"), chartOptions);
            chart.render();
        }

        // Populate Vehicle Types in filter
        const typeSelect = document.getElementById('db-filter-type');
        if (typeSelect) {
            Api.getVehicleTypes().then(vtypesRes => {
                if(vtypesRes.success && vtypesRes.data) {
                    vtypesRes.data.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.typeName;
                        opt.textContent = t.typeName;
                        typeSelect.appendChild(opt);
                    });
                }
            });

            // Filter logic
            const statusFilter = document.getElementById('db-filter-status');
            const applyFilter = () => {
                const sVal = statusFilter.value;
                const tVal = typeSelect.value;
                document.querySelectorAll('.slot-row').forEach(row => {
                    const st = row.getAttribute('data-status');
                    const ty = row.getAttribute('data-type');
                    let show = true;
                    if (sVal && st !== sVal) show = false;
                    if (tVal && ty !== tVal) show = false;
                    row.style.display = show ? '' : 'none';
                });
            };
            statusFilter.addEventListener('change', applyFilter);
            typeSelect.addEventListener('change', applyFilter);
        }

        window.updateSlotStatus = async (id, status) => {
            if(!confirm(`Xác nhận chuyển trạng thái slot thành ${status}?`)) return;
            const r = await Api.updateSlotStatus(id, { status: status });
            if(r.success) {
                App.showToast('Cập nhật trạng thái slot thành công', 'success');
                App.renderPage('dashboard');
            } else {
                App.showToast(r.message || 'Lỗi cập nhật trạng thái', 'error');
            }
        };
    };