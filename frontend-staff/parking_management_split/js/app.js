// ====== DATA & STATE ======
let allRecords = [];
let currentCheckoutRecord = null;

// Slot structure
const FLOORS = [
  { floor: 1, name: 'Tầng 1 - Xe Máy', type: 'motorbike', zones: 10, slotsPerZone: 5, capacityPerSlot: 10, area: '2,000 m²', zoneArea: '200 m²', slotArea: '40 m²' },
  { floor: 2, name: 'Tầng 2 - Xe Hơi', type: 'car', zones: 10, slotsPerZone: 3, capacityPerSlot: 4, area: '3,000 m²', zoneArea: '300 m²', slotArea: '100 m²' },
  { floor: 3, name: 'Tầng 3 - Xe Tải', type: 'truck', zones: 10, slotsPerZone: 3, capacityPerSlot: 2, area: '4,000 m²', zoneArea: '400 m²', slotArea: '200 m²' }
];

function generateSlots() {
  const slots = [];
  FLOORS.forEach(f => {
    // Tầng 1 = A1-A10 (Xe máy), Tầng 2 = B1-B10 (Xe hơi), Tầng 3 = C1-C10 (Xe tải)
    const floorPrefix = f.floor === 1 ? 'A' : f.floor === 2 ? 'B' : 'C';
    for (let z = 1; z <= f.zones; z++) {
      const zoneName = `${floorPrefix}${z}`;
      for (let s = 1; s <= f.slotsPerZone; s++) {
        const slotNum = String(s).padStart(3, '0');
        slots.push({
          id: `${zoneName}-${slotNum}`,  // A1-001, A1-002... A10-001... B1-001, C1-001
          zone: zoneName,
          floor: f.floor,
          type: f.type,
          capacity: f.capacityPerSlot,
          occupied: 0,
          zoneArea: f.zoneArea,
          slotArea: f.slotArea
        });
      }
    }
  });
  return slots;
}

let parkingSlots = generateSlots();

// Cards
const CARDS = [];
for (let i = 1; i <= 50; i++) {
  CARDS.push({ id: `HL-${String(i).padStart(4,'0')}`, type: 'hourly', status: 'available', plate: '' });
}
for (let i = 1; i <= 30; i++) {
  CARDS.push({ id: `MT-${String(i).padStart(4,'0')}`, type: 'monthly', status: 'available', plate: '' });
}

// Gates
const GATES = [];
for (let i = 1; i <= 16; i++) {
  GATES.push({ id: `G${String(i).padStart(2,'0')}`, name: `Cổng ${i}`, status: i <= 8 ? 'entry' : 'exit', active: true });
}

// Pricing (progressive)
const PRICING = {
  motorbike: { first2h: 5000, per_hour: 3000, max_day: 30000 },
  car: { first2h: 20000, per_hour: 10000, max_day: 150000 },
  truck: { first2h: 30000, per_hour: 15000, max_day: 200000 }
};

function calcFee(type, checkInTime) {
  const hours = Math.max(1, Math.ceil((Date.now() - new Date(checkInTime).getTime()) / 3600000));
  const p = PRICING[type];
  if (hours <= 2) return p.first2h;
  return Math.min(p.first2h + (hours - 2) * p.per_hour, p.max_day);
}

// ====== UI HELPERS ======
function switchTab(tab) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('tab-active'); b.classList.add('text-gray-500'); });
  document.getElementById(`panel-${tab}`).classList.remove('hidden');
  const btn = document.getElementById(`tab-${tab}`);
  btn.classList.add('tab-active');
  btn.classList.remove('text-gray-500');
  if (tab === 'slots') renderSlots();
  if (tab === 'cards') renderCards();
  if (tab === 'gates') renderGates();
  if (tab === 'stats') renderStats();
  if (tab === 'monthly') renderMonthly();
  if (tab === 'hourly') renderHourly();
}

