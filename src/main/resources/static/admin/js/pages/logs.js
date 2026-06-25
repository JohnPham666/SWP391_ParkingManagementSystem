export async function renderLogs(container, App) {
    // Mock Logs data
    const mockLogs = [
        { time: new Date().toLocaleString('vi-VN'), type: 'SECURITY', msg: 'System Administrator logged in successfully', user: 'admin@parking.vn' },
        { time: new Date(Date.now() - 15*60000).toLocaleString('vi-VN'), type: 'INFO', msg: 'New ParkingStaff account created: Tuan NV', user: 'admin@parking.vn' },
        { time: new Date(Date.now() - 120*60000).toLocaleString('vi-VN'), type: 'WARNING', msg: 'Multiple failed login attempts detected', user: 'lan.manager@parking.vn' },
        { time: new Date(Date.now() - 200*60000).toLocaleString('vi-VN'), type: 'SYSTEM', msg: 'Database connection refreshed automatically', user: 'SYSTEM' },
        { time: new Date(Date.now() - 1440*60000).toLocaleString('vi-VN'), type: 'INFO', msg: 'System configurations updated', user: 'admin@parking.vn' }
    ];

    let html = `
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">System Monitoring & Logs</h3>
            </div>
            <div class="card-body no-pad table-wrapper">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Thời gian</th>
                            <th>Loại Event</th>
                            <th>Mô tả / Thao tác</th>
                            <th>User thực hiện</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${mockLogs.map(l => {
                            let badge = 'badge-gray';
                            if (l.type === 'SECURITY') badge = 'badge-blue';
                            else if (l.type === 'WARNING') badge = 'badge-yellow';
                            else if (l.type === 'INFO') badge = 'badge-green';
                            
                            return `
                                <tr>
                                    <td>${l.time}</td>
                                    <td><span class="badge ${badge}">${l.type}</span></td>
                                    <td>${l.msg}</td>
                                    <td>${l.user}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    container.innerHTML = html;
}
