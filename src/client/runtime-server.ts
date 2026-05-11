import { SlideNavigator } from "./core/navigator";
import { PresenterUI } from "./presenter/ui";
import { setupViewUI } from "./core/view-ui";
import type { SyncMessage } from "../types";

// Get slide dimensions from CSS variables
function getSlideDimensions() {
  const root = document.documentElement;
  const slideWidth = parseInt(getComputedStyle(root).getPropertyValue("--slide-width") || "1280");
  const slideHeight = parseInt(getComputedStyle(root).getPropertyValue("--slide-height") || "720");
  return { slideWidth, slideHeight };
}

document.addEventListener("DOMContentLoaded", () => {
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

  // Apply scale immediately and on resize with debouncing for performance
  updateViewportScale();

  let resizeTimeout: number;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = window.setTimeout(updateViewportScale, 16); // ~60fps
  });

  // Check for preview role
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get("role") === "preview";

  // Sync setup
  // If preview, we don't sync. Otherwise we join the channel.
  let channel: BroadcastChannel | null = null;
  if (!isPreview) {
    try {
      channel = new BroadcastChannel("slide-bun-sync");
    } catch (e) {
      console.warn("BroadcastChannel not supported or failed to initialize:", e);
    }
  }

  // Determine if we are in presenter mode
  const isPresenter = window.location.pathname === "/presenter";

  if (isPresenter) {
    // Presenter mode requires channel to control others
    if (channel) {
      setupPresenterMode(channel);
    } else {
      // Fallback or error if channel is critical for presenter?
      // But we should probably just show UI without sync if channel failed.
      console.error("Presenter mode requires BroadcastChannel support.");
      // We can still try to setup UI but it won't control anything
      setupPresenterMode(channel as any); // Type cast or handle null inside
    }
  } else {
    setupClientMode(channel);
  }

  // HMR Client (Shared)
  const evtSource = new EventSource("/_reload");
  evtSource.onmessage = (event) => {
    if (event.data === "reload") {
      location.reload();
    }
  };
});