function showToast(msg, type='success') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${type==='success'?'bg-green-600':type==='error'?'bg-red-600':'bg-primary'}`;
  t.textContent = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

function formatCurrency(n) { return new Intl.NumberFormat('vi-VN').format(n) + 'đ'; }
function formatTime(iso) { return new Date(iso).toLocaleString('vi-VN'); }

// ====== DATA SDK ======
const dataHandler = {
  onDataChanged(data) {
    allRecords = data;
    // Update slot occupancy
    parkingSlots.forEach(s => s.occupied = 0);
    allRecords.filter(r => r.status === 'parked').forEach(r => {
      const slot = parkingSlots.find(s => s.id === r.slot);
      if (slot) slot.occupied++;
    });
    // Update cards
    CARDS.forEach(c => { c.status = 'available'; c.plate = ''; });
    allRecords.filter(r => r.status === 'parked').forEach(r => {
      const card = CARDS.find(c => c.id === r.card_id);
      if (card) { card.status = 'in_use'; card.plate = r.plate_number; }
    });
    // Refresh active panel
    const activePanel = document.querySelector('.tab-panel:not(.hidden)');
    if (activePanel) {
      const id = activePanel.id.replace('panel-','');
      if (id === 'slots') renderSlots();
      if (id === 'stats') renderStats();
      if (id === 'hourly') renderHourly();
      if (id === 'monthly') renderMonthly();
      if (id === 'cards') renderCards();
    }
    updateGateSelect();
    updateSlotSelect();
  }
};

async function initApp() {
  const r = await window.dataSdk.init(dataHandler);
  if (!r.isOk) showToast('Lỗi kết nối dữ liệu', 'error');
  
  renderGates();
  updateGateSelect();
  updateSlotSelect();
}
initApp();

function updateGateSelect() {
  const sel = document.getElementById('ci-gate');
  sel.innerHTML = '<option value="">Chọn cổng</option>' + GATES.filter(g => g.status === 'entry').map(g => `<option value="${g.id}">${g.name}</option>`).join('');
}

function updateSlotSelect() {
  const type = document.getElementById('ci-vehicle').value;
  const available = parkingSlots.filter(s => s.type === type && s.occupied < s.capacity);
  const sel = document.getElementById('ci-slot');
  sel.innerHTML = '<option value="">Tự động phân bổ</option>' + available.map(s => `<option value="${s.id}">${s.id} (${s.capacity - s.occupied} chỗ trống)</option>`).join('');
}

document.getElementById('ci-vehicle').addEventListener('change', updateSlotSelect);

// ====== CHECK IN ======
async function handleCheckIn() {
  const gate = document.getElementById('ci-gate').value;
  const vehicle = document.getElementById('ci-vehicle').value;
  const plate = document.getElementById('ci-plate').value.trim().toUpperCase();
  const ticket = document.getElementById('ci-ticket').value;
  const card = document.getElementById('ci-card').value.trim();
  let slot = document.getElementById('ci-slot').value;

  if (!plate || !card || !gate) { showToast('Vui lòng nhập đầy đủ thông tin', 'error'); return; }
  if (allRecords.length >= 999) { showToast('Đã đạt giới hạn 999 bản ghi!', 'error'); return; }

  // Auto assign slot
  if (!slot) {
    const avail = parkingSlots.find(s => s.type === vehicle && s.occupied < s.capacity);
    if (!avail) { showToast('Không còn slot trống cho loại xe này!', 'error'); return; }
    slot = avail.id;
  }

  const slotObj = parkingSlots.find(s => s.id === slot);
  if (slotObj && slotObj.occupied >= slotObj.capacity) { showToast('Slot đã đầy!', 'error'); return; }

  const record = {
    type: 'session',
    plate_number: plate,
    card_id: card,
    card_type: ticket,
    zone: slot.split('-')[0],
    slot: slot,
    floor: slotObj ? slotObj.floor : 1,
    vehicle_type: vehicle,
    check_in_time: new Date().toISOString(),
    check_out_time: '',
    status: 'parked',
    payment_method: '',
    payment_status: 'pending',
    amount: 0,
    gate: gate,
    monthly_due_date: '',
    monthly_paid: false
  };

  const btn = document.querySelector('#panel-checkin button');
  btn.disabled = true; btn.textContent = 'Đang xử lý...';
  const res = await window.dataSdk.create(record);
  btn.disabled = false; btn.innerHTML = '<i data-lucide="check-circle" class="w-5 h-5 inline mr-2"></i>Xác Nhận Check In';
  lucide.createIcons();

  if (res.isOk) {
    showToast(`Check in thành công: ${plate} → ${slot}`);
    clearCheckIn();
  } else {
    showToast('Lỗi khi check in', 'error');
  }
}

function clearCheckIn() {
  document.getElementById('ci-plate').value = '';
  document.getElementById('ci-card').value = '';
  document.getElementById('ci-slot').value = '';
}

// ====== CHECK OUT ======
function handleSearchCheckout() {
  const plate = document.getElementById('co-plate').value.trim().toUpperCase();
  const card = document.getElementById('co-card').value.trim();
  
  const record = allRecords.find(r => r.status === 'parked' && 
    (r.plate_number === plate || r.card_id === card));
  
  if (!record) { showToast('Không tìm thấy xe', 'error'); return; }
  
  // Verify match
  if (plate && card && (record.plate_number !== plate || record.card_id !== card)) {
    showToast('Biển số và thẻ không khớp!', 'error'); return;
  }

  currentCheckoutRecord = record;
  const fee = record.card_type === 'monthly' ? 0 : calcFee(record.vehicle_type, record.check_in_time);
  
  document.getElementById('checkout-info').classList.remove('hidden');
  document.getElementById('checkout-details').innerHTML = `
    <p><span class="text-gray-500">Biển số:</span> <strong>${record.plate_number}</strong></p>
    <p><span class="text-gray-500">Loại xe:</span> <strong>${record.vehicle_type === 'motorbike' ? 'Xe Máy' : record.vehicle_type === 'car' ? 'Xe Hơi' : 'Xe Tải'}</strong></p>
    <p><span class="text-gray-500">Giờ vào:</span> <strong>${formatTime(record.check_in_time)}</strong></p>
    <p><span class="text-gray-500">Slot:</span> <strong>${record.slot}</strong></p>
    <p><span class="text-gray-500">Thẻ:</span> <strong>${record.card_id}</strong></p>
    <p><span class="text-gray-500">Loại vé:</span> <strong>${record.card_type === 'monthly' ? 'Vé Tháng' : 'Vé Lượt'}</strong></p>
  `;
  document.getElementById('co-amount').textContent = record.card_type === 'monthly' ? 'Miễn phí (Vé tháng)' : formatCurrency(fee);
}

function handlePayment(method) {
  if (!currentCheckoutRecord) return;
  const fee = currentCheckoutRecord.card_type === 'monthly' ? 0 : calcFee(currentCheckoutRecord.vehicle_type, currentCheckoutRecord.check_in_time);
  
  const modal = document.getElementById('payment-modal');
  const content = document.getElementById('payment-modal-content');
  
  if (currentCheckoutRecord.card_type === 'monthly' || fee === 0) {
    completeCheckout('monthly', 0);
    return;
  }

  if (method === 'cash') {
    content.innerHTML = `
      <div class="text-center">
        <div class="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="banknote" class="w-10 h-10 text-green-600"></i>
        </div>
        <h3 class="text-2xl font-bold text-dark mb-2">Thanh Toán Tiền Mặt</h3>
        <p class="text-4xl font-bold text-primary mb-1">${formatCurrency(fee)}</p>
        <p class="text-sm text-gray-500 mb-6">Xe: <strong>${currentCheckoutRecord.plate_number}</strong></p>
        
        <div class="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
          <p class="text-sm text-gray-600">Nhân viên cần xác nhận với khách hàng đã thanh toán đủ tiền mặt</p>
        </div>
        
        <div class="flex gap-3">
          <button onclick="completeCheckout('cash', ${fee})" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-lg transition-all">
            <i data-lucide="check-circle" class="w-5 h-5 inline mr-2"></i>Xác Nhận Đã Nhận Tiền
          </button>
          <button onclick="closePaymentModal()" class="flex-1 border-2 border-gray-300 py-4 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all">Hủy</button>
        </div>
      </div>
    `;
  } else {
    // Generate a simple but recognizable QR code-like pattern
    const qrPattern = generateQRPattern(currentCheckoutRecord.card_id, fee);
    content.innerHTML = `
      <div class="text-center">
        <div class="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <i data-lucide="smartphone" class="w-10 h-10 text-blue-600"></i>
        </div>
        <h3 class="text-2xl font-bold text-dark mb-2">Chuyển Khoản</h3>
        <p class="text-4xl font-bold text-primary mb-1">${formatCurrency(fee)}</p>
        <p class="text-sm text-gray-500 mb-6">Xe: <strong>${currentCheckoutRecord.plate_number}</strong></p>
        
        <div class="bg-white rounded-xl p-6 mb-4 border-2 border-gray-200">
          <p class="text-xs font-bold text-gray-600 mb-3">MÃ QR - Quét để thanh toán</p>
          ${qrPattern}
          <p class="text-xs text-gray-500 mt-4">STK: 1234567890</p>
          <p class="text-xs text-gray-500">Ngân hàng Vietcombank</p>
          <p class="text-xs font-semibold text-gray-600 mt-2">Nội dung: ${currentCheckoutRecord.plate_number}</p>
        </div>
        
        <div class="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
          <p id="qr-status" class="text-sm text-blue-700">⏳ Đang chờ thanh toán...</p>
        </div>
        
        <div class="flex gap-3">
          <button onclick="simulateTransfer(${fee})" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-lg transition-all">
            <i data-lucide="check-circle" class="w-5 h-5 inline mr-2"></i>Xác Nhận Đã Nhận
          </button>
          <button onclick="closePaymentModal()" class="flex-1 border-2 border-gray-300 py-4 rounded-xl text-gray-600 hover:bg-gray-50 font-semibold transition-all">Hủy</button>
        </div>
      </div>
    `;
  }
  modal.classList.remove('hidden');
  lucide.createIcons();
}

function generateQRPattern(cardId, amount) {
  // Generate a decorative QR-like pattern
  let pattern = '<div class="inline-block">';
  for (let i = 0; i < 21; i++) {
    pattern += '<div class="flex gap-0.5">';
    for (let j = 0; j < 21; j++) {
      // Create a pseudo-random pattern based on data
      const hash = (cardId.charCodeAt(i % cardId.length) * (j + 1) + amount) % 2;
      const isBlack = (i < 3 || i > 17 || j < 3 || j > 17) ? (i % 2 === j % 2) : hash === 0;
      pattern += `<div class="w-3 h-3 ${isBlack ? 'bg-black' : 'bg-white'} border border-gray-300"></div>`;
    }
    pattern += '</div>';
  }
  pattern += '</div>';
  return pattern;
}

function simulateTransfer(fee) {
  document.getElementById('qr-status').innerHTML = '<span class="text-green-600 font-semibold">✓ Đã nhận tiền thành công!</span>';
  setTimeout(() => completeCheckout('transfer', fee), 1000);
}

async function completeCheckout(method, fee) {
  if (!currentCheckoutRecord) return;
  const updated = { ...currentCheckoutRecord, status: 'completed', check_out_time: new Date().toISOString(), payment_method: method, payment_status: 'paid', amount: fee };
  const res = await window.dataSdk.update(updated);
  if (res.isOk) {
    showToast('Check out thành công!');
    closePaymentModal();
    document.getElementById('checkout-info').classList.add('hidden');
    document.getElementById('co-plate').value = '';
    document.getElementById('co-card').value = '';
    currentCheckoutRecord = null;
  } else {
    showToast('Lỗi khi check out', 'error');
  }
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
}

// Zone color mapping by floor and vehicle type
function getZoneColor(type) {
  if (type === 'motorbike') return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' };
  if (type === 'car') return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
  if (type === 'truck') return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' };
  return { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-700' };
}

// Vehicle type color mapping
function getVehicleColor(type) {
  if (type === 'motorbike') return { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' };
  if (type === 'car') return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' };
  if (type === 'truck') return { bg: 'bg-red-100', text: 'text-red-700', badge: 'bg-red-100 text-red-700' };
  return { bg: 'bg-gray-100', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' };
}

function getVehicleLabel(type) {
  if (type === 'motorbike') return 'Xe Máy';
  if (type === 'car') return 'Xe Hơi';
  if (type === 'truck') return 'Xe Tải';
  return type;
}

// ====== SLOTS ======
function renderSlots() {
  const floorFilter = document.getElementById('slot-floor-filter').value;
  const availFilter = document.getElementById('slot-avail-filter').value;
  
  const grid = document.getElementById('slots-grid');
  grid.innerHTML = '';
  
  if (floorFilter === 'all') {
    FLOORS.forEach(f => {
      let floorSlots = parkingSlots.filter(s => s.floor === f.floor);
      if (availFilter === 'available') floorSlots = floorSlots.filter(s => s.occupied < s.capacity);
      if (availFilter === 'full') floorSlots = floorSlots.filter(s => s.occupied >= s.capacity);
      
      // Group by zone, ensuring proper numeric ordering
      const zoneGroups = {};
      floorSlots.forEach(s => {
        if (!zoneGroups[s.zone]) zoneGroups[s.zone] = [];
        zoneGroups[s.zone].push(s);
      });

      // Sort zones properly (A1, A2, A3... A10, not A1, A10, A2...)
      const sortedZones = Object.keys(zoneGroups).sort((a, b) => {
        const prefixA = a.charAt(0);
        const prefixB = b.charAt(0);
        if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
        return parseInt(a.slice(1)) - parseInt(b.slice(1));
      });

      const section = document.createElement('div');
      section.className = 'col-span-full';
      section.innerHTML = `<h3 class="text-lg font-bold text-dark mb-4 flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-primary"></span>
        ${f.name}
      </h3>`;
      
      const zonesContainer = document.createElement('div');
      zonesContainer.className = 'space-y-4';
      
      // Render 2 zones per row
      for (let i = 0; i < sortedZones.length; i += 2) {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
        
        for (let j = 0; j < 2 && i + j < sortedZones.length; j++) {
          const zoneName = sortedZones[i + j];
          const slots = zoneGroups[zoneName];
          const colors = getZoneColor(f.type);
          
          const zoneDiv = document.createElement('div');
          zoneDiv.className = `${colors.bg} border-2 ${colors.border} rounded-lg p-4`;
          
          // Zone title with name
          let zoneHTML = `<p class="text-sm font-bold ${colors.text} mb-3">Zone ${zoneName}</p>`;
          zoneHTML += '<div class="grid grid-cols-5 gap-2">';
          
          slots.forEach(s => {
            const pct = (s.occupied / s.capacity) * 100;
            let statusColor, textColor;
            if (pct >= 100) {
              // Full slots: darkest color per vehicle type
              if (f.type === 'motorbike') statusColor = 'border-orange-600 bg-orange-600 text-white';
              else if (f.type === 'car') statusColor = 'border-gray-800 bg-gray-800 text-white';
              else if (f.type === 'truck') statusColor = 'border-red-700 bg-red-700 text-white';
            } else if (pct >= 75) {
              statusColor = 'border-yellow-500 bg-yellow-100 text-yellow-700';
            } else {
              statusColor = 'border-gray-400 bg-white text-gray-700';
            }
            const slotNumber = s.id.split('-')[1];
            
            zoneHTML += `<div class="border-2 ${statusColor} rounded-lg p-2 text-center cursor-pointer hover:shadow-md transition-all" onclick="openSlotDetail('${s.id}')">
              <p class="text-xs font-bold">${zoneName}-${slotNumber}</p>
              <p class="text-xs font-semibold">${s.occupied}/${s.capacity}</p>
            </div>`;
          });
          
          zoneHTML += '</div>';
          zoneDiv.innerHTML = zoneHTML;
          rowDiv.appendChild(zoneDiv);
        }
        
        zonesContainer.appendChild(rowDiv);
      }
      
      section.appendChild(zonesContainer);
      grid.appendChild(section);
    });
  } else {
    const floor = FLOORS.find(f => f.floor === parseInt(floorFilter));
    let floorSlots = parkingSlots.filter(s => s.floor === parseInt(floorFilter));
    if (availFilter === 'available') floorSlots = floorSlots.filter(s => s.occupied < s.capacity);
    if (availFilter === 'full') floorSlots = floorSlots.filter(s => s.occupied >= s.capacity);

    // Group by zone
    const zoneGroups = {};
    floorSlots.forEach(s => {
      if (!zoneGroups[s.zone]) zoneGroups[s.zone] = [];
      zoneGroups[s.zone].push(s);
    });

    // Sort zones properly
    const sortedZones = Object.keys(zoneGroups).sort((a, b) => {
      const prefixA = a.charAt(0);
      const prefixB = b.charAt(0);
      if (prefixA !== prefixB) return prefixA.localeCompare(prefixB);
      return parseInt(a.slice(1)) - parseInt(b.slice(1));
    });

    const section = document.createElement('div');
    section.className = 'col-span-full';
    section.innerHTML = `<h3 class="text-lg font-bold text-dark mb-4">${floor.name}</h3>`;
    
    const zonesContainer = document.createElement('div');
    zonesContainer.className = 'space-y-4';
    
    // Render 2 zones per row
    for (let i = 0; i < sortedZones.length; i += 2) {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';
      
      for (let j = 0; j < 2 && i + j < sortedZones.length; j++) {
        const zoneName = sortedZones[i + j];
        const slots = zoneGroups[zoneName];
        const colors = getZoneColor(floor.type);
        
        const zoneDiv = document.createElement('div');
        zoneDiv.className = `${colors.bg} border-2 ${colors.border} rounded-lg p-4`;
        
        // Zone title with name
        let zoneHTML = `<p class="text-sm font-bold ${colors.text} mb-3">📍 ${zoneName}</p>`;
        zoneHTML += '<div class="grid grid-cols-5 gap-2">';
        
        slots.forEach(s => {
          const pct = (s.occupied / s.capacity) * 100;
          let statusColor;
          if (pct >= 100) {
            // Full slots: darkest color per vehicle type
            if (floor.type === 'motorbike') statusColor = 'border-orange-600 bg-orange-600 text-white';
            else if (floor.type === 'car') statusColor = 'border-gray-800 bg-gray-800 text-white';
            else if (floor.type === 'truck') statusColor = 'border-red-700 bg-red-700 text-white';
          } else if (pct >= 75) {
            statusColor = 'border-yellow-500 bg-yellow-100 text-yellow-700';
          } else {
            statusColor = 'border-gray-400 bg-white text-gray-700';
          }
          const slotNumber = s.id.split('-')[1];
          
          zoneHTML += `<div class="border-2 ${statusColor} rounded-lg p-2 text-center cursor-pointer hover:shadow-md transition-all" onclick="openSlotDetail('${s.id}')">
            <p class="text-xs font-bold">${zoneName}-${slotNumber}</p>
            <p class="text-xs font-semibold">${s.occupied}/${s.capacity}</p>
          </div>`;
        });
        
        zoneHTML += '</div>';
        zoneDiv.innerHTML = zoneHTML;
        rowDiv.appendChild(zoneDiv);
      }
      
      zonesContainer.appendChild(rowDiv);
    }
    
    section.appendChild(zonesContainer);
    grid.appendChild(section);
  }
}

function openSlotDetail(slotId) {
  const slot = parkingSlots.find(s => s.id === slotId);
  if (!slot) return;
  const vehicles = allRecords.filter(r => r.status === 'parked' && r.slot === slotId);
  const modal = document.getElementById('slot-modal');
  const content = document.getElementById('slot-modal-content');
  
  content.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-xl font-bold text-dark">Slot ${slot.id}</h3>
      <button onclick="document.getElementById('slot-modal').classList.add('hidden')" class="text-gray-400 hover:text-gray-600"><i data-lucide="x" class="w-5 h-5"></i></button>
    </div>
    <div class="grid grid-cols-2 gap-3 text-sm mb-4 bg-orange-50 rounded-xl p-4">
      <p><span class="text-gray-500">Zone:</span> <strong>${slot.zoneName}</strong></p>
      <p><span class="text-gray-500">Tầng:</span> <strong>${slot.floor}</strong></p>
      <p><span class="text-gray-500">Loại:</span> <strong>${slot.type === 'motorbike' ? 'Xe Máy' : slot.type === 'car' ? 'Xe Hơi' : 'Xe Tải'}</strong></p>
      <p><span class="text-gray-500">Sức chứa:</span> <strong>${slot.occupied}/${slot.capacity}</strong></p>
      <p><span class="text-gray-500">DT Zone:</span> <strong>${slot.zoneArea}</strong></p>
      <p><span class="text-gray-500">DT Slot:</span> <strong>${slot.slotArea}</strong></p>
    </div>
    <h4 class="font-semibold text-dark mb-2">Xe đang đỗ (${vehicles.length})</h4>
    ${vehicles.length ? vehicles.map(v => `
      <div class="flex items-center justify-between bg-gray-50 rounded-lg p-3 mb-2">
        <div>
          <p class="font-semibold text-sm">${v.plate_number}</p>
          <p class="text-xs text-gray-500">Vào: ${formatTime(v.check_in_time)}</p>
        </div>
        <span class="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">${v.card_id}</span>
      </div>
    `).join('') : '<p class="text-gray-400 text-sm">Không có xe</p>'}
  `;
  modal.classList.remove('hidden');
  lucide.createIcons();
}

