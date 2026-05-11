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
