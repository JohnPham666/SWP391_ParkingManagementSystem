import { showPage } from "./navigation.js";

export function initAppActions() {
  document.addEventListener("click", (event) => {
    const actionElement = event.target.closest("[data-action]");
    if (!actionElement) return;

    const action = actionElement.dataset.action;
    if (["support", "feedback", "help", "logout"].includes(action)) event.preventDefault();

    if (action === "register-service") {
      toast(`Đã chọn dịch vụ: ${actionElement.dataset.service}`, "orange");
      showPage("booking");
    }

    if (action === "parking-detail") {
      showInfoModal("Chi tiết bãi gửi xe", `
        <p><strong>${actionElement.dataset.lot}</strong></p>
        <p><i data-lucide="map-pin" class="inline w-4 h-4 text-orange-500"></i> ${actionElement.dataset.address}</p>
        <p><i data-lucide="car" class="inline w-4 h-4 text-orange-500"></i> Sức chứa: ${actionElement.dataset.capacity} xe</p>
        <p><i data-lucide="clock" class="inline w-4 h-4 text-orange-500"></i> ${actionElement.dataset.hours}</p>
      `);
    }

    if (action === "support") {
      showInfoModal("Liên hệ hỗ trợ", `
        <p><strong>Hotline:</strong> 1900 1009</p>
        <p><strong>Email:</strong> support@guixeonline.vn</p>
        <p>Thời gian hỗ trợ: 24/7 cho các sự cố gửi xe và thanh toán.</p>
      `);
    }

    if (action === "feedback") {
      showInfoModal("Gửi đơn ý kiến", `
        <label class="field">Nội dung góp ý
          <textarea rows="4" id="feedback-content" placeholder="Nhập ý kiến của bạn"></textarea>
        </label>
        <button type="button" class="primary-button" data-action="submit-feedback">Gửi ý kiến</button>
      `);
    }

    if (action === "submit-feedback") {
      closeInfoModal();
      toast("Đã ghi nhận ý kiến của bạn.", "green");
    }

    if (action === "help") {
      showInfoModal("Trợ giúp", `
        <p>1. Chọn <strong>Xem bãi</strong> để xem danh sách bãi gửi xe.</p>
        <p>2. Chọn <strong>Đặt chỗ</strong>, nhập loại xe, bãi đậu và thời gian.</p>
        <p>3. Vào <strong>Ví tiền</strong> để nạp, rút và xem lịch sử giao dịch.</p>
      `);
    }

    if (action === "logout") {
      toast("Bạn đã chọn đăng xuất.", "orange");
    }

    if (action === "change-password") {
      showInfoModal("Đổi mật khẩu", `
        <label class="field">Mật khẩu hiện tại <input type="password"></label>
        <label class="field">Mật khẩu mới <input type="password"></label>
        <button type="button" class="primary-button" data-action="save-password">Lưu mật khẩu</button>
      `);
    }

    if (action === "save-password") {
      closeInfoModal();
      toast("Đã cập nhật mật khẩu.", "green");
    }

    if (action === "toggle-password") {
      const display = document.getElementById("password-display");
      const icon = actionElement.querySelector("[data-lucide]");
      const visible = display.dataset.visible === "true";
      display.textContent = visible ? "••••••••••••" : "Abc@12345";
      display.dataset.visible = String(!visible);
      icon.setAttribute("data-lucide", visible ? "eye" : "eye-off");
      window.lucide?.createIcons();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches('[data-action="toggle-notification"]')) {
      toast("Đã cập nhật cài đặt thông báo.", "green");
    }
  });
}

export function toast(message, color = "orange") {
  const note = document.createElement("div");
  note.className = `toast ${color}`;
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 2400);
}

function showInfoModal(title, html) {
  closeInfoModal();
  const modal = document.createElement("div");
  modal.id = "info-modal";
  modal.className = "modal";
  modal.innerHTML = `
    <div class="modal-panel">
      <button type="button" class="modal-close" data-action="close-info-modal"><i data-lucide="x"></i></button>
      <h3 class="modal-title">${title}</h3>
      <div class="info-modal-content">${html}</div>
    </div>
  `;
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeInfoModal();
  });
  document.body.appendChild(modal);
  document.querySelector('[data-action="close-info-modal"]').addEventListener("click", closeInfoModal);
  window.lucide?.createIcons();
}

function closeInfoModal() {
  document.getElementById("info-modal")?.remove();
}
