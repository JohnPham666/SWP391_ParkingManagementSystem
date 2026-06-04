import { initAppActions } from "./actions.js";
import { initBooking } from "./booking.js";
import { initNavigation } from "./navigation.js";
import { renderStaticContent } from "./render.js";
import { initThemeControls } from "./theme.js";
import { initVehicleForm } from "./vehicleForm.js";
import { initWallet } from "./wallet.js";

renderStaticContent();
initNavigation();
initBooking();
initVehicleForm();
initWallet();
initThemeControls();
initAppActions();

window.lucide?.createIcons();
