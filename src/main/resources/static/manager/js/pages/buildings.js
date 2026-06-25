window.Pages = window.Pages || {};

Pages.renderBuildings = async function(container) {
    let state = {
        view: 'BUILDINGS', // BUILDINGS, FLOORS, ZONES, SLOTS
        buildings: [],
        floors: [],
        zones: [],
        slots: [],
        selectedBuilding: null,
        selectedFloor: null,
        selectedZone: null
    };

    const template = `
        <style>
            .breadcrumb { display: flex; gap: 8px; align-items: center; font-size: 0.95rem; color: var(--text-secondary); margin-top: 8px; }
            .breadcrumb-item { cursor: pointer; transition: color 0.2s; }
            .breadcrumb-item:hover { color: var(--primary-color); }
            .breadcrumb-item.active { color: var(--text-color); font-weight: 600; cursor: default; }
            .breadcrumb-separator { color: var(--text-muted); }
            
            .config-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; margin-top: 16px; }
            .config-card { 
                background: var(--bg-color); border: 1px solid var(--border-color); border-radius: 12px; padding: 16px; 
                cursor: pointer; transition: all 0.2s ease; display: flex; flex-direction: column; justify-content: space-between;
                position: relative; overflow: hidden;
            }
            .config-card:hover { transform: translateY(-4px); box-shadow: 0 8px 16px rgba(0,0,0,0.05); border-color: var(--primary-color); }
            .config-card h4 { margin: 0 0 8px 0; font-size: 1.1rem; color: var(--text-color); }
            .config-card p { margin: 0; font-size: 0.85rem; color: var(--text-secondary); }
            .config-card .icon { position: absolute; right: 16px; bottom: 16px; opacity: 0.1; color: var(--primary-color); }
            .config-card .actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }
            
            .slot-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 12px; margin-top: 16px; }
            .slot-card {
                border-radius: 8px; padding: 12px; text-align: center; border: 2px solid transparent;
                cursor: pointer; transition: all 0.2s; background: var(--bg-color); border-color: var(--border-color);
            }
            .slot-card:hover { transform: scale(1.05); }
            .slot-card.available { border-color: var(--green); background: rgba(16, 185, 129, 0.05); }
            .slot-card.occupied { border-color: var(--red); background: rgba(239, 68, 68, 0.05); }
            .slot-card.inactive { border-color: var(--text-muted); background: rgba(156, 163, 175, 0.1); opacity: 0.7; }
            .slot-card h5 { margin: 0 0 4px 0; font-size: 1.1rem; }
            .slot-card p { margin: 0; font-size: 0.75rem; color: var(--text-secondary); }
            
            .view-section { animation: fadeIn 0.3s ease; }
            @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        </style>
        
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">Cấu hình Bãi đỗ xe</h3>
                <div class="breadcrumb" id="config-breadcrumb"></div>
            </div>
            <div class="card-body" id="config-content" style="min-height: 400px;">
                <div class="loading-spinner"><div class="spinner"></div></div>
            </div>
        </div>

        <!-- Generic Modal -->
        <div id="config-modal" class="modal-overlay hidden">
            <div class="modal">
                <div class="modal-header">
                    <h3 id="modal-title">Thêm Mới</h3>
                    <button class="modal-close" onclick="document.getElementById('config-modal').classList.add('hidden')">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                </div>
                <form id="config-form">
                    <div class="modal-body form-grid" id="modal-form-content">
                        <!-- Dynamic fields -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline" onclick="document.getElementById('config-modal').classList.add('hidden')">Hủy</button>
                        <button type="submit" class="btn btn-primary">Lưu lại</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    container.innerHTML = template;

    const contentDiv = document.getElementById('config-content');
    const breadcrumbDiv = document.getElementById('config-breadcrumb');

    // Navigation
    window.goToBuildings = () => { state.view = 'BUILDINGS'; state.selectedBuilding = null; state.selectedFloor = null; state.selectedZone = null; render(); };
    window.goToFloors = (bId) => { state.view = 'FLOORS'; state.selectedFloor = null; state.selectedZone = null; if(bId) state.selectedBuilding = state.buildings.find(b=>b.buildingId===bId); render(); };
    window.goToZones = (fId) => { state.view = 'ZONES'; state.selectedZone = null; if(fId) state.selectedFloor = state.floors.find(f=>f.floorId===fId); render(); };
    window.goToSlots = (zId) => { state.view = 'SLOTS'; if(zId) state.selectedZone = state.zones.find(z=>z.zoneId===zId); render(); };

    async function loadData() {
        contentDiv.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
        if (state.view === 'BUILDINGS') {
            const res = await Api.getBuildings();
            if(res.success) state.buildings = res.data;
        } else if (state.view === 'FLOORS' && state.selectedBuilding) {
            const res = await Api.getFloors(state.selectedBuilding.buildingId);
            if(res.success) state.floors = res.data;
        } else if (state.view === 'ZONES' && state.selectedFloor) {
            const res = await Api.getZones(state.selectedFloor.floorId);
            if(res.success) state.zones = res.data;
        } else if (state.view === 'SLOTS' && state.selectedZone) {
            const res = await Api.getSlots(state.selectedZone.zoneId);
            if(res.success) state.slots = res.data;
        }
    }

    function renderBreadcrumb() {
        let bc = `<span class="breadcrumb-item ${state.view==='BUILDINGS'?'active':''}" onclick="window.goToBuildings()">Danh sách Tòa nhà</span>`;
        let backBtn = '';

        if (state.selectedBuilding) {
            bc += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item ${state.view==='FLOORS'?'active':''}" onclick="window.goToFloors(${state.selectedBuilding.buildingId})">${state.selectedBuilding.buildingName}</span>`;
            if (state.view === 'FLOORS') backBtn = `<button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; margin-right: 12px;" onclick="window.goToBuildings()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Quay lại</button>`;
        }
        if (state.selectedFloor) {
            bc += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item ${state.view==='ZONES'?'active':''}" onclick="window.goToZones(${state.selectedFloor.floorId})">${state.selectedFloor.floorName}</span>`;
            if (state.view === 'ZONES') backBtn = `<button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; margin-right: 12px;" onclick="window.goToFloors(${state.selectedBuilding.buildingId})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Quay lại</button>`;
        }
        if (state.selectedZone) {
            bc += `<span class="breadcrumb-separator">/</span><span class="breadcrumb-item ${state.view==='SLOTS'?'active':''}" onclick="window.goToSlots(${state.selectedZone.zoneId})">${state.selectedZone.zoneName}</span>`;
            if (state.view === 'SLOTS') backBtn = `<button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem; margin-right: 12px;" onclick="window.goToZones(${state.selectedFloor.floorId})"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 4px;"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> Quay lại</button>`;
        }
        breadcrumbDiv.innerHTML = backBtn + bc;
    }

    function renderBuildingsView() {
        let html = `<div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: flex-end;"><button class="btn btn-primary" onclick="window.openModal('BUILDING')">+ Thêm Tòa nhà</button></div>`;
        if (state.buildings.length === 0) {
            html += `<div class="empty-state"><p>Chưa có tòa nhà nào</p></div>`;
        } else {
            html += `<div class="config-grid view-section">`;
            state.buildings.forEach(b => {
                html += `
                <div class="config-card" onclick="window.goToFloors(${b.buildingId})">
                    <div>
                        <h4>${b.buildingName}</h4>
                        <p>Địa chỉ: ${b.address || '-'}</p>
                        <p>Giờ HĐ: ${b.operatingStartTime ? b.operatingStartTime.substring(0,5) : '-'} đến ${b.operatingEndTime ? b.operatingEndTime.substring(0,5) : '-'}</p>
                    </div>
                    <svg class="icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21h18M5 21V7l8-4v18M13 3l8 4v14M7 11h2M7 15h2M15 11h2M15 15h2"/></svg>
                    <div class="actions">
                        <button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem;" onclick="event.stopPropagation(); window.openModal('BUILDING', ${b.buildingId})">Sửa</button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }
        contentDiv.innerHTML = html;
    }

    function renderFloorsView() {
        let html = `<div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: flex-end;"><button class="btn btn-primary" onclick="window.openModal('FLOOR')">+ Thêm Tầng</button></div>`;
        if (state.floors.length === 0) {
            html += `<div class="empty-state"><p>Chưa có tầng nào trong tòa nhà này</p></div>`;
        } else {
            html += `<div class="config-grid view-section">`;
            state.floors.sort((a,b)=>a.floorNumber - b.floorNumber).forEach(f => {
                html += `
                <div class="config-card" onclick="window.goToZones(${f.floorId})">
                    <div>
                        <h4>${f.floorName}</h4>
                        <p>Tầng số: ${f.floorNumber}</p>
                    </div>
                    <svg class="icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
                    <div class="actions">
                        <button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem;" onclick="event.stopPropagation(); window.openModal('FLOOR', ${f.floorId})">Sửa</button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }
        contentDiv.innerHTML = html;
    }

    function renderZonesView() {
        let html = `<div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: flex-end;"><button class="btn btn-primary" onclick="window.openModal('ZONE')">+ Thêm Khu vực</button></div>`;
        if (state.zones.length === 0) {
            html += `<div class="empty-state"><p>Chưa có khu vực nào ở tầng này</p></div>`;
        } else {
            html += `<div class="config-grid view-section">`;
            state.zones.forEach(z => {
                html += `
                <div class="config-card" onclick="window.goToSlots(${z.zoneId})">
                    <div>
                        <h4>${z.zoneName}</h4>
                        <p>Mô tả: ${z.description || '-'}</p>
                    </div>
                    <svg class="icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM2 12h20M12 2v20"/></svg>
                    <div class="actions">
                        <button class="btn btn-outline" style="padding: 4px 12px; font-size: 0.8rem;" onclick="event.stopPropagation(); window.openModal('ZONE', ${z.zoneId})">Sửa</button>
                    </div>
                </div>`;
            });
            html += `</div>`;
        }
        contentDiv.innerHTML = html;
    }

    function renderSlotsView() {
        let html = `<div class="toolbar" style="margin-bottom: 16px; display: flex; justify-content: flex-end;"><button class="btn btn-primary" onclick="window.openModal('SLOT')">+ Thêm Chỗ Đỗ</button></div>`;
        if (state.slots.length === 0) {
            html += `<div class="empty-state"><p>Chưa có chỗ đỗ nào ở khu vực này</p></div>`;
        } else {
            html += `<div class="slot-grid view-section">`;
            state.slots.sort((a,b) => a.slotCode.localeCompare(b.slotCode)).forEach(s => {
                let statusClass = s.isActive ? (s.status === 'AVAILABLE' ? 'available' : 'occupied') : 'inactive';
                let statusText = !s.isActive ? 'Bảo trì' : (s.status === 'AVAILABLE' ? 'Trống' : 'Có xe');
                html += `
                <div class="slot-card ${statusClass}" onclick="window.openModal('SLOT', ${s.slotId})">
                    <h5>${s.slotCode}</h5>
                    <p>${statusText}</p>
                    <p style="font-size: 0.7rem; margin-top:4px;">${s.vehicleTypeName || ''}</p>
                </div>`;
            });
            html += `</div>`;
        }
        contentDiv.innerHTML = html;
    }

    async function render() {
        renderBreadcrumb();
        await loadData();
        if (state.view === 'BUILDINGS') renderBuildingsView();
        else if (state.view === 'FLOORS') renderFloorsView();
        else if (state.view === 'ZONES') renderZonesView();
        else if (state.view === 'SLOTS') renderSlotsView();
    }

    // Modal Logic
    let currentModalType = '';
    let currentEditId = null;

    window.openModal = async (type, id = null) => {
        currentModalType = type;
        currentEditId = id;
        const modal = document.getElementById('config-modal');
        const title = document.getElementById('modal-title');
        const formContent = document.getElementById('modal-form-content');
        
        title.textContent = (id ? 'Sửa ' : 'Thêm ') + (type === 'BUILDING' ? 'Tòa nhà' : type === 'FLOOR' ? 'Tầng' : type === 'ZONE' ? 'Khu vực' : 'Chỗ đỗ');
        
        let html = '';
        if (type === 'BUILDING') {
            let b = id ? state.buildings.find(x=>x.buildingId===id) : {};
            html = `
                <div class="form-group full-width"><label>Tên tòa nhà</label><input type="text" id="m-name" required value="${b.buildingName||''}"></div>
                <div class="form-group full-width"><label>Địa chỉ</label><input type="text" id="m-address" value="${b.address||''}"></div>
                <div class="form-group"><label>Giờ mở cửa (HH:MM)</label><input type="time" id="m-start" value="${b.operatingStartTime?b.operatingStartTime.substring(0,5):''}"></div>
                <div class="form-group"><label>Giờ đóng cửa (HH:MM)</label><input type="time" id="m-end" value="${b.operatingEndTime?b.operatingEndTime.substring(0,5):''}"></div>
                <div class="form-group"><label>Tổng số tầng</label><input type="number" id="m-floors" value="${b.totalFloors||1}"></div>
            `;
        } else if (type === 'FLOOR') {
            let f = id ? state.floors.find(x=>x.floorId===id) : {};
            html = `
                <div class="form-group full-width"><label>Tên tầng</label><input type="text" id="m-name" required value="${f.floorName||''}"></div>
                <div class="form-group full-width"><label>Số thứ tự tầng</label><input type="number" id="m-num" required value="${f.floorNumber||0}"></div>
            `;
        } else if (type === 'ZONE') {
            let z = id ? state.zones.find(x=>x.zoneId===id) : {};
            html = `
                <div class="form-group full-width"><label>Tên khu vực</label><input type="text" id="m-name" required value="${z.zoneName||''}"></div>
                <div class="form-group full-width"><label>Mô tả</label><input type="text" id="m-desc" value="${z.description||''}"></div>
            `;
        } else if (type === 'SLOT') {
            let s = id ? state.slots.find(x=>x.slotId===id) : {};
            // Need vehicle types
            const vtRes = await Api.getVehicleTypes();
            let vTypes = vtRes.success ? vtRes.data : [];
            html = `
                <div class="form-group"><label>Mã chỗ đỗ</label><input type="text" id="m-code" required value="${s.slotCode||''}"></div>
                <div class="form-group"><label>Loại xe</label>
                    <select id="m-type" required>
                        ${vTypes.map(t=>`<option value="${t.vehicleTypeId}" ${s.vehicleTypeId===t.vehicleTypeId?'selected':''}>${t.typeName}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Kích hoạt</label>
                    <select id="m-active">
                        <option value="true" ${s.isActive!==false?'selected':''}>Có</option>
                        <option value="false" ${s.isActive===false?'selected':''}>Không</option>
                    </select>
                </div>
                <div class="form-group"><label>Diện tích (m2)</label><input type="number" step="0.1" id="m-area" value="${s.area||''}"></div>
            `;
        }
        
        formContent.innerHTML = html;
        modal.classList.remove('hidden');
    };

    document.getElementById('config-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = currentModalType;
        const id = currentEditId;
        let payload = {};
        let r;
        
        if (type === 'BUILDING') {
            payload = {
                buildingName: document.getElementById('m-name').value,
                address: document.getElementById('m-address').value,
                operatingStartTime: document.getElementById('m-start').value ? document.getElementById('m-start').value + ':00' : null,
                operatingEndTime: document.getElementById('m-end').value ? document.getElementById('m-end').value + ':00' : null,
                totalFloors: parseInt(document.getElementById('m-floors').value) || 1
            };
            r = id ? await Api.updateBuilding(id, payload) : await Api.createBuilding(payload);
        } else if (type === 'FLOOR') {
            payload = {
                buildingId: state.selectedBuilding.buildingId,
                floorName: document.getElementById('m-name').value,
                floorNumber: parseInt(document.getElementById('m-num').value)
            };
            r = id ? await Api.updateFloor(id, payload) : await Api.createFloor(payload);
        } else if (type === 'ZONE') {
            payload = {
                floorId: state.selectedFloor.floorId,
                zoneName: document.getElementById('m-name').value,
                description: document.getElementById('m-desc').value
            };
            r = id ? await Api.updateZone(id, payload) : await Api.createZone(payload);
        } else if (type === 'SLOT') {
            payload = {
                zoneId: state.selectedZone.zoneId,
                slotCode: document.getElementById('m-code').value,
                vehicleTypeId: parseInt(document.getElementById('m-type').value),
                isActive: document.getElementById('m-active').value === 'true',
                area: parseFloat(document.getElementById('m-area').value) || null,
                capacity: 1
            };
            r = id ? await Api.updateSlot(id, payload) : await Api.createSlot(payload);
        }

        if (r && r.success) {
            App.showToast('Lưu thành công', 'success');
            document.getElementById('config-modal').classList.add('hidden');
            render(); // Reload current view
        } else {
            App.showToast(r ? r.message : 'Lỗi không xác định', 'error');
        }
    });

    // Start
    render();
};