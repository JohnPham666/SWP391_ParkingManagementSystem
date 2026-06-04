(function () {
  const customerName = "Nguyễn Văn A";
  const routes = {
    home: { pageId: "home-page", title: null },
    booking: { pageId: "booking-page", title: "Đặt chỗ gửi xe" },
    services: { pageId: "services-page", title: "Các dịch vụ của chúng tôi" },
    "add-vehicle": { pageId: "add-vehicle-page", title: "Đăng ký thông tin xe" },
    profile: { pageId: "profile-page", title: "Hồ sơ cá nhân" },
    vehicles: { pageId: "vehicles-page", title: "Thông tin xe của tôi" },
    settings: { pageId: "settings-page", title: "Cài đặt" },
    wallet: { pageId: "wallet-page", title: "Ví tiền của tôi" },
    parking: { pageId: "parking-page", title: "Các bãi gửi xe" },
  };

  const parkingLots = [
    { name: "Bãi Gửi Xe Trung Tâm", address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM", capacity: 500, hours: "24/7 - Mở cửa thường xuyên" },
    { name: "Bãi Gửi Xe Tây Thạnh", address: "456 Đường Kinh Dương Vương, Quận 6, TP.HCM", capacity: 350, hours: "6:00 - 22:00" },
    { name: "Bãi Gửi Xe Quận 7", address: "789 Đường Cao Lỗ, Quận 7, TP.HCM", capacity: 400, hours: "5:30 - 23:00" },
    { name: "Bãi Gửi Xe Bình Tân", address: "321 Đường Lê Văn Quới, Quận Bình Tân, TP.HCM", capacity: 300, hours: "24/7 - Mở cửa thường xuyên" },
  ];

  const vehicles = [
    { plate: "51F - 123.45", type: "Xe ô tô 4 chỗ", brand: "Toyota", model: "Vios 2023", color: "Trắng", status: "Đã xác nhận", tone: "from-blue-400 to-blue-500" },
    { plate: "51G - 234.56", type: "Xe ô tô 5 chỗ", brand: "Honda", model: "City 2022", color: "Đỏ", status: "Đã xác nhận", tone: "from-red-400 to-red-500" },
    { plate: "51H - 345.67", type: "Xe bán tải", brand: "Ford", model: "Ranger 2021", color: "Xám", status: "Chờ xác nhận", tone: "from-gray-400 to-gray-500" },
  ];

  const services = [
    { icon: "calendar-days", title: "Gửi xe hàng ngày", description: "Dịch vụ gửi xe linh hoạt theo ngày với giá cước cạnh tranh", features: ["Mở cửa 24/7", "Tính tiền theo giờ hoặc ngày", "Bảo hiểm tự động"], priceLabel: "Giá khởi điểm:", price: "50.000đ", note: "/ngày (tùy kích thước xe)", color: "blue" },
    { icon: "ticket", title: "Đăng ký vé tháng", description: "Gửi xe không giới hạn trong 1 tháng với mức giá cố định", features: ["Gửi xe không giới hạn", "Giá ưu đãi so với hàng ngày", "Ưu tiên bãi đậu tốt"], priceLabel: "Giá tháng:", price: "1.200.000đ", note: "/tháng - tiết kiệm đến 40%", color: "green" },
    { icon: "calendar-check", title: "Đặt chỗ trước", description: "Đặt trước chỗ gửi xe và chỉ thanh toán khi sử dụng", features: ["Đặt chỗ với chi phí cực thấp", "Chọn vị trí yêu thích", "Hủy miễn phí 2 tiếng trước"], priceLabel: "Giá đặt chỗ:", price: "10.000đ", note: "/lần (không bao gồm phí gửi)", color: "purple" },
  ];

  const slots = {
    center: [{ spot: "A1", level: "1", price: 50000 }, { spot: "A2", level: "1", price: 50000 }, { spot: "A5", level: "2", price: 50000 }, { spot: "B1", level: "2", price: 50000 }],
    west: [{ spot: "C1", level: "1", price: 40000 }, { spot: "C4", level: "1", price: 40000 }, { spot: "D2", level: "2", price: 40000 }],
    district7: [{ spot: "E1", level: "1", price: 45000 }, { spot: "E6", level: "1", price: 45000 }, { spot: "F2", level: "2", price: 45000 }, { spot: "G1", level: "3", price: 45000 }],
    binhtan: [{ spot: "H1", level: "1", price: 35000 }, { spot: "H3", level: "1", price: 35000 }, { spot: "H5", level: "1", price: 35000 }],
  };

  const profileSections = [
    { icon: "user", title: "Thông tin cơ bản", items: [["Họ và tên", "Nguyễn Văn A"], ["Mã khách hàng", "KH-2024-00123"], ["Ngày sinh", "15/03/1990"], ["Giới tính", "Nam"]] },
    { icon: "phone", title: "Thông tin liên hệ", items: [["Số điện thoại", "0912 345 678"], ["Email", "nguyenvana@email.com"], ["Địa chỉ", "123 Đường Nguyễn Huệ, Quận 1, TP.HCM"], ["Người liên hệ khẩn cấp", "Trần Thị B - 0912 987 654"]] },
    { icon: "lock", title: "Thông tin tài khoản", items: [["Tên đăng nhập", "nguyenvana"], ["Mật khẩu", "••••••••••••"], ["Ngày tạo tài khoản", "20/01/2023"], ["Trạng thái tài khoản", "Đang hoạt động - VIP"]] },
  ];

  const notifications = [
    ["Nhận email thông báo", "Nhận cập nhật qua email", true],
    ["Nhận SMS thông báo", "Nhận cập nhật qua tin nhắn SMS", false],
    ["Thông báo vé sắp hết hạn", "Thông báo khi vé gửi xe sắp hết hạn", true],
    ["Thông báo thanh toán", "Thông báo khi thanh toán thành công", true],
    ["Thông báo đặt chỗ", "Thông báo xác nhận và nhắc nhở đặt chỗ", true],
  ];

  const colors = { orange: "#f97316", blue: "#3b82f6", red: "#ef4444", green: "#22c55e", purple: "#a855f7" };
  let fontSize = 16;
  let walletBalance = 2500000;
  let transactions = [
    { type: "deposit", amount: 500000, method: "Chuyển khoản", date: "2024-12-15 14:30" },
    { type: "spend", amount: -150000, method: "Gửi xe", date: "2024-12-14 10:15" },
    { type: "withdraw", amount: -200000, method: "Rút tiền", date: "2024-12-13 16:45" },
    { type: "deposit", amount: 300000, method: "Thẻ tín dụng", date: "2024-12-12 09:20" },
  ];

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    renderStaticContent();
    initNavigation();
    initBooking();
    initVehicleForm();
    initWallet();
    initThemeControls();
    initActions();
    refreshIcons();
  }

  function renderStaticContent() {
    renderServices();
    renderProfile();
    renderVehicles();
    renderSettings();
    renderParkingLots();
  }

  function renderServices() {
    document.getElementById("services-list").innerHTML = services.map((service) => `
      <article class="panel overflow-hidden p-0">
        <div class="flex flex-col md:flex-row">
          <div class="w-full md:w-40 h-40 bg-${service.color}-500 flex items-center justify-center text-white shrink-0"><i data-lucide="${service.icon}" class="w-20 h-20"></i></div>
          <div class="flex-1 p-6">
            <h3 class="text-xl font-bold text-gray-800 mb-2">${service.title}</h3>
            <p class="text-sm text-gray-600 mb-4">${service.description}</p>
            <div class="space-y-2 mb-6">${service.features.map((feature) => `<p class="flex items-center gap-2 text-sm text-gray-700"><i data-lucide="check" class="w-4 h-4 text-green-600"></i>${feature}</p>`).join("")}</div>
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
    document.getElementById("profile-content").innerHTML = profileSections.map((section) => `
      <section>
        <h2 class="page-title flex items-center gap-2 mb-4"><i data-lucide="${section.icon}" class="w-6 h-6 text-orange-500"></i>${section.title}</h2>
        <div class="panel grid grid-cols-1 md:grid-cols-2 gap-6">${section.items.map(renderProfileItem).join("")}</div>
      </section>
    `).join("") + `
      <section>
        <h2 class="page-title flex items-center gap-2 mb-4"><i data-lucide="history" class="w-6 h-6 text-orange-500"></i>Lịch sử hoạt động</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="panel"><h3 class="section-title">Dịch vụ đã sử dụng</h3><p>Gửi xe hàng ngày: 25 lần</p><p>Đăng ký vé tháng: 12 lần</p><p>Đặt chỗ trước: 5 lần</p></div>
          <div class="panel"><h3 class="section-title">Lịch sử thanh toán</h3><p>Chuyển khoản: +150.000đ</p><p>Thanh toán qua thẻ: +200.000đ</p><p>Ví điện tử: +100.000đ</p></div>
        </div>
      </section>`;
  }

  function renderProfileItem(item) {
    const label = item[0];
    const value = item[1];
    if (label === "Mật khẩu") {
      return `<div><p class="text-sm font-semibold text-gray-500">${label}</p><p class="text-gray-800 mt-1 flex items-center gap-2"><span id="password-display">${value}</span><button type="button" class="text-orange-600" data-action="toggle-password" aria-label="Hiện hoặc ẩn mật khẩu"><i data-lucide="eye" class="w-4 h-4"></i></button></p></div>`;
    }
    return `<div><p class="text-sm font-semibold text-gray-500">${label}</p><p class="text-gray-800 mt-1">${value}</p></div>`;
  }

  function renderVehicles() {
    document.getElementById("vehicles-list").innerHTML = vehicles.map((vehicle) => {
      const pending = vehicle.status.includes("Chờ");
      return `
        <article class="panel p-0 overflow-hidden">
          <div class="flex flex-col md:flex-row">
            <div class="w-full md:w-40 h-40 bg-gradient-to-br ${vehicle.tone} flex items-center justify-center text-white shrink-0"><i data-lucide="car" class="w-20 h-20"></i></div>
            <div class="flex-1 p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              ${vehicleField("Biển số xe", vehicle.plate, true)}${vehicleField("Loại xe", vehicle.type, true)}${vehicleField("Hãng xe", vehicle.brand)}${vehicleField("Model xe", vehicle.model)}${vehicleField("Màu xe", vehicle.color)}
              <div><p class="text-xs font-semibold text-gray-500 uppercase">Trạng thái</p><p class="flex items-center gap-2 mt-1"><span class="w-2 h-2 ${pending ? "bg-yellow-500" : "bg-green-500"} rounded-full"></span><span class="${pending ? "text-yellow-600" : "text-green-600"} font-semibold">${vehicle.status}</span></p></div>
            </div>
          </div>
        </article>`;
    }).join("");
  }

  function vehicleField(label, value, large) {
    return `<div><p class="text-xs font-semibold text-gray-500 uppercase">${label}</p><p class="${large ? "text-lg font-bold" : ""} text-gray-800 mt-1">${value}</p></div>`;
  }

  function renderSettings() {
    document.getElementById("notification-settings").innerHTML = notifications.map(([title, desc, checked]) => `
      <label class="flex items-center justify-between gap-4 py-4">
        <span><span class="block font-medium text-gray-800">${title}</span><span class="block text-sm text-gray-500">${desc}</span></span>
        <input type="checkbox" class="w-5 h-5 accent-orange-500" data-action="toggle-notification" ${checked ? "checked" : ""} />
      </label>
    `).join("");
  }

  function renderParkingLots() {
    document.getElementById("parking-list").innerHTML = parkingLots.map((lot) => `
      <article class="panel p-0 overflow-hidden">
        <div class="h-40 bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white"><i data-lucide="building-2" class="w-16 h-16"></i></div>
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

  function initNavigation() {
    document.addEventListener("click", (event) => {
      const routeButton = event.target.closest("[data-route]");
      if (!routeButton) return;
      event.preventDefault();
      showPage(routeButton.dataset.route);
    });

    const menuButton = document.getElementById("user-menu-btn");
    const menu = document.getElementById("user-menu");
    menuButton.addEventListener("click", () => menu.classList.toggle("hidden"));
    document.addEventListener("click", (event) => {
      if (!menuButton.contains(event.target) && !menu.contains(event.target)) menu.classList.add("hidden");
    });
  }

  function showPage(routeName) {
    const route = routes[routeName] || routes.home;
    document.querySelectorAll(".page").forEach((page) => page.classList.remove("active-page"));
    document.getElementById(route.pageId).classList.add("active-page");
    document.getElementById("user-menu").classList.add("hidden");
    updateHeader(routeName, route.title);
    window.scrollTo({ top: 0, behavior: "auto" });
    refreshIcons();
  }

  function updateHeader(routeName, title) {
    const headerContent = document.getElementById("header-content");
    if (routeName === "home") {
      headerContent.innerHTML = `<h1 id="greeting" class="text-2xl font-bold">Xin chào, ${customerName}</h1><p class="text-white/80 text-sm mt-1">Chào mừng bạn đến với hệ thống gửi xe thông minh</p>`;
      return;
    }
    headerContent.innerHTML = `<h1 class="text-2xl font-bold">${title}</h1>`;
  }

  function initBooking() {
    const form = document.getElementById("booking-search-form");
    const results = document.getElementById("booking-results");
    const empty = document.getElementById("no-results-message");
    const list = document.getElementById("slots-list");
    const success = document.getElementById("booking-success");

    document.getElementById("search-slots-btn").addEventListener("click", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const lot = document.getElementById("booking-parking-lot").value;
      list.innerHTML = (slots[lot] || []).map((slot, index) => `
        <article class="panel hover:shadow-lg transition">
          <div class="flex justify-between items-start mb-3"><div><p class="font-bold text-lg text-gray-800">Chỗ ${slot.spot}</p><p class="text-sm text-gray-500">Tầng ${slot.level}</p></div><span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Trống</span></div>
          <div class="border-t border-gray-200 pt-3"><p class="text-orange-600 font-bold text-lg">${slot.price.toLocaleString("vi-VN")}đ</p><p class="text-xs text-gray-500 mb-3">Giá cho một lần gửi</p><button class="primary-button w-full" data-book-slot="${index}">Đặt chỗ này</button></div>
        </article>`).join("");
      empty.classList.add("hidden");
      results.classList.remove("hidden");
      success.classList.add("hidden");
      refreshIcons();
    });

    list.addEventListener("click", (event) => {
      if (!event.target.closest("[data-book-slot]")) return;
      results.classList.add("hidden");
      success.classList.remove("hidden");
      setTimeout(() => {
        form.reset();
        success.classList.add("hidden");
        empty.classList.remove("hidden");
      }, 2500);
    });

    document.getElementById("clear-booking-btn").addEventListener("click", (event) => {
      event.preventDefault();
      form.reset();
      results.classList.add("hidden");
      success.classList.add("hidden");
      empty.classList.remove("hidden");
    });
  }

  function initVehicleForm() {
    const form = document.getElementById("vehicle-registration-form");
    const success = document.getElementById("form-success");
    form.querySelectorAll('input[type="file"]').forEach((input) => {
      input.addEventListener("change", () => {
        input.parentElement.querySelector("span").textContent = input.files.length ? `✓ ${input.files[0].name}` : "";
      });
    });
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      success.classList.remove("hidden");
      setTimeout(() => {
        form.reset();
        form.querySelectorAll(".upload-box span").forEach((span) => { span.textContent = ""; });
        success.classList.add("hidden");
        showPage("home");
      }, 2500);
    });
    document.getElementById("cancel-registration").addEventListener("click", () => {
      form.reset();
      success.classList.add("hidden");
      showPage("home");
    });
  }

  function initWallet() {
    renderTransactions();
    updateBalance();
    document.getElementById("deposit-btn").addEventListener("click", () => openModal("deposit-modal"));
    document.getElementById("withdraw-btn").addEventListener("click", () => openModal("withdraw-modal"));
    document.getElementById("history-btn").addEventListener("click", () => document.getElementById("transactions-list").scrollIntoView({ behavior: "smooth" }));
    document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => closeModal(button.dataset.closeModal)));
    document.querySelectorAll(".modal").forEach((modal) => modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(modal.id); }));
    document.getElementById("deposit-form").addEventListener("submit", submitDeposit);
    document.getElementById("withdraw-form").addEventListener("submit", submitWithdraw);
  }

  function submitDeposit(event) {
    event.preventDefault();
    const amount = Number(document.getElementById("deposit-amount").value);
    const method = document.getElementById("deposit-method").value;
    if (!amount || !method) return;
    walletBalance += amount;
    transactions.unshift({ type: "deposit", amount, method: { card: "Thẻ tín dụng", bank: "Chuyển khoản", ewallet: "Ví điện tử" }[method], date: getNow() });
    event.target.reset();
    closeModal("deposit-modal");
    updateBalance();
    renderTransactions();
    toast("Nạp tiền thành công!", "green");
  }

  function submitWithdraw(event) {
    event.preventDefault();
    const amount = Number(document.getElementById("withdraw-amount").value);
    const total = amount + 5000;
    if (total > walletBalance) {
      toast("Số dư không đủ!", "red");
      return;
    }
    walletBalance -= total;
    transactions.unshift({ type: "withdraw", amount: -total, method: "Rút tiền", date: getNow() });
    event.target.reset();
    closeModal("withdraw-modal");
    updateBalance();
    renderTransactions();
    toast("Rút tiền thành công!", "green");
  }

  function renderTransactions() {
    document.getElementById("transactions-list").innerHTML = transactions.map((tx) => {
      const income = tx.amount > 0;
      return `<div class="p-4 flex items-center gap-4"><div class="w-12 h-12 rounded-full ${income ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} flex items-center justify-center"><i data-lucide="${income ? "arrow-down-right" : "arrow-up-right"}" class="w-6 h-6"></i></div><div class="flex-1"><p class="font-semibold text-gray-800">${tx.method}</p><p class="text-sm text-gray-500">${tx.date}</p></div><p class="font-bold ${income ? "text-green-600" : "text-gray-800"}">${income ? "+" : ""}${tx.amount.toLocaleString("vi-VN")}đ</p></div>`;
    }).join("");
    refreshIcons();
  }

  function updateBalance() {
    document.getElementById("wallet-balance").textContent = `${walletBalance.toLocaleString("vi-VN")}đ`;
  }

  function initThemeControls() {
    renderColorPicker();
    document.querySelectorAll('input[name="theme"]').forEach((radio) => {
      radio.addEventListener("change", () => document.documentElement.classList.toggle("dark", radio.value === "dark"));
    });
    document.getElementById("font-smaller").addEventListener("click", () => setFontSize(fontSize - 2));
    document.getElementById("font-larger").addEventListener("click", () => setFontSize(fontSize + 2));
    document.getElementById("language-select").addEventListener("change", (event) => { document.documentElement.lang = event.target.value; });
  }

  function renderColorPicker() {
    const picker = document.getElementById("color-picker");
    picker.innerHTML = Object.entries(colors).map(([name, hex], index) => `<button class="color-swatch ${index === 0 ? "active" : ""}" data-color="${name}" style="background:${hex}" aria-label="Chọn màu ${name}"></button>`).join("");
    picker.addEventListener("click", (event) => {
      const swatch = event.target.closest("[data-color]");
      if (!swatch) return;
      setAccentColor(swatch.dataset.color);
      picker.querySelectorAll(".color-swatch").forEach((item) => item.classList.remove("active"));
      swatch.classList.add("active");
    });
  }

  function initActions() {
    document.addEventListener("click", (event) => {
      const el = event.target.closest("[data-action]");
      if (!el) return;
      const action = el.dataset.action;
      if (["support", "feedback", "help", "logout"].includes(action)) event.preventDefault();

      if (action === "register-service") {
        toast(`Đã chọn dịch vụ: ${el.dataset.service}`, "orange");
        showPage("booking");
      }
      if (action === "parking-detail") {
        showInfoModal("Chi tiết bãi gửi xe", `<p><strong>${el.dataset.lot}</strong></p><p>${el.dataset.address}</p><p>Sức chứa: ${el.dataset.capacity} xe</p><p>${el.dataset.hours}</p>`);
      }
      if (action === "support") {
        showInfoModal("Liên hệ hỗ trợ", "<p><strong>Hotline:</strong> 1900 1009</p><p><strong>Email:</strong> support@guixeonline.vn</p><p>Hỗ trợ 24/7 cho đặt chỗ, gửi xe và thanh toán.</p>");
      }
      if (action === "feedback") {
        showInfoModal("Gửi đơn ý kiến", '<label class="field">Nội dung góp ý<textarea rows="4" id="feedback-content" placeholder="Nhập ý kiến của bạn"></textarea></label><button type="button" class="primary-button" data-action="submit-feedback">Gửi ý kiến</button>');
      }
      if (action === "submit-feedback") {
        closeInfoModal();
        toast("Đã ghi nhận ý kiến của bạn.", "green");
      }
      if (action === "help") {
        showInfoModal("Trợ giúp", "<p>1. Chọn <strong>Xem bãi</strong> để xem danh sách bãi gửi xe.</p><p>2. Chọn <strong>Đặt chỗ</strong>, nhập loại xe, bãi đậu và thời gian.</p><p>3. Vào <strong>Ví tiền</strong> để nạp, rút và xem lịch sử giao dịch.</p>");
      }
      if (action === "logout") toast("Bạn đã chọn đăng xuất.", "orange");
      if (action === "change-password") {
        showInfoModal("Đổi mật khẩu", '<label class="field">Mật khẩu hiện tại<input type="password"></label><label class="field">Mật khẩu mới<input type="password"></label><button type="button" class="primary-button" data-action="save-password">Lưu mật khẩu</button>');
      }
      if (action === "save-password") {
        closeInfoModal();
        toast("Đã cập nhật mật khẩu.", "green");
      }
      if (action === "toggle-password") {
        const display = document.getElementById("password-display");
        const icon = el.querySelector("[data-lucide]");
        const visible = display.dataset.visible === "true";
        display.textContent = visible ? "••••••••••••" : "Abc@12345";
        display.dataset.visible = String(!visible);
        icon.setAttribute("data-lucide", visible ? "eye" : "eye-off");
        refreshIcons();
      }
    });
    document.addEventListener("change", (event) => {
      if (event.target.matches('[data-action="toggle-notification"]')) toast("Đã cập nhật cài đặt thông báo.", "green");
    });
  }

  function showInfoModal(title, html) {
    closeInfoModal();
    const modal = document.createElement("div");
    modal.id = "info-modal";
    modal.className = "modal";
    modal.innerHTML = `<div class="modal-panel"><button type="button" class="modal-close" data-action="close-info-modal"><i data-lucide="x"></i></button><h3 class="modal-title">${title}</h3><div class="info-modal-content">${html}</div></div>`;
    modal.addEventListener("click", (event) => { if (event.target === modal) closeInfoModal(); });
    document.body.appendChild(modal);
    modal.querySelector('[data-action="close-info-modal"]').addEventListener("click", closeInfoModal);
    refreshIcons();
  }

  function closeInfoModal() {
    const modal = document.getElementById("info-modal");
    if (modal) modal.remove();
  }

  function toast(message, color) {
    const note = document.createElement("div");
    note.className = `toast ${color || "orange"}`;
    note.textContent = message;
    document.body.appendChild(note);
    setTimeout(() => note.remove(), 2400);
  }

  function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
  }

  function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
  }

  function getNow() {
    const now = new Date();
    return `${now.toLocaleDateString("vi-VN")} ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  }

  function setAccentColor(name) {
    const accent = colors[name] || colors.orange;
    document.documentElement.style.setProperty("--accent", accent);
    document.documentElement.style.setProperty("--accent-dark", darken(accent, 18));
  }

  function setFontSize(size) {
    fontSize = Math.min(24, Math.max(12, size));
    document.documentElement.style.fontSize = `${fontSize}px`;
  }

  function darken(hex, amount) {
    const value = Number.parseInt(hex.slice(1), 16);
    const r = Math.max(0, (value >> 16) - amount);
    const g = Math.max(0, ((value >> 8) & 255) - amount);
    const b = Math.max(0, (value & 255) - amount);
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  }
})();
