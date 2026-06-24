export async function renderDashboard(container, App) {
    let html = `
        <div class="stats-grid">
            <div class="stat-card" style="cursor: pointer;" onclick="App.navigate('users')">
                <div class="stat-icon blue"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg></div>
                <div class="stat-info">
                    <h3>Quản trị User</h3>
                    <p>Thêm Staff, Manager</p>
                </div>
            </div>
            <div class="stat-card" style="cursor: pointer;" onclick="App.navigate('settings')">
                <div class="stat-icon green"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg></div>
                <div class="stat-info">
                    <h3>Bảo mật</h3>
                    <p>Phân quyền truy cập</p>
                </div>
            </div>
            <div class="stat-card" style="cursor: pointer;" onclick="App.navigate('logs')">
                <div class="stat-icon yellow"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg></div>
                <div class="stat-info">
                    <h3>Hệ thống Logs</h3>
                    <p>Theo dõi hoạt động</p>
                </div>
            </div>
        </div>
        
        <div class="card mt-4">
            <div class="card-header">
                <h3 class="card-title">Welcome to Admin Dashboard</h3>
            </div>
            <div class="card-body">
                <p>Chào mừng System Administrator. Tại đây bạn có thể quản lý tài khoản nhân viên (Staff), quản lý cấp cao (Manager), cũng như xem cấu hình và log của hệ thống.</p>
            </div>
        </div>
    `;
    container.innerHTML = html;
}
