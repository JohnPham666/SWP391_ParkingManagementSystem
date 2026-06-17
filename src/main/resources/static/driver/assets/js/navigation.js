import { customerName, routes } from "./data.js";

const pages = () => document.querySelectorAll(".page");

export function initNavigation() {
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
    if (!menuButton.contains(event.target) && !menu.contains(event.target)) {
      menu.classList.add("hidden");
    }
  });
}

export function showPage(routeName) {
  const route = routes[routeName] || routes.home;
  pages().forEach((page) => page.classList.remove("active-page"));
  document.getElementById(route.pageId).classList.add("active-page");
  document.getElementById("user-menu").classList.add("hidden");
  updateHeader(routeName, route.title);
  window.scrollTo({ top: 0, behavior: "auto" });
  window.lucide?.createIcons();
}

function updateHeader(routeName, title) {
  const headerContent = document.getElementById("header-content");
  if (routeName === "home") {
    headerContent.innerHTML = `
      <h1 id="greeting" class="text-2xl font-bold">Xin chào, ${customerName}</h1>
      <p class="text-white/80 text-sm mt-1">Chào mừng bạn đến với hệ thống gửi xe thông minh</p>
    `;
    window.lucide?.createIcons();
    return;
  }

  headerContent.innerHTML = `<h1 class="text-2xl font-bold">${title}</h1>`;
  window.lucide?.createIcons();
}
