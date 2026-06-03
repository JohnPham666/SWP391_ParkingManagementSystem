import { notifications, parkingLots, profileSections, services, vehicles } from "./data.js";

export function renderStaticContent() {
  renderServices();
  renderProfile();
  renderVehicles();
  renderSettings();
  renderParkingLots();
}

function renderServices() {
  const list = document.getElementById("services-list");
  list.innerHTML = services.map((service) => `
    <article class="panel overflow-hidden p-0">
      <div class="flex flex-col md:flex-row">
        <div class="w-full md:w-40 h-40 bg-${service.color}-500 flex items-center justify-center text-white shrink-0">
          <i data-lucide="${service.icon}" class="w-20 h-20"></i>
        </div>
        <div class="flex-1 p-6">
          <h3 class="text-xl font-bold text-gray-800 mb-2">${service.title}</h3>
          <p class="text-sm text-gray-600 mb-4">${service.description}</p>
          <div class="space-y-2 mb-6">
            ${service.features.map((feature) => `<p class="flex items-center gap-2 text-sm text-gray-700"><i data-lucide="check" class="w-4 h-4 text-green-600"></i>${feature}</p>`).join("")}
          </div>
          <div class="border-t border-gray-200 pt-4">
            <div class="flex justify-between items-center"><span class="text-gray-600 font-medium">${service.priceLabel}</span><span class="text-2xl font-bold text-${service.color}-600">${service.price}</span></div>
            <p class="text-xs text-gray-500 mt-1">${service.note}</p>
            <button type="button" class="primary-button w-full mt-4" data-action="register-service" data-service="${service.title}">Đăng ký ngay</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function renderProfile() {
  const content = document.getElementById("profile-content");
  content.innerHTML = profileSections.map((section) => `
    <section>
      <h2 class="page-title flex items-center gap-2 mb-4"><i data-lucide="${section.icon}" class="w-6 h-6 text-orange-500"></i>${section.title}</h2>
      <div class="panel grid grid-cols-1 md:grid-cols-2 gap-6">
        ${section.items.map(([label, value]) => renderProfileItem(label, value)).join("")}
      </div>
    </section>
  `).join("")}
  <section>
    <h2 class="page-title flex items-center gap-2 mb-4"><i data-lucide="history" class="w-6 h-6 text-orange-500"></i>Lịch sử hoạt động</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div class="panel"><h3 class="section-title">Dịch vụ đã sử dụng</h3><p>Gửi xe hàng ngày: 25 lần</p><p>Đăng ký vé tháng: 12 lần</p><p>Đặt chỗ trước: 5 lần</p></div>
      <div class="panel"><h3 class="section-title">Lịch sử thanh toán</h3><p>Chuyển khoản: +150.000đ</p><p>Thanh toán qua thẻ: +200.000đ</p><p>Ví điện tử: +100.000đ</p></div>
    </div>
  </section>`;
}

function renderProfileItem(label, value) {
  if (label === "Mật khẩu") {
    return `
      <div>
        <p class="text-sm font-semibold text-gray-500">${label}</p>
        <p class="text-gray-800 mt-1 flex items-center gap-2">
          <span id="password-display">${value}</span>
          <button type="button" class="text-orange-600" data-action="toggle-password" aria-label="Hiện hoặc ẩn mật khẩu"><i data-lucide="eye" class="w-4 h-4"></i></button>
        </p>
      </div>
    `;
  }

  return `
    <div>
      <p class="text-sm font-semibold text-gray-500">${label}</p>
      <p class="text-gray-800 mt-1">${value}</p>
    </div>
  `;
}

function renderVehicles() {
  const list = document.getElementById("vehicles-list");
  list.innerHTML = vehicles.map((vehicle) => {
    const pending = vehicle.status.includes("Chờ");
    return `
      <article class="panel p-0 overflow-hidden">
        <div class="flex flex-col md:flex-row">
          <div class="w-full md:w-40 h-40 bg-gradient-to-br ${vehicle.tone} flex items-center justify-center text-white shrink-0">
            <i data-lucide="car" class="w-20 h-20"></i>
          </div>
          <div class="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            ${vehicleField("Biển số xe", vehicle.plate, true)}
            ${vehicleField("Loại xe", vehicle.type, true)}
            ${vehicleField("Hãng xe", vehicle.brand)}
            ${vehicleField("Model xe", vehicle.model)}
            ${vehicleField("Màu xe", vehicle.color)}
            <div><p class="text-xs font-semibold text-gray-500 uppercase">Trạng thái</p><p class="flex items-center gap-2 mt-1"><span class="w-2 h-2 ${pending ? "bg-yellow-500" : "bg-green-500"} rounded-full"></span><span class="${pending ? "text-yellow-600" : "text-green-600"} font-semibold">${vehicle.status}</span></p></div>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function vehicleField(label, value, large = false) {
  return `<div><p class="text-xs font-semibold text-gray-500 uppercase">${label}</p><p class="${large ? "text-lg font-bold" : ""} text-gray-800 mt-1">${value}</p></div>`;
}

function renderSettings() {
  const list = document.getElementById("notification-settings");
  list.innerHTML = notifications.map(([title, desc, checked]) => `
    <label class="flex items-center justify-between gap-4 py-4">
      <span><span class="block font-medium text-gray-800">${title}</span><span class="block text-sm text-gray-500">${desc}</span></span>
              <input type="checkbox" class="w-5 h-5 accent-orange-500" data-action="toggle-notification" ${checked ? "checked" : ""} />
    </label>
  `).join("");
}

function renderParkingLots() {
  const list = document.getElementById("parking-list");
  list.innerHTML = parkingLots.map((lot) => `
    <article class="panel p-0 overflow-hidden">
      <div class="h-40 bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white">
        <i data-lucide="building-2" class="w-16 h-16"></i>
      </div>
      <div class="p-6">
        <h3 class="text-lg font-bold text-gray-800 mb-2">${lot.name}</h3>
        <div class="space-y-2 text-sm text-gray-600 mb-4">
          <p class="flex items-start gap-2"><i data-lucide="map-pin" class="w-4 h-4 text-orange-500 mt-0.5 shrink-0"></i>${lot.address}</p>
          <p class="flex items-center gap-2"><i data-lucide="car" class="w-4 h-4 text-orange-500"></i>Sức chứa: ${lot.capacity} xe</p>
          <p class="flex items-center gap-2"><i data-lucide="clock" class="w-4 h-4 text-orange-500"></i>${lot.hours}</p>
        </div>
        <button type="button" class="primary-button w-full" data-action="parking-detail" data-lot="${lot.name}" data-address="${lot.address}" data-capacity="${lot.capacity}" data-hours="${lot.hours}">Xem chi tiết</button>
      </div>
    </article>
  `).join("");
}
