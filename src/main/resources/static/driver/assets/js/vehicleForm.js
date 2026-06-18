import { showPage } from "./navigation.js";

export function initVehicleForm() {
  const form = document.getElementById("vehicle-registration-form");
  const cancelButton = document.getElementById("cancel-registration");
  const success = document.getElementById("form-success");

  form.querySelectorAll('input[type="file"]').forEach((input) => {
    input.addEventListener("change", () => {
      const status = input.parentElement.querySelector("span");
      status.textContent = input.files.length ? `✓ ${input.files[0].name}` : "";
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    success.classList.remove("hidden");
    form.querySelectorAll("input, select, textarea, button").forEach((element) => {
      if (element.type !== "button") element.disabled = true;
    });

    setTimeout(() => {
      resetForm(form, success);
      showPage("home");
    }, 2500);
  });

  cancelButton.addEventListener("click", () => {
    resetForm(form, success);
    showPage("home");
  });
}

function resetForm(form, success) {
  form.reset();
  success.classList.add("hidden");
  form.querySelectorAll(".upload-box span").forEach((span) => {
    span.textContent = "";
  });
  form.querySelectorAll("input, select, textarea, button").forEach((element) => {
    element.disabled = false;
  });
}
