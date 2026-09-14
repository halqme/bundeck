import { SlideNavigator } from "./navigator.js";

/**
 * Options for setting up view mode UI enhancements.
 */
export interface ViewUIOptions {
  /**
   * Called after navigation (next/prev/goTo) to update hash or broadcast.
   * In server mode, onSlideChange handles this; pass undefined/null here.
   * In static mode, pass a function that updates location.hash.
   */
  onNavigate?: () => void;
}

/**
 * Set up view mode UI enhancements:
 *   - Floating navigation buttons (prev/next) at bottom-right, shown on hover
 *   - Custom context menu on right-click
 *
 * Styles for these UI elements are defined in src/styles/view-ui.css
 * and are inlined into the generated HTML at build time.
 */
export function setupViewUI(navigator: SlideNavigator, options: ViewUIOptions = {}) {
  const { onNavigate } = options;

  createNavigationButtons(navigator, onNavigate);
  createContextMenu(navigator, onNavigate);
}

/**
 * Add extra items to the context menu (e.g. presenter mode option in server mode).
 * Called after setupViewUI() when additional menu options are needed.
 */
export function addContextMenuItem(
  label: string,
  action: () => void,
  options?: { shortcut?: string },
) {
  const menu = document.getElementById("vnav-context-menu");
  if (!menu) return;

  const sep = document.createElement("hr");
  sep.setAttribute("role", "separator");
  menu.appendChild(sep);

  const item = createContextMenuButton(label, options?.shortcut);
  item.addEventListener("click", () => {
    action();
    hideContextMenu(menu);
  });

  menu.appendChild(item);
}

// ─── Navigation Buttons ────────────────────────────────────────────

function createNavigationButtons(navigator: SlideNavigator, onNavigate?: () => void) {
  const container = document.createElement("nav");
  container.id = "vnav-buttons";
  container.setAttribute("aria-label", "Slide navigation");

  const prevBtn = document.createElement("button");
  prevBtn.type = "button";
  prevBtn.id = "vnav-prev";
  prevBtn.title = "Previous slide (←)";
  prevBtn.setAttribute("aria-label", "Previous slide");
  prevBtn.textContent = "‹";

  const nextBtn = document.createElement("button");
  nextBtn.type = "button";
  nextBtn.id = "vnav-next";
  nextBtn.title = "Next slide (→)";
  nextBtn.setAttribute("aria-label", "Next slide");
  nextBtn.textContent = "›";

  container.appendChild(prevBtn);
  container.appendChild(nextBtn);
  document.body.appendChild(container);

  // Hover trigger area (sibling before #vnav-buttons for CSS + selector)
  const hoverArea = document.createElement("div");
  hoverArea.id = "vnav-hover-area";
  hoverArea.setAttribute("aria-hidden", "true");
  document.body.insertBefore(hoverArea, container);

  const navigate = (fn: () => void) => {
    fn();
    onNavigate?.();
  };

  prevBtn.onclick = (e) => {
    e.stopPropagation();
    navigate(() => navigator.prev());
  };

  nextBtn.onclick = (e) => {
    e.stopPropagation();
    navigate(() => navigator.next());
  };
}

// ─── Context Menu ──────────────────────────────────────────────────

interface ContextMenuItem {
  label: string | null;
  shortcut?: string;
  action: (() => void) | null; // null = separator
}

