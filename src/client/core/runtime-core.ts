import { SlideNavigator } from "./navigator";
import { getSlideDimensions } from "./geometry";

export interface ViewRuntimeOptions {
  /**
   * Called on every slide change (after navigator.goTo).
   * In server mode this also broadcasts via BroadcastChannel.
   * When absent, the hash is still updated internally.
   */
  onSlideChange?: (index: number) => void;
}

export interface ViewRuntime {
  navigator: SlideNavigator;
  destroy: () => void;
}

/**
 * Create and wire up the complete view-mode runtime:
 *  - SlideNavigator  (slide switching, text scaling, container transform)
 *  - Keyboard navigation (← → Space Home End …)
 *  - Hash‑based routing (initial load + hashchange)
 *  - Viewport scaling on resize
 *  - FOUC prevention via `js-active` class
 */
export function createViewRuntime(options: ViewRuntimeOptions = {}): ViewRuntime {
  function updateHash(index: number) {
    window.location.hash = `#${index + 1}`;
  }

  const navigator = new SlideNavigator({
    onSlideChange: (index) => {
      updateHash(index);
      options.onSlideChange?.(index);
    },
  });

  // --- Viewport scaling ---
  function updateViewportScale() {
    const container = document.getElementById("slide-container");
    if (!container) return;

    const { slideWidth, slideHeight } = getSlideDimensions();
    const scaleX = window.innerWidth / slideWidth;
    const scaleY = window.innerHeight / slideHeight;
    const scale = Math.min(scaleX, scaleY);

    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = "center center";
  }

  // --- Hash routing ---
  function handleHash() {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= navigator.totalSlides) {
      if (index - 1 !== navigator.currentIndex) {
        navigator.goTo(index - 1);
      }
    }
  }

  // --- Keyboard navigation ---
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "Space":
      case "Enter":
      case "n":
        if (e.key === "Space") e.preventDefault();
        navigator.next();
        break;
      case "ArrowLeft":
      case "p":
        navigator.prev();
        break;
      case "Home":
        navigator.goTo(0);
        break;
      case "End":
        navigator.goTo(navigator.totalSlides - 1);
        break;
    }
  });

  // --- Initialise from URL hash, or start at first slide ---
  if (window.location.hash) {
    handleHash();
  } else {
    navigator.goTo(0);
  }

  // --- Resize handling (debounced) ---
  updateViewportScale();

  let resizeTimeout: ReturnType<typeof setTimeout> | undefined;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(updateViewportScale, 16);
  });

  // --- FOUC prevention ---
  document.body.classList.add("js-active");

  // --- Hash change listener ---
  window.addEventListener("hashchange", handleHash);

  return {
    navigator,
    destroy() {
      navigator.destroy();
      window.removeEventListener("hashchange", handleHash);
    },
  };
}
