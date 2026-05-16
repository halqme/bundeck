/**
 * Server-mode runtime (bundeck serve).
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
import { setupViewUI, addContextMenuItem, openPresenterMode } from "./core/view-ui";
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
      channel = new BroadcastChannel("bundeck-sync");
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
  // Add presenter mode option to context menu (only available in server mode)
  addContextMenuItem("プレゼンターモードを開く", () => openPresenterMode());

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

  channel?.postMessage({ type: "pointer", x: 0, y: 0, active: false } as SyncMessage);

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
    if (!container) {
      console.warn("[bundeck:view] applyPointer: #slide-container not found");
      return;
    }
    const { slideWidth, slideHeight } = getSlideDimensions();
    const area = computeSlideDisplayArea(
      container.getBoundingClientRect(),
      slideWidth,
      slideHeight,
    );
    const pos = normalizedToClient(nx, ny, area);
    console.log(
      `[bundeck:view] applyPointer: normalized=(${nx.toFixed(3)}, ${ny.toFixed(3)}), active=${active}, pixel=(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}), area={left:${area.left.toFixed(1)}, top:${area.top.toFixed(1)}, w:${area.width.toFixed(1)}, h:${area.height.toFixed(1)}}`,
    );
    targetX = pos.x;
    targetY = pos.y;
    isActive = active;
  };

  if (channel) {
    channel.onmessage = (event) => {
      const msg = event.data as SyncMessage;
      if (msg.type === "navigate") {
        console.log(`[bundeck:view] received navigate: index=${msg.index}`);
        if (typeof msg.index === "number" && msg.index !== navigator.currentIndex) {
          navigator.goTo(msg.index, true);
        }
      } else if (msg.type === "pointer") {
        console.log(
          `[bundeck:view] received pointer: x=${msg.x.toFixed(3)}, y=${msg.y.toFixed(3)}, active=${msg.active}`,
        );
        if (msg.active) {
          // Only update the target position when active — this prevents the dot
          // from flying to (0,0) when the pointer leaves the slide area.
          lastPointerX = msg.x;
          lastPointerY = msg.y;
          applyPointer(msg.x, msg.y, true);
        } else {
          // Keep the dot at its last valid position, just hide it.
          // When reactivated the interpolation starts from where it was hidden.
          isActive = false;
        }
      }
    };
  }

  // Keep showing the pointer after resize
  const onResize = () => {
    if (isActive) {
      applyPointer(lastPointerX, lastPointerY, true);
    }
    updateLaserSize();
  };
  window.addEventListener("resize", onResize);

  // Animation loop — smooth position interpolation, instant opacity
  let frameCount = 0;
  const animate = () => {
    currentX += (targetX - currentX) * INTERPOLATION;
    currentY += (targetY - currentY) * INTERPOLATION;
    laserPointer.style.left = `${currentX}px`;
    laserPointer.style.top = `${currentY}px`;
    laserPointer.style.opacity = isActive ? "1" : "0";
    frameCount++;
    if (frameCount % 60 === 0) {
      console.log(
        `[bundeck:view] animate: isActive=${isActive}, opacity=${laserPointer.style.opacity}, pos=(${currentX.toFixed(1)}, ${currentY.toFixed(1)})`,
      );
    }
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
  // Aspect ratio is set via CSS custom properties (--slide-ratio-w / --slide-ratio-h)
  // injected at build time from the markdown file's frontmatter.
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
  let wasOverSlideArea = false; // track valid→invalid transition to deactivate view-mode pointer
  const POINTER_INTERVAL = 33; // ~30 fps

  const sendPointerUpdate = (x: number, y: number, active: boolean) => {
    console.log(
      `[bundeck] sendPointerUpdate(x=${x.toFixed(3)}, y=${y.toFixed(3)}, active=${active})`,
    );
    channel?.postMessage({ type: "pointer", x, y, active } satisfies SyncMessage);
  };

  const normalizePointer = (clientX: number, clientY: number) => {
    const frame = document.querySelector<HTMLElement>("#slide-frame-container");
    if (!frame) {
      console.warn("[bundeck] normalizePointer: #slide-frame-container not found");
      return { x: 0.5, y: 0.5, valid: false };
    }

    const rect = frame.getBoundingClientRect();
    console.log(
      `[bundeck] normalizePointer: rect={left:${rect.left.toFixed(1)}, top:${rect.top.toFixed(1)}, right:${rect.right.toFixed(1)}, bottom:${rect.bottom.toFixed(1)}, w:${rect.width.toFixed(1)}, h:${rect.height.toFixed(1)}}`,
    );
    console.log(
      `[bundeck] normalizePointer: client=(${clientX.toFixed(1)}, ${clientY.toFixed(1)})`,
    );

    // clientToNormalized clamps to [0,1], so we must check the actual bounding
    // rect separately — the laser pointer should only show when the cursor
    // is physically inside the slide frame container.
    const valid =
      clientX >= rect.left &&
      clientX <= rect.right &&
      clientY >= rect.top &&
      clientY <= rect.bottom;
    console.log(`[bundeck] normalizePointer: valid=${valid}`);

    const { slideWidth, slideHeight } = getSlideDimensions();
    const area = computeSlideDisplayArea(rect, slideWidth, slideHeight);
    console.log(
      `[bundeck] normalizePointer: area={left:${area.left.toFixed(1)}, top:${area.top.toFixed(1)}, w:${area.width.toFixed(1)}, h:${area.height.toFixed(1)}}`,
    );
    const { x, y } = clientToNormalized(clientX, clientY, area);
    return { x, y, valid, area };
  };

  const handleMouseMove = (e: MouseEvent) => {
    const { x, y, valid, area } = normalizePointer(e.clientX, e.clientY);

    console.log(
      `[bundeck] mousemove: valid=${valid}, wasOverSlideArea=${wasOverSlideArea}, isLaserPointerOn=${isLaserPointerOn}`,
    );

    // Update presenter's own cursor overlay
    const presenterUI = (window as any).__presenterUI;
    if (presenterUI?.updateLaserPointerPosition && area) {
      const pos = normalizedToClient(x, y, area);
      presenterUI.updateLaserPointerPosition(pos.x, pos.y, valid && isLaserPointerOn);
    }

    if (isLaserPointerOn) {
      if (valid) {
        const now = Date.now();
        const elapsed = now - lastPointerSendTime;
        console.log(
          `[bundeck] mousemove: valid=true, throttle elapsed=${elapsed}ms, threshold=${POINTER_INTERVAL}ms`,
        );
        if (elapsed > POINTER_INTERVAL) {
          console.log(`[bundeck] mousemove: → sending active:true`);
          sendPointerUpdate(x, y, true);
          lastPointerSendTime = now;
        } else {
          console.log(`[bundeck] mousemove: → throttled, skipped`);
        }
      } else if (wasOverSlideArea) {
        // Mouse just left the slide area — tell view-mode clients to hide the pointer
        console.log(
          `[bundeck] mousemove: valid=false & wasOverSlideArea=true → sending active:false (LEAVE)`,
        );
        sendPointerUpdate(0, 0, false);
      } else {
        console.log(`[bundeck] mousemove: valid=false & wasOverSlideArea=false → no action`);
      }
    } else {
      console.log(`[bundeck] mousemove: laser OFF, skipping`);
    }
    wasOverSlideArea = valid;
  };

  const handleMouseLeave = () => {
    console.log(`[bundeck] mouseleave: sending active:false`);
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
  (window as any).__togglePresenterPointer = (clientX?: number, clientY?: number) => {
    isLaserPointerOn = !isLaserPointerOn;
    console.log(
      `[bundeck] toggle: now isLaserPointerOn=${isLaserPointerOn}, click=(${clientX}, ${clientY})`,
    );
    if (isLaserPointerOn) {
      // Use the click position if available, otherwise fall back to viewport centre.
      // We must validate the position so that wasOverSlideArea is correctly initialised;
      // otherwise the view-mode dot would stay visible after the mouse leaves the slide area
      // because the deactivation branch (else if (wasOverSlideArea)) would never fire.
      const mx = clientX ?? window.innerWidth / 2;
      const my = clientY ?? window.innerHeight / 2;
      const { x, y, valid, area } = normalizePointer(mx, my);
      console.log(
        `[bundeck] toggle: mx=${mx.toFixed(1)}, my=${my.toFixed(1)}, valid=${valid}, normalized=(${x.toFixed(3)}, ${y.toFixed(3)})`,
      );

      if (valid) {
        sendPointerUpdate(x, y, true);
        lastPointerSendTime = Date.now();
        wasOverSlideArea = true;
        console.log(`[bundeck] toggle: → sent active:true, wasOverSlideArea=true`);
      } else {
        // The cursor is outside the slide display area — do not show the dot yet.
        // It will appear on the first mousemove that enters the valid area.
        sendPointerUpdate(0, 0, false);
        wasOverSlideArea = false;
        console.log(`[bundeck] toggle: → outside, sent active:false, wasOverSlideArea=false`);
      }

      // Update the presenter's own overlay
      const presenterUI = (window as any).__presenterUI;
      if (presenterUI?.updateLaserPointerPosition && area) {
        const pos = normalizedToClient(x, y, area);
        presenterUI.updateLaserPointerPosition(pos.x, pos.y, valid);
      }
    } else {
      sendPointerUpdate(0, 0, false);
      console.log(`[bundeck] toggle: → sent active:false (turning OFF)`);
      // Overlay is hidden via updateLaserPointerStatus below
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