// ====== CARDS ======
function renderCards() {
  const typeF = document.getElementById('card-type-filter').value;
  const statusF = document.getElementById('card-status-filter').value;
  let filtered = CARDS;
  if (typeF !== 'all') filtered = filtered.filter(c => c.type === typeF);
  if (statusF !== 'all') filtered = filtered.filter(c => c.status === statusF);
  
  document.getElementById('cards-grid').innerHTML = filtered.map(c => {
    const statusColor = c.status === 'available' ? 'bg-green-100 text-green-700' : c.status === 'in_use' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700';
    const typeColor = c.type === 'monthly' ? 'border-l-purple-500' : 'border-l-orange-500';
    return `<div class="bg-white border border-gray-100 rounded-xl p-4 border-l-4 ${typeColor} shadow-sm">
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-sm">${c.id}</span>
        <span class="text-xs px-2 py-1 rounded-full ${statusColor}">${c.status === 'available' ? 'Sẵn sàng' : c.status === 'in_use' ? 'Đang dùng' : 'Mất'}</span>
      </div>
      <p class="text-xs text-gray-500">${c.type === 'monthly' ? 'Thẻ Tháng' : 'Thẻ Lượt'}</p>
      ${c.plate ? `<p class="text-xs text-primary font-medium mt-1">${c.plate}</p>` : ''}
    </div>`;
  }).join('');
}