function setupClientMode(channel: BroadcastChannel | null) {
  const navigator = new SlideNavigator({
    onSlideChange: (index) => {
      // Broadcast change only if channel exists
      if (channel) {
        channel.postMessage({ type: "navigate", index });
      }
      updateHash(index);
    },
  });

  // Set up view UI enhancements (hover nav buttons, context menu)
  setupViewUI(navigator);

  // Laser pointer state and rendering
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isActive = false;
  let animationFrameId: number | null = null;
  const interpolationFactor = 0.2; // Smoothing factor
  const maxPacketAge = 500; // Max age of packets in ms

  // Function to calculate laser pointer size based on viewport scale
  function calculateLaserPointerSize(): number {
    const { slideWidth, slideHeight } = getSlideDimensions();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const scaleX = viewportWidth / slideWidth;
    const scaleY = viewportHeight / slideHeight;
    const scale = Math.min(scaleX, scaleY);

    // Base size in pixels (relative to original slide dimensions)
    const baseSize = 12; // Base size in viewport pixels
    const scaledSize = baseSize * scale;

    // Ensure minimum and maximum sizes for usability
    return Math.max(6, Math.min(scaledSize, 30));
  }

  // Function to update laser pointer size
  function updateLaserPointerSize() {
    const size = calculateLaserPointerSize();
    laserPointer.style.width = `${size}px`;
    laserPointer.style.height = `${size}px`;
    laserPointer.style.boxShadow = `0 0 ${size * 2}px #ff000050, 0 0 ${size * 1.5}px #ff0000`;
  }

  // Create laser pointer element
  const laserPointer = document.createElement("div");
  laserPointer.id = "laser-pointer";
  laserPointer.style.position = "fixed";
  laserPointer.style.borderRadius = "50%";
  laserPointer.style.backgroundColor = "#ff0000";
  laserPointer.style.pointerEvents = "none";
  laserPointer.style.zIndex = "9999";
  laserPointer.style.transform = "translate(-50%, -50%)";
  laserPointer.style.transition = "opacity 0.2s";
  laserPointer.style.opacity = "0"; // Initially hidden
  laserPointer.style.userSelect = "none";

  // Set initial size
  updateLaserPointerSize();

  document.body.appendChild(laserPointer);

  // Send initial laser pointer state (inactive) to clear any existing pointer
  if (channel) {
    channel.postMessage({
      type: "pointer",
      payload: { x: 0, y: 0, active: false, timestamp: Date.now() },
    } as SyncMessage);
  }

  function updateHash(index: number) {
    window.location.hash = `#${index + 1}`;
  }

  // Interpolation function
  const interpolate = (start: number, end: number, factor: number): number => {
    return start + (end - start) * factor;
  };

  // Main animation loop for smooth pointer movement
  const animatePointer = () => {
    // Update position using interpolation
    currentX = interpolate(currentX, targetX, interpolationFactor);
    currentY = interpolate(currentY, targetY, interpolationFactor);

    // Update the laser pointer position
    laserPointer.style.left = `${currentX}px`;
    laserPointer.style.top = `${currentY}px`;

    // Show/hide based on active state
    laserPointer.style.opacity = isActive ? "1" : "0";

    // Continue the animation loop
    animationFrameId = requestAnimationFrame(animatePointer);
  };

  // Listen for sync events
  if (channel) {
    channel.onmessage = (event) => {
      const message = event.data as SyncMessage;

      if (message.type === "navigate") {
        const index = message.index;
        if (typeof index === "number" && index !== navigator.currentIndex) {
          // Go to slide but suppress callback to avoid loop
          navigator.goTo(index, true);
          updateHash(index);
        }
      } else if (message.type === "pointer") {
        // Check if packet is too old
        const now = Date.now();
        if (now - message.payload.timestamp > maxPacketAge) {
          return; // Ignore stale packet
        }

        // Store the coordinates for potential resize updates
        lastPointerX = message.payload.x;
        lastPointerY = message.payload.y;

        // Update target position based on normalized coordinates
        const slideContainer = document.getElementById("slide-container");
        if (slideContainer) {
          const containerRect = slideContainer.getBoundingClientRect();

          // Get slide dimensions from CSS variables
          const { slideWidth, slideHeight } = getSlideDimensions();
          const slideAspectRatio = slideWidth / slideHeight;

          // Calculate the actual slide display area (letterboxed if needed)
          const containerAspectRatio = containerRect.width / containerRect.height;

          let actualSlideWidth: number;
          let actualSlideHeight: number;
          let slideOffsetX: number;
          let slideOffsetY: number;

          if (containerAspectRatio > slideAspectRatio) {
            // Container is wider - slide is constrained by height
            actualSlideHeight = containerRect.height;
            actualSlideWidth = actualSlideHeight * slideAspectRatio;
            slideOffsetX = (containerRect.width - actualSlideWidth) / 2;
            slideOffsetY = 0;
          } else {
            // Container is taller - slide is constrained by width
            actualSlideWidth = containerRect.width;
            actualSlideHeight = actualSlideWidth / slideAspectRatio;
            slideOffsetX = 0;
            slideOffsetY = (containerRect.height - actualSlideHeight) / 2;
          }

          // Convert normalized coordinates to screen coordinates
          targetX = containerRect.left + slideOffsetX + message.payload.x * actualSlideWidth;
          targetY = containerRect.top + slideOffsetY + message.payload.y * actualSlideHeight;
          isActive = message.payload.active;
        }
      }
    };

    // Add debug logging for outgoing messages
    const originalPostMessage = channel.postMessage;
    channel.postMessage = function (message) {
      originalPostMessage.call(this, message);
    };
  }

  // Store the last received coordinates to use when recalculating after resize
  let lastPointerX = 0;
  let lastPointerY = 0;

  // Update laser pointer position when viewport changes (due to resize, etc.)
  function updateLaserPointerPosition() {
    const slideContainer = document.getElementById("slide-container");
    if (slideContainer && isActive) {
      const containerRect = slideContainer.getBoundingClientRect();

      // Get slide dimensions from CSS variables
      const { slideWidth, slideHeight } = getSlideDimensions();
      const slideAspectRatio = slideWidth / slideHeight;

      // Calculate the actual slide display area (letterboxed if needed)
      const containerAspectRatio = containerRect.width / containerRect.height;

      let actualSlideWidth: number;
      let actualSlideHeight: number;
      let slideOffsetX: number;
      let slideOffsetY: number;

      if (containerAspectRatio > slideAspectRatio) {
        // Container is wider - slide is constrained by height
        actualSlideHeight = containerRect.height;
        actualSlideWidth = actualSlideHeight * slideAspectRatio;
        slideOffsetX = (containerRect.width - actualSlideWidth) / 2;
        slideOffsetY = 0;
      } else {
        // Container is taller - slide is constrained by width
        actualSlideWidth = containerRect.width;
        actualSlideHeight = actualSlideWidth / slideAspectRatio;
        slideOffsetX = 0;
        slideOffsetY = (containerRect.height - actualSlideHeight) / 2;
      }

      // Recalculate position using stored normalized coordinates
      targetX = containerRect.left + slideOffsetX + lastPointerX * actualSlideWidth;
      targetY = containerRect.top + slideOffsetY + lastPointerY * actualSlideHeight;
    }
  }

  // Add resize listener to adjust laser pointer position and size
  window.addEventListener("resize", () => {
    updateLaserPointerPosition();
    updateLaserPointerSize();
  });

  // Start the animation loop
  animationFrameId = requestAnimationFrame(animatePointer);

  // Handle hash changes
  function handleHash() {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= navigator.totalSlides) {
      if (index - 1 !== navigator.currentIndex) {
        // If hash changes manually, we treat it like a nav event (broadcast)
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

  // Initialize
  if (window.location.hash) {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= navigator.totalSlides) {
      // Force rendering on initial load even if index is 0
      navigator.goTo(index - 1);
    } else {
      navigator.goTo(0);
      updateHash(0);
    }
  } else {
    navigator.goTo(0);
    updateHash(0);
  }

  // Indicate JS is active after initial setup
  document.body.classList.add("js-active");

  // Clean up animation frame on page unload
  window.addEventListener("beforeunload", () => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  });

  window.addEventListener("hashchange", handleHash);
}

