let walletBalance = 2500000;
let transactions = [
  { type: "deposit", amount: 500000, method: "Chuyển khoản", date: "2024-12-15 14:30" },
  { type: "spend", amount: -150000, method: "Gửi xe", date: "2024-12-14 10:15" },
  { type: "withdraw", amount: -200000, method: "Rút tiền", date: "2024-12-13 16:45" },
  { type: "deposit", amount: 300000, method: "Thẻ tín dụng", date: "2024-12-12 09:20" },
];

export function initWallet() {
  renderTransactions();
  updateBalance();

  document.getElementById("deposit-btn").addEventListener("click", () => openModal("deposit-modal"));
  document.getElementById("withdraw-btn").addEventListener("click", () => openModal("withdraw-modal"));
  document.getElementById("history-btn").addEventListener("click", () => document.getElementById("transactions-list").scrollIntoView({ behavior: "smooth" }));

  document.querySelectorAll("[data-close-modal]").forEach((button) => {
    button.addEventListener("click", () => closeModal(button.dataset.closeModal));
  });

  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeModal(modal.id);
    });
  });

  document.getElementById("deposit-form").addEventListener("submit", submitDeposit);
  document.getElementById("withdraw-form").addEventListener("submit", submitWithdraw);
}

function submitDeposit(event) {
  event.preventDefault();
  const amount = Number(document.getElementById("deposit-amount").value);
  const method = document.getElementById("deposit-method").value;
  if (!amount || !method) return;

  walletBalance += amount;
  transactions.unshift({ type: "deposit", amount, method: labelPayment(method), date: getNow() });
  event.target.reset();
  closeModal("deposit-modal");
  updateBalance();
  renderTransactions();
  toast("Nạp tiền thành công!", "green");
}

function submitWithdraw(event) {
  event.preventDefault();
  const amount = Number(document.getElementById("withdraw-amount").value);
  const bank = document.getElementById("withdraw-bank").value;
  const total = amount + 5000;
  if (!amount || !bank) return;
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
  const list = document.getElementById("transactions-list");
  list.innerHTML = transactions.map((tx) => {
    const income = tx.amount > 0;
    const icon = income ? "arrow-down-right" : "arrow-up-right";
    return `
      <div class="p-4 flex items-center gap-4">
        <div class="w-12 h-12 rounded-full ${income ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"} flex items-center justify-center"><i data-lucide="${icon}" class="w-6 h-6"></i></div>
        <div class="flex-1"><p class="font-semibold text-gray-800">${tx.method}</p><p class="text-sm text-gray-500">${tx.date}</p></div>
        <p class="font-bold ${income ? "text-green-600" : "text-gray-800"}">${income ? "+" : ""}${tx.amount.toLocaleString("vi-VN")}đ</p>
      </div>
    `;
  }).join("");
  window.lucide?.createIcons();
}

function updateBalance() {
  document.getElementById("wallet-balance").textContent = `${walletBalance.toLocaleString("vi-VN")}đ`;
}

function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

function labelPayment(method) {
  return { card: "Thẻ tín dụng", bank: "Chuyển khoản", ewallet: "Ví điện tử" }[method] || method;
}

function getNow() {
  const now = new Date();
  return `${now.toLocaleDateString("vi-VN")} ${now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
}

function toast(message, color) {
  const note = document.createElement("div");
  note.className = `fixed top-4 right-4 z-[60] text-white px-6 py-3 rounded-lg shadow-lg ${color === "red" ? "bg-red-500" : "bg-green-500"}`;
  note.textContent = message;
  document.body.appendChild(note);
  setTimeout(() => note.remove(), 2500);
}