// ====== GATES ======
function renderGates() {
  document.getElementById('gates-grid').innerHTML = GATES.map(g => `
    <div class="bg-white border border-orange-100 rounded-xl p-4 text-center ${g.active ? 'pulse-gate' : 'opacity-50'}">
      <div class="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center ${g.status === 'entry' ? 'bg-green-100' : 'bg-blue-100'}">
        <i data-lucide="${g.status === 'entry' ? 'arrow-down-circle' : 'arrow-up-circle'}" class="w-6 h-6 ${g.status === 'entry' ? 'text-green-600' : 'text-blue-600'}"></i>
      </div>
      <p class="font-semibold text-sm">${g.name}</p>
      <p class="text-xs ${g.status === 'entry' ? 'text-green-600' : 'text-blue-600'}">${g.status === 'entry' ? 'Lối vào' : 'Lối ra'}</p>
    </div>
  `).join('');
  lucide.createIcons();
}

// ====== STATS ======
function renderStats() {
  const parked = allRecords.filter(r => r.status === 'parked');
  const totalCapacity = parkingSlots.reduce((a, s) => a + s.capacity, 0);
  const totalOccupied = parked.length;
  const motos = parked.filter(r => r.vehicle_type === 'motorbike').length;
  const cars = parked.filter(r => r.vehicle_type === 'car').length;
  const trucks = parked.filter(r => r.vehicle_type === 'truck').length;
  const todayRevenue = allRecords.filter(r => r.status === 'completed' && r.check_out_time && new Date(r.check_out_time).toDateString() === new Date().toDateString()).reduce((a, r) => a + (r.amount || 0), 0);

  document.getElementById('stat-total').textContent = totalOccupied;
  document.getElementById('stat-fill').textContent = totalCapacity ? Math.round(totalOccupied / totalCapacity * 100) + '%' : '0%';
  document.getElementById('stat-moto').textContent = totalOccupied ? Math.round(motos / totalOccupied * 100) + '%' : '0%';
  document.getElementById('stat-revenue').textContent = formatCurrency(todayRevenue);

  document.getElementById('stat-bars').innerHTML = [
    { label: 'Xe Máy', count: motos, color: 'bg-orange-500', max: parkingSlots.filter(s=>s.type==='motorbike').reduce((a,s)=>a+s.capacity,0) },
    { label: 'Xe Hơi', count: cars, color: 'bg-gray-500', max: parkingSlots.filter(s=>s.type==='car').reduce((a,s)=>a+s.capacity,0) },
    { label: 'Xe Tải', count: trucks, color: 'bg-red-500', max: parkingSlots.filter(s=>s.type==='truck').reduce((a,s)=>a+s.capacity,0) }
  ].map(b => `
    <div>
      <div class="flex justify-between text-sm mb-1"><span>${b.label}</span><span class="font-semibold">${b.count}/${b.max}</span></div>
      <div class="w-full bg-gray-200 rounded-full h-3"><div class="${b.color} h-3 rounded-full transition-all" style="width:${b.max?b.count/b.max*100:0}%"></div></div>
    </div>
  `).join('');

  document.getElementById('stat-floors').innerHTML = FLOORS.map(f => {
    const floorSlots = parkingSlots.filter(s => s.floor === f.floor);
    const cap = floorSlots.reduce((a,s) => a+s.capacity, 0);
    const occ = floorSlots.reduce((a,s) => a+s.occupied, 0);
    const pct = cap ? Math.round(occ/cap*100) : 0;
    return `<div class="bg-gray-50 rounded-xl p-4">
      <p class="text-sm font-semibold mb-2">${f.name}</p>
      <p class="text-2xl font-bold text-primary">${pct}%</p>
      <p class="text-xs text-gray-500">${occ}/${cap} chỗ | ${f.area}</p>
    </div>`;
  }).join('');

  // Render comparison chart
  renderComparisonChart(todayRevenue);
}