function createContextMenu(navigator: SlideNavigator, onNavigate?: () => void) {
  const menu = document.createElement("div");
  menu.id = "vnav-context-menu";
  menu.style.display = "none";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Slide controls");
  menu.setAttribute("aria-hidden", "true");
  document.body.appendChild(menu);

  const menuItems: ContextMenuItem[] = [
    {
      label: "First slide",
      shortcut: "Home",
      action: () => {
        navigator.goTo(0);
        onNavigate?.();
      },
    },
    {
      label: "Previous slide",
      shortcut: "←",
      action: () => {
        navigator.prev();
        onNavigate?.();
      },
    },
    {
      label: "Next slide",
      shortcut: "→",
      action: () => {
        navigator.next();
        onNavigate?.();
      },
    },
    {
      label: "Last slide",
      shortcut: "End",
      action: () => {
        navigator.goTo(navigator.totalSlides - 1);
        onNavigate?.();
      },
    },
    { label: null, shortcut: undefined, action: null }, // separator
    {
      label: "Go to slide...",
      shortcut: undefined,
      action: () => promptGoToSlide(navigator, onNavigate),
    },
  ];

  menuItems.forEach((item) => {
    if (item.action === null) {
      const sep = document.createElement("hr");
      sep.setAttribute("role", "separator");
      menu.appendChild(sep);
    } else {
      const button = createContextMenuButton(item.label!, item.shortcut);
      button.addEventListener("click", () => {
        item.action!();
        hideContextMenu(menu);
      });
      menu.appendChild(button);
    }
  });

  let restoreFocus: HTMLElement | null = null;
  const closeMenu = (restoreTriggerFocus: boolean) => {
    hideContextMenu(menu);
    if (restoreTriggerFocus) restoreFocus?.focus();
    restoreFocus = null;
  };

  // Show menu on right-click.
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    restoreFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    showContextMenu(menu, e.clientX, e.clientY);
  });

  // Hide on click outside.
  document.addEventListener("click", (e) => {
    if (menu.style.display !== "none" && !menu.contains(e.target as Node)) {
      closeMenu(false);
    }
  });

  document.addEventListener(
    "keydown",
    (e) => {
      const isMenuOpen = menu.style.display !== "none";

      if (!isMenuOpen && (e.key === "ContextMenu" || (e.key === "F10" && e.shiftKey))) {
        e.preventDefault();
        e.stopPropagation();
        restoreFocus =
          document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const rect = restoreFocus?.getBoundingClientRect();
        showContextMenu(
          menu,
          rect?.left ?? window.innerWidth / 2,
          rect?.bottom ?? window.innerHeight / 2,
        );
        return;
      }

      if (!isMenuOpen) return;
      e.stopPropagation();

      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu(true);
        return;
      }

      const items = Array.from(menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
      const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
      let nextIndex: number | null = null;

      if (e.key === "ArrowDown") nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      if (e.key === "ArrowUp") nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      if (e.key === "Home") nextIndex = 0;
      if (e.key === "End") nextIndex = items.length - 1;

      if (nextIndex !== null) {
        e.preventDefault();
        items[nextIndex]?.focus();
      }
    },
    true,
  );
}

function createContextMenuButton(label: string, shortcut?: string): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "vnav-context-item";
  button.setAttribute("role", "menuitem");
  button.tabIndex = -1;
  button.textContent = label;

  if (shortcut) {
    const shortcutSpan = document.createElement("span");
    shortcutSpan.className = "shortcut";
    shortcutSpan.textContent = shortcut;
    shortcutSpan.setAttribute("aria-hidden", "true");
    button.appendChild(shortcutSpan);
  }

  return button;
}

function hideContextMenu(menu: HTMLElement) {
  menu.style.display = "none";
  menu.setAttribute("aria-hidden", "true");
}

function showContextMenu(menu: HTMLElement, x: number, y: number) {
  menu.style.display = "block";
  menu.setAttribute("aria-hidden", "false");
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  // Reposition if off-screen.
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${window.innerWidth - rect.width - 8}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - rect.height - 8}px`;
  }

  menu.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
}

function promptGoToSlide(navigator: SlideNavigator, onNavigate?: () => void) {
  const input = prompt(
    `Enter a slide number (1–${navigator.totalSlides})`,
    String(navigator.currentIndex + 1),
  );
  if (input === null) return; // cancelled

  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > navigator.totalSlides) {
    alert(`Enter a number between 1 and ${navigator.totalSlides}`);
    return;
  }

  navigator.goTo(num - 1);
  onNavigate?.();
}

/**
 * Open presenter mode in a new tab.
 * Defined here as a shared utility, but only called from server runtime.
 */
export function openPresenterMode() {
  const base = window.location.pathname.replace(/\/+$/, "");
  // If we're already on /presenter, go to the non-presenter path
  const presenterPath = base.endsWith("/presenter")
    ? base.replace(/\/presenter$/, "") || "/"
    : "/presenter";
  const url = window.location.origin + presenterPath + window.location.hash;
  window.open(url, "_blank");
}
