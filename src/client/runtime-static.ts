import { SlideNavigator } from "./core/navigator";
import { setupViewUI } from "./core/view-ui";

document.addEventListener("DOMContentLoaded", () => {
  const navigator = new SlideNavigator();

  // Set up view UI enhancements (hover nav buttons, context menu)
  setupViewUI(navigator, { onNavigate: updateHash });

  // Get slide dimensions from CSS variables
  function getSlideDimensions() {
    const root = document.documentElement;
    const slideWidth = parseInt(getComputedStyle(root).getPropertyValue("--slide-width") || "1280");
    const slideHeight = parseInt(
      getComputedStyle(root).getPropertyValue("--slide-height") || "720",
    );
    return { slideWidth, slideHeight };
  }

  // Calculate and apply viewport scale immediately to prevent resize flicker
  function updateViewportScale() {
    const container = document.getElementById("slide-container");
    if (!container) return;

    const { slideWidth, slideHeight } = getSlideDimensions();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / slideWidth;
    const scaleY = viewportHeight / slideHeight;
    const scale = Math.min(scaleX, scaleY);

    // Apply scale directly as inline style to prevent CSS calculation delay
    container.style.transform = `scale(${scale})`;
    container.style.transformOrigin = "center center";
  }

  function updateHash() {
    window.location.hash = `#${navigator.currentIndex + 1}`;
  }

  // Handle hash changes
  function handleHash() {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= navigator.totalSlides) {
      if (index - 1 !== navigator.currentIndex) {
        navigator.goTo(index - 1);
      }
    }
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "Space":
      case "Enter":
      case "n":
        if (e.key === "Space") e.preventDefault();
        navigator.next();
        updateHash();
        break;
      case "ArrowLeft":
      case "p":
        navigator.prev();
        updateHash();
        break;
      case "Home":
        navigator.goTo(0);
        updateHash();
        break;
      case "End":
        navigator.goTo(navigator.totalSlides - 1);
        updateHash();
        break;
    }
  });

  // Initial load
  if (window.location.hash) {
    handleHash();
  } else {
    navigator.goTo(0);
    updateHash();
  }

  // Apply scale immediately and on resize with debouncing for performance
  updateViewportScale();

  let resizeTimeout: number;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(updateViewportScale, 16); // ~60fps
  });

  // Indicate JS is active after initial setup to avoid FOUC/blank screen
  document.body.classList.add("js-active");

  window.addEventListener("hashchange", handleHash);
});