function getRevenueForDate(targetDate) {
  return allRecords.filter(r => {
    if (r.status !== 'completed' || !r.check_out_time) return false;
    const checkoutDate = new Date(r.check_out_time).toDateString();
    return checkoutDate === targetDate.toDateString();
  }).reduce((a, r) => a + (r.amount || 0), 0);
}

function renderComparisonChart(todayRevenue) {
  const range = document.getElementById('stat-compare-range').value;
  const today = new Date();
  let compareDate, compareLabel;

  if (range === 'yesterday') {
    compareDate = new Date(today);
    compareDate.setDate(compareDate.getDate() - 1);
    compareLabel = 'Hôm qua';
  } else if (range === 'week') {
    compareDate = new Date(today);
    compareDate.setDate(compareDate.getDate() - 7);
    compareLabel = '1 tuần trước';
  } else if (range === 'month') {
    compareDate = new Date(today);
    compareDate.setDate(compareDate.getDate() - 30);
    compareLabel = '1 tháng trước';
  } else if (range === 'year') {
    compareDate = new Date(today);
    compareDate.setFullYear(compareDate.getFullYear() - 1);
    compareLabel = '1 năm trước';
  }

  const compareRevenue = getRevenueForDate(compareDate);
  const maxRevenue = Math.max(todayRevenue, compareRevenue, 1000000);
  const todayPct = (todayRevenue / maxRevenue) * 100;
  const comparePct = (compareRevenue / maxRevenue) * 100;
  const diff = todayRevenue - compareRevenue;
  const diffPct = compareRevenue ? Math.round((diff / compareRevenue) * 100) : 0;
  const trendColor = diff >= 0 ? 'text-green-600' : 'text-red-600';
  const trendIcon = diff >= 0 ? '↑' : '↓';

  document.getElementById('stat-comparison-chart').innerHTML = `
    <div class="space-y-4">
      <div class="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
        <div>
          <p class="text-sm text-gray-600">Hôm nay</p>
          <p class="text-2xl font-bold text-green-600">${formatCurrency(todayRevenue)}</p>
        </div>
        <span class="text-4xl font-bold text-green-200">📊</span>
      </div>
      
      <div class="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
        <div>
          <p class="text-sm text-gray-600">${compareLabel}</p>
          <p class="text-2xl font-bold text-blue-600">${formatCurrency(compareRevenue)}</p>
        </div>
        <span class="text-4xl font-bold text-blue-200">📈</span>
      </div>

      <div class="bg-white rounded-xl p-4 border border-gray-200">
        <p class="text-sm text-gray-600 mb-3">So sánh biểu đồ</p>
        <div class="space-y-3">
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-medium">Hôm nay</span>
              <span class="text-xs font-bold text-green-600">${formatCurrency(todayRevenue)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div class="bg-gradient-to-r from-green-500 to-emerald-500 h-4 rounded-full transition-all" style="width:${todayPct}%"></div>
            </div>
          </div>
          <div>
            <div class="flex justify-between items-center mb-1">
              <span class="text-sm font-medium">${compareLabel}</span>
              <span class="text-xs font-bold text-blue-600">${formatCurrency(compareRevenue)}</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div class="bg-gradient-to-r from-blue-500 to-cyan-500 h-4 rounded-full transition-all" style="width:${comparePct}%"></div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl p-4 border border-gray-200">
        <div class="flex items-center justify-between">
          <span class="text-sm text-gray-600">Chênh lệch</span>
          <div class="text-right">
            <p class="text-lg font-bold ${trendColor}"> ${trendIcon} ${formatCurrency(Math.abs(diff))}</p>
            <p class="text-xs ${trendColor}">${diff >= 0 ? '+' : ''}${diffPct}%</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ====== MONTHLY ======
function renderMonthly() {
  const monthly = allRecords.filter(r => r.card_type === 'monthly' && r.status === 'parked');
  const list = document.getElementById('monthly-list');
  const empty = document.getElementById('monthly-empty');
  if (!monthly.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = monthly.map(r => {
    const overdue = r.monthly_due_date && new Date(r.monthly_due_date) < new Date();
    const days = r.monthly_due_date ? Math.floor((Date.now() - new Date(r.monthly_due_date).getTime()) / 86400000) : 0;
    let statusBadge = '<span class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Đã TT</span>';
    if (overdue && days > 30) statusBadge = '<span class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Phạt (>30 ngày)</span>';
    else if (overdue && days > 14) statusBadge = '<span class="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">Cần liên hệ</span>';
    else if (overdue) statusBadge = '<span class="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Chưa TT</span>';
    const vehicleColor = getVehicleColor(r.vehicle_type);
    return `<tr class="border-b border-gray-50">
      <td class="px-4 py-3 font-medium">${r.card_id}</td>
      <td class="px-4 py-3">${r.plate_number}</td>
      <td class="px-4 py-3"><span class="${vehicleColor.badge} px-2 py-1 rounded text-xs font-medium">${getVehicleLabel(r.vehicle_type)}</span></td>
      <td class="px-4 py-3">${r.monthly_due_date ? new Date(r.monthly_due_date).toLocaleDateString('vi-VN') : '-'}</td>
      <td class="px-4 py-3">${statusBadge}</td>
      <td class="px-4 py-3"><button class="text-xs text-primary hover:underline">Chi tiết</button></td>
    </tr>`;
  }).join('');
}

// ====== HOURLY ======
function renderHourly() {
  const hourly = allRecords.filter(r => r.card_type === 'hourly' && r.status === 'parked');
  const list = document.getElementById('hourly-list');
  const empty = document.getElementById('hourly-empty');
  if (!hourly.length) { list.innerHTML = ''; empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');
  list.innerHTML = hourly.map(r => {
    const vehicleColor = getVehicleColor(r.vehicle_type);
    return `<tr class="border-b border-gray-50">
    <td class="px-4 py-3 font-medium">${r.plate_number}</td>
    <td class="px-4 py-3"><span class="${vehicleColor.badge} px-2 py-1 rounded text-xs font-medium">${getVehicleLabel(r.vehicle_type)}</span></td>
    <td class="px-4 py-3">${formatTime(r.check_in_time)}</td>
    <td class="px-4 py-3"><span class="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">${r.slot}</span></td>
    <td class="px-4 py-3">${r.gate}</td>
    <td class="px-4 py-3">${r.card_id}</td>
  </tr>`;
  }).join('');
}

// ====== SEARCH ======
function handleSearch() {
  const q = document.getElementById('search-input').value.trim().toUpperCase();
  if (!q) return;
  const results = allRecords.filter(r => r.status === 'parked' && (r.plate_number.includes(q) || r.card_id.toUpperCase().includes(q)));
  const container = document.getElementById('search-results');
  if (!results.length) { container.innerHTML = '<p class="text-gray-400 text-center py-8">Không tìm thấy xe nào</p>'; return; }
  container.innerHTML = results.map(r => {
    const vehicleColor = getVehicleColor(r.vehicle_type);
    return `<div class="bg-orange-50 rounded-xl p-4 mb-3 border border-orange-100">
      <div class="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
        <p><span class="text-gray-500">Biển số:</span> <strong>${r.plate_number}</strong></p>
        <p><span class="text-gray-500">Slot:</span> <strong>${r.slot}</strong></p>
        <p><span class="text-gray-500">Tầng:</span> <strong>${r.floor}</strong></p>
        <p><span class="text-gray-500">Loại xe:</span> <span class="${vehicleColor.badge} px-2 py-1 rounded text-xs font-medium">${getVehicleLabel(r.vehicle_type)}</span></p>
        <p><span class="text-gray-500">Giờ vào:</span> <strong>${formatTime(r.check_in_time)}</strong></p>
        <p><span class="text-gray-500">Thẻ:</span> <strong>${r.card_id}</strong></p>
      </div>
    </div>`;
  }).join('');
}

// ====== ELEMENT SDK ======
const defaultConfig = {
  system_title: 'Parking Management System',
  building_name: 'SmartPark Building',
  background_color: '#FFF7ED',
  surface_color: '#FFFFFF',
  text_color: '#1C1917',
  primary_color: '#F97316',
  secondary_color: '#EA580C',
  font_family: 'Be Vietnam Pro',
  font_size: 14
};

window.elementSdk.init({
  defaultConfig,
  onConfigChange: async (config) => {
    document.getElementById('system-title').textContent = config.system_title || defaultConfig.system_title;
    document.getElementById('building-name').textContent = config.building_name || defaultConfig.building_name;
    document.getElementById('app').style.backgroundColor = config.background_color || defaultConfig.background_color;
    document.documentElement.style.setProperty('--primary', config.primary_color || defaultConfig.primary_color);
    const font = config.font_family || defaultConfig.font_family;
    document.body.style.fontFamily = `${font}, sans-serif`;
  },
  mapToCapabilities: (config) => ({
    recolorables: [
      { get: () => config.background_color || defaultConfig.background_color, set: (v) => { config.background_color = v; window.elementSdk.setConfig({ background_color: v }); } },
      { get: () => config.surface_color || defaultConfig.surface_color, set: (v) => { config.surface_color = v; window.elementSdk.setConfig({ surface_color: v }); } },
      { get: () => config.text_color || defaultConfig.text_color, set: (v) => { config.text_color = v; window.elementSdk.setConfig({ text_color: v }); } },
      { get: () => config.primary_color || defaultConfig.primary_color, set: (v) => { config.primary_color = v; window.elementSdk.setConfig({ primary_color: v }); } },
      { get: () => config.secondary_color || defaultConfig.secondary_color, set: (v) => { config.secondary_color = v; window.elementSdk.setConfig({ secondary_color: v }); } }
    ],
    borderables: [],
    fontEditable: { get: () => config.font_family || defaultConfig.font_family, set: (v) => { config.font_family = v; window.elementSdk.setConfig({ font_family: v }); } },
    fontSizeable: { get: () => config.font_size || defaultConfig.font_size, set: (v) => { config.font_size = v; window.elementSdk.setConfig({ font_size: v }); } }
  }),
  mapToEditPanelValues: (config) => new Map([
    ['system_title', config.system_title || defaultConfig.system_title],
    ['building_name', config.building_name || defaultConfig.building_name]
  ])
});

lucide.createIcons();
