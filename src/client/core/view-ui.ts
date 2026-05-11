import { SlideNavigator } from "./navigator";

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

const VIEW_UI_STYLES = `
/* ── Hover navigation buttons ── */
#vnav-hover-area {
  position: fixed;
  bottom: 0;
  right: 0;
  width: 180px;
  height: 180px;
  z-index: 9999;
  /* invisible trigger area */
}

#vnav-buttons {
  position: fixed;
  bottom: 32px;
  right: 32px;
  display: flex;
  gap: 12px;
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;
  transform: translateY(8px);
}

#vnav-hover-area:hover + #vnav-buttons,
#vnav-buttons:hover,
#vnav-buttons:focus-within {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

#vnav-buttons button {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.25);
  background: rgba(30, 30, 40, 0.85);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  transition: background 0.15s ease, transform 0.15s ease;
  line-height: 1;
  user-select: none;
  -webkit-user-select: none;
}

#vnav-buttons button:hover {
  background: rgba(60, 60, 80, 0.9);
  transform: scale(1.1);
}

#vnav-buttons button:active {
  transform: scale(0.95);
}

#vnav-buttons button:focus-visible {
  outline: 2px solid #4fc3f7;
  outline-offset: 2px;
}

/* ── Context menu ── */
#vnav-context-menu {
  position: fixed;
  z-index: 10001;
  min-width: 220px;
  background: rgba(35, 35, 45, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 6px 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 13px;
  color: #e0e0e8;
  user-select: none;
  -webkit-user-select: none;
}

#vnav-context-menu .vnav-context-item {
  padding: 8px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: background 0.1s ease;
}

#vnav-context-menu .vnav-context-item:hover {
  background: rgba(79, 195, 247, 0.15);
  color: #fff;
}

#vnav-context-menu .vnav-context-item:active {
  background: rgba(79, 195, 247, 0.25);
}

#vnav-context-menu hr {
  margin: 4px 12px;
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

/* Context menu keyboard shortcut hints */
#vnav-context-menu .vnav-context-item .shortcut {
  margin-left: auto;
  color: #888;
  font-size: 11px;
}
`;

/**
 * Set up view mode UI enhancements:
 *   - Floating navigation buttons (prev/next) at bottom-right, shown on hover
 *   - Custom context menu on right-click
 */
export function setupViewUI(navigator: SlideNavigator, options: ViewUIOptions = {}) {
  const { onNavigate } = options;

  // Inject styles once
  if (!document.getElementById("vnav-styles")) {
    const style = document.createElement("style");
    style.id = "vnav-styles";
    style.textContent = VIEW_UI_STYLES;
    document.head.appendChild(style);
  }

  createNavigationButtons(navigator, onNavigate);
  createContextMenu(navigator, onNavigate);
}

// ─── Navigation Buttons ────────────────────────────────────────────

function createNavigationButtons(navigator: SlideNavigator, onNavigate?: () => void) {
  const container = document.createElement("div");
  container.id = "vnav-buttons";

  const prevBtn = document.createElement("button");
  prevBtn.id = "vnav-prev";
  prevBtn.title = "前のスライド (←)";
  prevBtn.setAttribute("aria-label", "前のスライド");
  prevBtn.innerHTML = "‹";

  const nextBtn = document.createElement("button");
  nextBtn.id = "vnav-next";
  nextBtn.title = "次のスライド (→)";
  nextBtn.setAttribute("aria-label", "次のスライド");
  nextBtn.innerHTML = "›";

  container.appendChild(prevBtn);
  container.appendChild(nextBtn);
  document.body.appendChild(container);

  // Hover trigger area (sibling before #vnav-buttons for CSS + selector)
  const hoverArea = document.createElement("div");
  hoverArea.id = "vnav-hover-area";
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
  document.body.appendChild(menu);

  const menuItems: ContextMenuItem[] = [
    {
      label: "最初のスライド",
      shortcut: "Home",
      action: () => {
        navigator.goTo(0);
        onNavigate?.();
      },
    },
    {
      label: "前のスライド",
      shortcut: "←",
      action: () => {
        navigator.prev();
        onNavigate?.();
      },
    },
    {
      label: "次のスライド",
      shortcut: "→",
      action: () => {
        navigator.next();
        onNavigate?.();
      },
    },
    {
      label: "最後のスライド",
      shortcut: "End",
      action: () => {
        navigator.goTo(navigator.totalSlides - 1);
        onNavigate?.();
      },
    },
    { label: null, shortcut: undefined, action: null }, // separator
    {
      label: "スライド番号を指定...",
      shortcut: undefined,
      action: () => promptGoToSlide(navigator, onNavigate),
    },
    { label: null, shortcut: undefined, action: null }, // separator
    { label: "プレゼンターモードを開く", shortcut: undefined, action: () => openPresenterMode() },
  ];

  menuItems.forEach((item) => {
    if (item.action === null) {
      const sep = document.createElement("hr");
      menu.appendChild(sep);
    } else {
      const div = document.createElement("div");
      div.className = "vnav-context-item";
      div.textContent = item.label!;

      if (item.shortcut) {
        const shortcutSpan = document.createElement("span");
        shortcutSpan.className = "shortcut";
        shortcutSpan.textContent = item.shortcut;
        div.appendChild(shortcutSpan);
      }

      div.onclick = () => {
        item.action!();
        menu.style.display = "none";
      };

      menu.appendChild(div);
    }
  });

  // Show menu on right-click
  document.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    showContextMenu(menu, e.clientX, e.clientY);
  });

  // Hide on click outside
  document.addEventListener("click", (e) => {
    if (menu.style.display !== "none" && !menu.contains(e.target as Node)) {
      menu.style.display = "none";
    }
  });

  // Hide on Escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && menu.style.display !== "none") {
      menu.style.display = "none";
    }
  });
}

function showContextMenu(menu: HTMLElement, x: number, y: number) {
  menu.style.display = "block";
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  // Reposition if off-screen
  const rect = menu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    menu.style.left = `${window.innerWidth - rect.width - 8}px`;
  }
  if (rect.bottom > window.innerHeight) {
    menu.style.top = `${window.innerHeight - rect.height - 8}px`;
  }
}

function promptGoToSlide(navigator: SlideNavigator, onNavigate?: () => void) {
  const input = prompt(
    `スライド番号を入力 (1 〜 ${navigator.totalSlides})`,
    String(navigator.currentIndex + 1),
  );
  if (input === null) return; // cancelled

  const num = parseInt(input, 10);
  if (isNaN(num) || num < 1 || num > navigator.totalSlides) {
    alert(`1 〜 ${navigator.totalSlides} の範囲で入力してください`);
    return;
  }

  navigator.goTo(num - 1);
  onNavigate?.();
}

function openPresenterMode() {
  const base = window.location.pathname.replace(/\/+$/, "");
  // If we're already on /presenter, go to the non-presenter path
  const presenterPath = base.endsWith("/presenter")
    ? base.replace(/\/presenter$/, "") || "/"
    : "/presenter";
  const url = window.location.origin + presenterPath + window.location.hash;
  window.open(url, "_blank");
}
