import { parkingSlots } from "./data.js";

export function initBooking() {
  const form = document.getElementById("booking-search-form");
  const searchButton = document.getElementById("search-slots-btn");
  const clearButton = document.getElementById("clear-booking-btn");
  const results = document.getElementById("booking-results");
  const empty = document.getElementById("no-results-message");
  const list = document.getElementById("slots-list");
  const success = document.getElementById("booking-success");

  searchButton.addEventListener("click", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;

    const lot = document.getElementById("booking-parking-lot").value;
    list.innerHTML = (parkingSlots[lot] || []).map((slot, index) => `
      <article class="panel hover:shadow-lg transition">
        <div class="flex justify-between items-start mb-3">
          <div><p class="font-bold text-lg text-gray-800">Chỗ ${slot.spot}</p><p class="text-sm text-gray-500">Tầng ${slot.level}</p></div>
          <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">Trống</span>
        </div>
        <div class="border-t border-gray-200 pt-3">
          <p class="text-orange-600 font-bold text-lg">${slot.price.toLocaleString("vi-VN")}đ</p>
          <p class="text-xs text-gray-500 mb-3">Giá cho một lần gửi</p>
          <button class="primary-button w-full" data-book-slot="${index}">Đặt chỗ này</button>
        </div>
      </article>
    `).join("");

    empty.classList.add("hidden");
    results.classList.remove("hidden");
    success.classList.add("hidden");
    window.lucide?.createIcons();
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

  clearButton.addEventListener("click", (event) => {
    event.preventDefault();
    form.reset();
    results.classList.add("hidden");
    success.classList.add("hidden");
    empty.classList.remove("hidden");
  });
}
