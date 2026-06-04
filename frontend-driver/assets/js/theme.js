const colors = {
  orange: "#f97316",
  blue: "#3b82f6",
  red: "#ef4444",
  green: "#22c55e",
  purple: "#a855f7",
};

let fontSize = 16;

export function initThemeControls() {
  renderColorPicker();

  document.querySelectorAll('input[name="theme"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      document.documentElement.classList.toggle("dark", radio.value === "dark");
    });
  });

  document.getElementById("font-smaller").addEventListener("click", () => setFontSize(fontSize - 2));
  document.getElementById("font-larger").addEventListener("click", () => setFontSize(fontSize + 2));

  document.getElementById("language-select").addEventListener("change", (event) => {
    document.documentElement.lang = event.target.value;
  });
}

function renderColorPicker() {
  const picker = document.getElementById("color-picker");
  picker.innerHTML = Object.entries(colors).map(([name, hex], index) => `
    <button class="color-swatch ${index === 0 ? "active" : ""}" data-color="${name}" style="background:${hex}" aria-label="Chọn màu ${name}"></button>
  `).join("");

  picker.addEventListener("click", (event) => {
    const swatch = event.target.closest("[data-color]");
    if (!swatch) return;
    setAccentColor(swatch.dataset.color);
    picker.querySelectorAll(".color-swatch").forEach((item) => item.classList.remove("active"));
    swatch.classList.add("active");
  });
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