function setupPresenterMode(channel: BroadcastChannel | null) {
  // 1. Extract Data from DOM before wiping it
  const slides = document.querySelectorAll<HTMLElement>(".slide");
  const totalSlides = slides.length;
  const notesMap: string[] = [];

  slides.forEach((slide) => {
    const notes = slide.querySelector(".speaker-notes");
    if (notes) {
      notesMap.push(notes.innerHTML);
    } else {
      notesMap.push("");
    }
  });

  // 2. Initialize UI
  const ui = new PresenterUI();
  ui.mount();

  // Store reference to UI globally so it can be accessed by event handlers
  (window as any).__presenterUI = ui;

  // Store navigation functions globally for UI buttons
  (window as any).__navigateNext = () => {
    navigate(currentIndex + 1);
  };

  (window as any).__navigatePrevious = () => {
    navigate(currentIndex - 1);
  };

  // 3. State
  let currentIndex = 0;

  // Pointer state
  let isPointerActive = false; // Whether the mouse is currently over the slide
  let isLaserPointerOn = false; // Whether the laser pointer is turned on
  let lastPointerSendTime = 0;
  const pointerSendInterval = 33; // ~30fps (33ms interval)

  // 4. Methods
  const update = (index: number) => {
    currentIndex = index;
    console.log("update called:", { index, currentIndex });
    ui.updateViews(index, totalSlides);
    ui.updateNotes(notesMap[index] || "");
  };

  // 5. Interaction
  // In presenter mode, we control the remote slides via broadcast
  const navigate = (index: number, shouldUpdateHash: boolean = true) => {
    const target = Math.max(0, Math.min(index, totalSlides - 1));
    console.log("navigate called:", { index, target, currentIndex, shouldUpdateHash });
    if (target !== currentIndex) {
      update(target);
      if (channel) {
        channel.postMessage({ type: "navigate", index: target });
      }
      if (shouldUpdateHash) {
        updateHash(target);
      }
    } else {
      console.log("target === currentIndex, calling update anyway");
      update(target); // 最初の初期化のため、同じでもupdateを呼ぶ
      if (shouldUpdateHash) {
        updateHash(target);
      }
    }
  };

  // Hash update helper
  const updateHash = (index: number) => {
    window.location.hash = `#${index + 1}`;
  };

  // Handle hash changes for bidirectional sync
  const handleHash = () => {
    const hash = window.location.hash.substring(1);
    const index = parseInt(hash, 10);
    if (!isNaN(index) && index >= 1 && index <= totalSlides) {
      const targetIndex = index - 1;
      if (targetIndex !== currentIndex) {
        navigate(targetIndex, false); // Don't update hash to avoid loop
      }
    }
  };

  // Send pointer position to clients
  const sendPointerUpdate = (x: number, y: number, active: boolean) => {
    if (!channel) return;

    const payload = {
      x,
      y,
      active,
      timestamp: Date.now(),
    };

    channel.postMessage({ type: "pointer", payload } as SyncMessage);
  };

  // Normalize coordinates to 0-1 range based on the actual slide display area
  const normalizeCoordinates = (clientX: number, clientY: number) => {
    // In presenter mode, we need to calculate the actual slide display area
    // The slide is scaled to fit within the iframe in #presenter-current while maintaining aspect ratio
    const currentView = document.getElementById("presenter-current");
    const currentFrame = document.querySelector("#presenter-current iframe") as HTMLIFrameElement;

    if (!currentView || !currentFrame) return { x: 0, y: 0, valid: false };

    // Get the iframe rect (this is where the slide is actually displayed)
    const frameRect = currentFrame.getBoundingClientRect();

    // Get slide dimensions from CSS variables
    const { slideWidth, slideHeight } = getSlideDimensions();
    const slideAspectRatio = slideWidth / slideHeight;

    // Calculate the actual slide display area within the iframe (letterboxed if needed)
    const frameAspectRatio = frameRect.width / frameRect.height;

    let actualSlideWidth: number;
    let actualSlideHeight: number;
    let slideOffsetX: number;
    let slideOffsetY: number;

    if (frameAspectRatio > slideAspectRatio) {
      // Frame is wider - slide is constrained by height
      actualSlideHeight = frameRect.height;
      actualSlideWidth = actualSlideHeight * slideAspectRatio;
      slideOffsetX = (frameRect.width - actualSlideWidth) / 2;
      slideOffsetY = 0;
    } else {
      // Frame is taller - slide is constrained by width
      actualSlideWidth = frameRect.width;
      actualSlideHeight = actualSlideWidth / slideAspectRatio;
      slideOffsetX = 0;
      slideOffsetY = (frameRect.height - actualSlideHeight) / 2;
    }

    // Calculate position relative to the actual slide display area within the iframe
    const relativeX = clientX - frameRect.left - slideOffsetX;
    const relativeY = clientY - frameRect.top - slideOffsetY;

    // Normalize to 0-1 range
    const x = relativeX / actualSlideWidth;
    const y = relativeY / actualSlideHeight;

    // Check if coordinates are within the actual slide bounds
    const valid = x >= 0 && x <= 1 && y >= 0 && y <= 1;

    // Clamp values to 0-1 range
    const clampedX = Math.max(0, Math.min(1, x));
    const clampedY = Math.max(0, Math.min(1, y));

    return { x: clampedX, y: clampedY, valid };
  };

  // Handle mouse movement
  const handleMouseMove = (e: MouseEvent) => {
    const { x, y, valid } = normalizeCoordinates(e.clientX, e.clientY);

    // Update the active state based on whether the mouse is over the slide
    isPointerActive = valid;

    // Update the local laser pointer position in presenter UI
    const presenterUI = (window as any).__presenterUI;
    if (presenterUI && presenterUI.updateLaserPointerPosition) {
      presenterUI.updateLaserPointerPosition(x, y, valid && isLaserPointerOn);
    }

    // Send to clients when laser pointer is on
    if (isLaserPointerTurnedOn()) {
      // Throttle sending to avoid flooding the channel
      const now = Date.now();
      if (now - lastPointerSendTime > pointerSendInterval) {
        sendPointerUpdate(x, y, valid);
        lastPointerSendTime = now;
      }
    }
  };

  // Helper function to check if laser pointer is on
  function isLaserPointerTurnedOn(): boolean {
    // Check if the laser pointer is currently turned on
    return isLaserPointerOn;
  }

  // Handle mouse leaving the slide area
  const handleMouseLeave = () => {
    if (isPointerActive) {
      isPointerActive = false;
      sendPointerUpdate(0, 0, false); // Send inactive state
    }
  };

  // Global function to toggle laser pointer from UI
  (window as any).__togglePresenterPointer = () => {
    const previousState = isLaserPointerOn;
    isLaserPointerOn = !isLaserPointerOn;

    // Only proceed if the state actually changed
    if (previousState !== isLaserPointerOn) {
      if (isLaserPointerOn) {
        // For UI-triggered toggle, we don't need to validate coordinates
        // Just send the activation signal with center coordinates
        const slideElement = document.querySelector(".slide");
        let centerX = window.innerWidth / 2;
        let centerY = window.innerHeight / 2;

        // Try to get slide center if available
        if (slideElement) {
          const rect = slideElement.getBoundingClientRect();
          centerX = rect.left + rect.width / 2;
          centerY = rect.top + rect.height / 2;
        }

        const { x, y } = normalizeCoordinates(centerX, centerY);

        // Send pointer update regardless of validity for UI-triggered toggle
        sendPointerUpdate(x, y, true);
        lastPointerSendTime = Date.now();
      } else if (!isLaserPointerOn) {
        sendPointerUpdate(0, 0, false);
      }

      // Update the UI to reflect the laser pointer state
      const presenterUI = (window as any).__presenterUI;
      if (presenterUI && presenterUI.updateLaserPointerStatus) {
        presenterUI.updateLaserPointerStatus(isLaserPointerOn);
      }
    }
  };

  // Keyboard event handlers already defined above, no need to redefine navigate

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
      case "Space":
      case "Enter":
      case "n":
        if (e.key === "Space") e.preventDefault();
        navigate(currentIndex + 1);
        break;
      case "ArrowLeft":
      case "p":
        navigate(currentIndex - 1);
        break;
      case "Home":
        navigate(0);
        break;
      case "End":
        navigate(totalSlides - 1);
        break;
    }
  });

  // Add pointer event listeners to the document for laser pointer
  // In presenter mode, we need to listen to events on the document
  // and determine if the mouse is over the slide area
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseleave", handleMouseLeave);

  // Prevent text selection during laser pointer interaction
  document.addEventListener("mousedown", () => {
    document.body.style.userSelect = "none";
  });

  document.addEventListener("mouseup", () => {
    document.body.style.userSelect = "";
  });

  // Also prevent selection on the slide container itself
  const slideContainerForSelection = document.getElementById("slide-container");
  if (slideContainerForSelection) {
    slideContainerForSelection.style.userSelect = "none";
  }

  // Listen to sync from client (if user navigates on the projector view)
  if (channel) {
    channel.onmessage = (event) => {
      const message = event.data as SyncMessage;
      if (message.type === "navigate") {
        const index = message.index;
        if (typeof index === "number" && index !== currentIndex) {
          navigate(index, false); // Don't update hash for client-initiated changes
        }
      }
    };

    // Add debug logging for outgoing messages
    const originalPostMessage = channel.postMessage;
    channel.postMessage = function (message) {
      originalPostMessage.call(this, message);
    };
  }

  // Handle hash changes on the presenter window
  window.addEventListener("hashchange", handleHash);

  // Handle hash changes on the presenter window
  window.addEventListener("hashchange", handleHash);

  // Initialize from hash if present, but wait for UI to be ready
  setTimeout(() => {
    const hash = window.location.hash.substring(1);
    const initialIndex = hash && parseInt(hash, 10) >= 1 ? parseInt(hash, 10) - 1 : 0;

    if (window.location.hash) {
      navigate(initialIndex, true); // Navigate to the hash-indexed slide and update hash
    } else {
      navigate(0, true); // Navigate to first slide and update hash
    }

    // Initialize laser pointer state in UI
    const presenterUI = (window as any).__presenterUI;
    if (presenterUI && presenterUI.updateLaserPointerStatus) {
      presenterUI.updateLaserPointerStatus(false);
    }
  }, 100); // Slight delay to ensure UI is fully loaded
}
