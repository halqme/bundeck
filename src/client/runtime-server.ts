/**
 * Server-mode runtime (slide-bun serve).
 *
 * Serves the same HTML on two paths:
 *   /          → view mode (projector / audience screen)
 *   /presenter → presenter dashboard
 *
 * View mode and presenter mode communicate via BroadcastChannel
 * for slide synchronisation and laser-pointer relay.
 */
import { PresenterUI } from "./presenter/ui";
import { createViewRuntime } from "./core/runtime-core";
import { setupViewUI } from "./core/view-ui";
import {
  getSlideDimensions,
  computeSlideDisplayArea,
  clientToNormalized,
  normalizedToClient,
  calculateLaserPointerSize,
} from "./core/geometry";
import type { SyncMessage } from "../types";

// ─── Entry point ─────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get("role") === "preview";
  const isPresenter = window.location.pathname === "/presenter";

  // Broadcast channel (skip for preview iframes to avoid loops)
  let channel: BroadcastChannel | null = null;
  if (!isPreview) {
    try {
      channel = new BroadcastChannel("slide-bun-sync");
    } catch (e) {
      console.warn("BroadcastChannel is not supported — sync disabled:", e);
    }
  }

  // For the preview iframes we still need a full view runtime
  // (they display slides but don't sync).
  if (isPresenter) {
    if (!channel) {
      console.error("Presenter mode requires BroadcastChannel — sync will be unavailable");
    }
    setupPresenterMode(channel as BroadcastChannel | null);
  } else {
    // Client (view) mode — includes preview iframes and standalone windows
    setupViewMode(channel);
  }

  // HMR
  const evtSource = new EventSource("/_reload");
  evtSource.onmessage = (event) => {
    if (event.data === "reload") location.reload();
  };
});

// ─── View mode (projector / audience / preview iframe) ────────────

function setupViewMode(channel: BroadcastChannel | null) {
  // Shared runtime: navigator, keyboard, hash routing, viewport scaling
  const { navigator } = createViewRuntime({
    onSlideChange: (index) => {
      channel?.postMessage({ type: "navigate", index });
    },
  });

  // View-mode UI extras: hover nav buttons, context menu
  setupViewUI(navigator);

  // ── Laser pointer ────────────────────────────────────────────

  const laserPointer = createLaserPointerElement();
  document.body.appendChild(laserPointer);

  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let isActive = false;
  let animationFrameId: number | null = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  const INTERPOLATION = 0.2;
  const MAX_PACKET_AGE = 500;

  // Initial inactive state
  channel?.postMessage({
    type: "pointer",
    payload: { x: 0, y: 0, active: false, timestamp: Date.now() },
  } as SyncMessage);

  const updateLaserSize = () => {
    const { slideWidth, slideHeight } = getSlideDimensions();
    const size = calculateLaserPointerSize(slideWidth, slideHeight);
    laserPointer.style.width = `${size}px`;
    laserPointer.style.height = `${size}px`;
    laserPointer.style.boxShadow = `0 0 ${size * 2}px #ff000050, 0 0 ${size * 1.5}px #ff0000`;
  };
  updateLaserSize();

  const applyPointer = (nx: number, ny: number, active: boolean) => {
    const container = document.getElementById("slide-container");
    if (!container) return;
    const { slideWidth, slideHeight } = getSlideDimensions();
    const area = computeSlideDisplayArea(
      container.getBoundingClientRect(),
      slideWidth,
      slideHeight,
    );
    const pos = normalizedToClient(nx, ny, area);
    targetX = pos.x;
    targetY = pos.y;
    isActive = active;
  };

  if (channel) {
    channel.onmessage = (event) => {
      const msg = event.data as SyncMessage;
      if (msg.type === "navigate") {
        if (typeof msg.index === "number" && msg.index !== navigator.currentIndex) {
          navigator.goTo(msg.index, true);
        }
      } else if (msg.type === "pointer") {
        if (Date.now() - msg.payload.timestamp > MAX_PACKET_AGE) return;
        lastPointerX = msg.payload.x;
        lastPointerY = msg.payload.y;
        applyPointer(msg.payload.x, msg.payload.y, msg.payload.active);
      }
    };
  }

  // Re-apply pointer position after resize
  const onResize = () => {
    if (isActive) {
      applyPointer(lastPointerX, lastPointerY, true);
    }
    updateLaserSize();
  };
  window.addEventListener("resize", onResize);

  // Animation loop
  const animate = () => {
    currentX += (targetX - currentX) * INTERPOLATION;
    currentY += (targetY - currentY) * INTERPOLATION;
    laserPointer.style.left = `${currentX}px`;
    laserPointer.style.top = `${currentY}px`;
    laserPointer.style.opacity = isActive ? "1" : "0";
    animationFrameId = requestAnimationFrame(animate);
  };
  animationFrameId = requestAnimationFrame(animate);

  window.addEventListener("beforeunload", () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  });
}

function createLaserPointerElement(): HTMLElement {
  const el = document.createElement("div");
  el.id = "laser-pointer";
  Object.assign(el.style, {
    position: "fixed",
    borderRadius: "50%",
    backgroundColor: "#ff0000",
    pointerEvents: "none",
    zIndex: "9999",
    transform: "translate(-50%, -50%)",
    transition: "opacity 0.2s",
    opacity: "0",
    userSelect: "none",
  });
  return el;
}

// ─── Presenter mode (dashboard) ───────────────────────────────────

