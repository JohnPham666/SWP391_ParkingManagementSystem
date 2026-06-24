import Api from '../api.js';

export async function renderDashboard(container) {
    const res = await Api.getDashboard();
    if (!res.success) {
        container.innerHTML = `<div class="empty-state"><p>${res.message}</p></div>`;
        return;
    }
    
    const data = res.data;
    const sum = data.summary;
    
    let html = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 9h22M9 21V9"/><rect x="1" y="3" width="22" height="18" rx="2"/></svg></div>
                <div class="stat-info">
                    <h3>${sum.totalCapacity}</h3>
                    <p>Tổng số chỗ (sức chứa)</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg></div>
                <div class="stat-info">
                    <h3>${sum.availableCapacity}</h3>
                    <p>Chỗ trống</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 16H9m10 0h3v-3.15a1 1 0 00-.84-.99L16 11l-2.7-3.6a1 1 0 00-.8-.4H5.24a2 2 0 00-1.8 1.1l-.8 1.63A6 6 0 002 12.42V16h2"/><circle cx="6.5" cy="16.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg></div>
                <div class="stat-info">
                    <h3>${sum.currentOccupancy}</h3>
                    <p>Đang đỗ</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></div>
                <div class="stat-info">
                    <h3>${sum.reservedSlots}</h3>
                    <p>Đã đặt</p>
                </div>
            </div>
        </div>

        <div class="card mb-4" style="margin-bottom: 24px;">
            <div class="card-header">
                <h3 class="card-title">Tỷ lệ lấp đầy: ${sum.occupancyRate.toFixed(1)}%</h3>
            </div>
            <div class="card-body">
                <div class="occupancy-bar">
                    <div class="occupancy-fill ${sum.occupancyRate < 50 ? 'low' : (sum.occupancyRate < 80 ? 'mid' : 'high')}" style="width: ${sum.occupancyRate}%"></div>
                </div>
                <div style="display:flex; justify-content:space-between; margin-top:8px; font-size:0.85rem; color:var(--text-secondary)">
                    <span>0%</span>
                    <span>Sức chứa: ${sum.currentOccupancy} / ${sum.totalCapacity}</span>
                    <span>100%</span>
                </div>
            </div>
        </div>
    `;

    if (data.buildings && data.buildings.length > 0) {
        data.buildings.forEach(b => {
            html += `<div class="card" style="margin-bottom: 24px;">
                <div class="card-header">
                    <h3 class="card-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"/></svg>${b.buildingName}</h3>
                    <div class="badge badge-blue">Đang đỗ: ${b.summary.currentOccupancy} / ${b.summary.totalCapacity}</div>
                </div>
                <div class="card-body">
            `;
            b.floors.forEach(f => {
                html += `<div style="margin-bottom: 20px;">
                    <h4 style="font-size: .95rem; font-weight: 600; margin-bottom: 12px; color: var(--text-secondary);">${f.floorName}</h4>
                `;
                f.zones.forEach(z => {
                    html += `<div style="margin-bottom: 16px; background: var(--bg-page); padding: 16px; border-radius: var(--radius-sm);">
                        <h5 style="font-size: .85rem; font-weight: 600; margin-bottom: 12px; display:flex; justify-content:space-between;">
                            <span>${z.zoneName} <span style="font-weight:400; color:var(--text-muted)">(${z.description})</span></span>
                            <span class="badge badge-gray">Đang đỗ: ${z.summary.currentOccupancy} / Sức chứa: ${z.summary.totalCapacity}</span>
                        </h5>
                        <div class="slot-grid">`;
                    
                    z.slots.forEach(s => {
                        let statusClass = s.status.toLowerCase();
                        html += `
                            <div class="slot-cell ${statusClass}" title="${s.vehicleTypeName}">
                                ${s.slotCode}
                                <small>${s.status}</small>
                            </div>
                        `;
                    });
                    html += `</div></div>`;
                });
                html += `</div>`;
            });
            html += `</div></div>`;
        });
    }

    container.innerHTML = html;
}
