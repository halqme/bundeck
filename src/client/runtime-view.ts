/**
 * View-mode runtime for static builds (bundeck build).
 *
 * Sets up slide navigation, keyboard shortcuts, hash routing,
 * viewport scaling, and the view-mode UI extras (hover nav buttons,
 * context menu).
 */
import { createViewRuntime } from "./core/runtime-core.js";
import { setupViewUI } from "./core/view-ui.js";

document.addEventListener("DOMContentLoaded", () => {
  const { navigator } = createViewRuntime();

  // View-mode UI extras: hover nav buttons, context menu
  setupViewUI(navigator);
});