function setupPresenterMode(channel: BroadcastChannel | null) {
  // 1. Extract slides and notes from DOM before wiping it
  const slides = document.querySelectorAll<HTMLElement>(".slide");
  const totalSlides = slides.length;
  const notesMap: string[] = Array.from(slides).map((slide) => {
    const notes = slide.querySelector(".speaker-notes");
    return notes ? notes.innerHTML : "";
  });

  // 2. UI
  const ui = new PresenterUI();
  ui.mount();
  (window as any).__presenterUI = ui;

  // 3. State
  let currentIndex = 0;

  // Navigation functions (used by UI buttons and keyboard)
  const navigate = (index: number, shouldUpdateHash = true) => {
    const target = Math.max(0, Math.min(index, totalSlides - 1));
    if (target === currentIndex) return; // no-op for duplicate navigation
    currentIndex = target;
    ui.updateViews(target, totalSlides);
    ui.updateNotes(notesMap[target] || "");
    channel?.postMessage({ type: "navigate", index: target });
    if (shouldUpdateHash) updateHash(target);
  };

  const updateHash = (index: number) => {
    window.location.hash = `#${index + 1}`;
  };

  // Expose navigation to UI buttons
  (window as any).__navigateNext = () => navigate(currentIndex + 1);
  (window as any).__navigatePrevious = () => navigate(currentIndex - 1);

  // ── Keyboard ──
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

  // ── Laser pointer ──

  let isLaserPointerOn = false;
  let lastPointerSendTime = 0;
  const POINTER_INTERVAL = 33; // ~30 fps

  const sendPointerUpdate = (x: number, y: number, active: boolean) => {
    channel?.postMessage({
      type: "pointer",
      payload: { x, y, active, timestamp: Date.now() },
    } as SyncMessage);
  };

  const normalizePointer = (clientX: number, clientY: number) => {
    const frame = document.querySelector<HTMLIFrameElement>("#presenter-current iframe");
    if (!frame) return { x: 0.5, y: 0.5, valid: false };

    const { slideWidth, slideHeight } = getSlideDimensions();
    const area = computeSlideDisplayArea(frame.getBoundingClientRect(), slideWidth, slideHeight);
    const { x, y } = clientToNormalized(clientX, clientY, area);
    const valid = x >= 0 && x <= 1 && y >= 0 && y <= 1;
    return { x, y, valid };
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { x, y, valid } = normalizePointer(e.clientX, e.clientY);

    // Update presenter's own cursor overlay
    const presenterUI = (window as any).__presenterUI;
    if (presenterUI?.updateLaserPointerPosition) {
      presenterUI.updateLaserPointerPosition(x, y, valid && isLaserPointerOn);
    }

    if (isLaserPointerOn && valid) {
      const now = Date.now();
      if (now - lastPointerSendTime > POINTER_INTERVAL) {
        sendPointerUpdate(x, y, true);
        lastPointerSendTime = now;
      }
    }
  };

  const handleMouseLeave = () => {
    sendPointerUpdate(0, 0, false);
  };

  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseleave", handleMouseLeave);

  // Prevent text selection during laser interaction
  document.addEventListener("mousedown", () => {
    document.body.style.userSelect = "none";
  });
  document.addEventListener("mouseup", () => {
    document.body.style.userSelect = "";
  });

  const slideContainer = document.getElementById("slide-container");
  if (slideContainer) slideContainer.style.userSelect = "none";

  // Toggle laser pointer
  (window as any).__togglePresenterPointer = () => {
    isLaserPointerOn = !isLaserPointerOn;
    if (isLaserPointerOn) {
      const { x, y } = normalizePointer(window.innerWidth / 2, window.innerHeight / 2);
      sendPointerUpdate(x, y, true);
      lastPointerSendTime = Date.now();
    } else {
      sendPointerUpdate(0, 0, false);
    }
    const presenterUI = (window as any).__presenterUI;
    if (presenterUI?.updateLaserPointerStatus) {
      presenterUI.updateLaserPointerStatus(isLaserPointerOn);
    }
  };

  // ── Bidirectional sync ──
  const handleHash = () => {
    const hash = window.location.hash.substring(1);
    const idx = parseInt(hash, 10);
    if (!isNaN(idx) && idx >= 1 && idx <= totalSlides) {
      const target = idx - 1;
      if (target !== currentIndex) navigate(target, false);
    }
  };

  window.addEventListener("hashchange", handleHash);

  if (channel) {
    channel.onmessage = (event) => {
      const msg = event.data as SyncMessage;
      if (msg.type === "navigate" && typeof msg.index === "number" && msg.index !== currentIndex) {
        navigate(msg.index, false);
      }
    };
  }

  // ── Initialise from hash (after UI mount, via rAF) ──
  requestAnimationFrame(() => {
    const hash = window.location.hash.substring(1);
    const initialIndex = hash && parseInt(hash, 10) >= 1 ? parseInt(hash, 10) - 1 : 0;

    // Force initial render (bypass the equality check in navigate)
    currentIndex = initialIndex;
    ui.updateViews(initialIndex, totalSlides);
    ui.updateNotes(notesMap[initialIndex] || "");
    channel?.postMessage({ type: "navigate", index: initialIndex });
    updateHash(initialIndex);

    const presenterUI = (window as any).__presenterUI;
    if (presenterUI?.updateLaserPointerStatus) {
      presenterUI.updateLaserPointerStatus(false);
    }
  });
}
