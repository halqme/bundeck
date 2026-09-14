import { formatElapsedTime } from "./timer.js";

export class PresenterUI {
  private container: HTMLElement;
  private slideFrameContainer: HTMLElement;
  private currentFrame: HTMLIFrameElement;
  private nextFrame: HTMLIFrameElement;
  private notesContainer: HTMLElement;
  private clockElement: HTMLElement;
  private timerElement: HTMLElement;
  private slideInfoElement: HTMLElement;
  private progressBarElement: HTMLElement;
  private cursorOverlay: HTMLElement;
  private startTime: number;
  private isPaused: boolean = false;
  private pausedTime: number = 0;
  private slideW: number = 1280;
  private slideH: number = 720;
  private resizeObserver: ResizeObserver | null = null;
  private clockTimer: number | null = null;

  constructor() {
    this.container = document.createElement("main");
    this.container.id = "presenter-dashboard";
    this.container.tabIndex = -1;
    this.container.setAttribute("aria-label", "プレゼンターモード");

    // Header
    const header = document.createElement("header");
    header.id = "presenter-header";

    // Left side: Clock and Slide Info
    const headerLeft = document.createElement("div");
    headerLeft.className = "presenter-header-left";

    this.clockElement = document.createElement("time");
    this.clockElement.id = "presenter-clock";
    this.clockElement.setAttribute("aria-label", "現在時刻");

    this.slideInfoElement = document.createElement("div");
    this.slideInfoElement.id = "presenter-slide-info";
    this.slideInfoElement.setAttribute("role", "status");
    this.slideInfoElement.setAttribute("aria-live", "polite");
    this.slideInfoElement.setAttribute("aria-atomic", "true");
    this.slideInfoElement.innerHTML =
      '<span class="current-slide">1</span> / <span class="total-slides">1</span>';

    headerLeft.appendChild(this.clockElement);
    headerLeft.appendChild(this.slideInfoElement);

    // Center: Progress Bar
    const headerCenter = document.createElement("div");
    headerCenter.className = "presenter-header-center";

    this.progressBarElement = document.createElement("div");
    this.progressBarElement.id = "presenter-progress-bar";
    this.progressBarElement.setAttribute("role", "progressbar");
    this.progressBarElement.setAttribute("aria-label", "スライド進行状況");
    this.progressBarElement.setAttribute("aria-valuemin", "0");
    this.progressBarElement.setAttribute("aria-valuemax", "1");
    this.progressBarElement.setAttribute("aria-valuenow", "1");
    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    this.progressBarElement.appendChild(progressFill);

    headerCenter.appendChild(this.progressBarElement);

    // Right side: Timer
    const headerRight = document.createElement("div");
    headerRight.className = "presenter-header-right";

    const timerWrapper = document.createElement("div");
    timerWrapper.id = "presenter-timer";
    timerWrapper.setAttribute("role", "timer");
    timerWrapper.setAttribute("aria-label", "経過時間");
    this.timerElement = document.createElement("span");
    this.timerElement.textContent = "00:00";

    const timerControls = document.createElement("div");
    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.textContent = "Reset";
    resetBtn.setAttribute("aria-label", "タイマーをリセット");
    resetBtn.onclick = () => this.resetTimer();
    const pauseBtn = document.createElement("button");
    pauseBtn.type = "button";
    pauseBtn.textContent = "Pause";
    pauseBtn.setAttribute("aria-label", "タイマーを一時停止");
    pauseBtn.onclick = () => this.toggleTimer(pauseBtn);

    timerControls.appendChild(pauseBtn);
    timerControls.appendChild(resetBtn);
    timerWrapper.appendChild(this.timerElement);
    timerWrapper.appendChild(timerControls);

    headerRight.appendChild(timerWrapper);

    header.appendChild(headerLeft);
    header.appendChild(headerCenter);
    header.appendChild(headerRight);

    // Current Slide
    const currentView = document.createElement("section");
    currentView.id = "presenter-current";
    currentView.setAttribute("aria-label", "現在のスライド");

    // Aspect-ratio container for the iframe — constrains iframe to slide ratio
    this.slideFrameContainer = document.createElement("div");

    this.currentFrame = document.createElement("iframe");
    this.currentFrame.title = "現在のスライド";
    this.currentFrame.tabIndex = -1;
    // Initial src is empty to avoid race condition with hash update

    this.slideFrameContainer.appendChild(this.currentFrame);
    this.slideFrameContainer.id = "slide-frame-container";
    this.slideFrameContainer.setAttribute("role", "region");
    this.slideFrameContainer.setAttribute("aria-label", "現在のスライド表示");
    currentView.appendChild(this.slideFrameContainer);

    // Slide controls container
    const slideControls = document.createElement("nav");
    slideControls.id = "presenter-slide-controls";
    slideControls.setAttribute("aria-label", "スライド操作");

    // Previous slide button
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.id = "prev-slide-btn";
    prevBtn.textContent = "←";
    prevBtn.title = "前のスライド (←)";
    prevBtn.setAttribute("aria-label", "前のスライド");
    prevBtn.onclick = () => {
      if ((window as any).__navigatePrevious) {
        (window as any).__navigatePrevious();
      }
    };

    // Next slide button
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.id = "next-slide-btn";
    nextBtn.textContent = "→";
    nextBtn.title = "次のスライド (→)";
    nextBtn.setAttribute("aria-label", "次のスライド");
    nextBtn.onclick = () => {
      if ((window as any).__navigateNext) {
        (window as any).__navigateNext();
      }
    };

    // Laser pointer toggle button for slide area
    const laserSlideBtn = document.createElement("button");
    laserSlideBtn.type = "button";
    laserSlideBtn.id = "laser-slide-btn";
    laserSlideBtn.textContent = "🔴";
    laserSlideBtn.title = "レーザーポインター (クリックでON/OFF)";
    laserSlideBtn.setAttribute("aria-label", "レーザーポインターをオンにする");
    laserSlideBtn.setAttribute("aria-pressed", "false");
    laserSlideBtn.onclick = (e) => {
      e.stopPropagation();
      if ((window as any).__togglePresenterPointer) {
        (window as any).__togglePresenterPointer(e.clientX, e.clientY);
      }
    };

    // Open view in new tab button
    const openViewBtn = document.createElement("button");
    openViewBtn.type = "button";
    openViewBtn.id = "open-view-btn";
    openViewBtn.textContent = "↗";
    openViewBtn.title = "新規タブでビューモードを開く";
    openViewBtn.setAttribute("aria-label", "ビューモードを新しいタブで開く");
    openViewBtn.onclick = (e) => {
      e.stopPropagation();
      const viewPath = window.location.pathname.replace(/\/presenter\/?$/, "") || "/";
      const viewUrl = window.location.origin + viewPath + window.location.hash;
      window.open(viewUrl, "_blank");
    };

    slideControls.appendChild(prevBtn);
    slideControls.appendChild(nextBtn);
    slideControls.appendChild(laserSlideBtn);
    slideControls.appendChild(openViewBtn);

    currentView.appendChild(slideControls);

    // Next Slide
    const nextView = document.createElement("section");
    nextView.id = "presenter-next";
    nextView.setAttribute("aria-label", "次のスライド");
    const nextLabel = document.createElement("h2");
    nextLabel.className = "label";
    nextLabel.textContent = "NEXT SLIDE";
    this.nextFrame = document.createElement("iframe");
    this.nextFrame.title = "次のスライド";
    this.nextFrame.tabIndex = -1;
    // Initial src is empty
    nextView.appendChild(nextLabel);
    nextView.appendChild(this.nextFrame);

    // Notes
    this.notesContainer = document.createElement("aside");
    this.notesContainer.id = "presenter-notes";
    this.notesContainer.setAttribute("aria-label", "スピーカーノート");
    this.notesContainer.setAttribute("aria-live", "polite");

    this.container.appendChild(header);
    this.container.appendChild(currentView);
    this.container.appendChild(nextView);
    this.container.appendChild(this.notesContainer);

    // Laser pointer cursor overlay
    this.cursorOverlay = document.createElement("div");
    this.cursorOverlay.id = "presenter-cursor";
    this.cursorOverlay.setAttribute("aria-hidden", "true");
    this.container.appendChild(this.cursorOverlay);

    this.startTime = Date.now();

    // Read slide dimensions from CSS custom properties
    // (injected at build time from the markdown file's frontmatter)
    const root = document.documentElement;
    const computed = getComputedStyle(root);
    this.slideW = parseInt(computed.getPropertyValue("--slide-width") || "1280");
    this.slideH = parseInt(computed.getPropertyValue("--slide-height") || "720");
  }

  public mount() {
    // Clear body and append dashboard
    document.body.innerHTML = "";
    document.body.appendChild(this.container);
    document.body.classList.add("mode-presenter");

    this.startClock();

    // Focus to capture keyboard events immediately
    this.container.focus();

    // Size the slide frame to fit the container while maintaining aspect ratio
    this.fitSlideFrame();

    // Watch for viewport / layout changes
    this.resizeObserver = new ResizeObserver(() => this.fitSlideFrame());
    this.resizeObserver.observe(this.slideFrameContainer.parentElement!);

    // Verify iframes were created (they are populated later by updateViews)
    if (!this.currentFrame || !this.nextFrame) {
      console.warn("Presenter UI mounted but iframe elements are missing");
    }
  }

  /**
   * Calculate and set the slide frame container's width and height so it fits
   * within the available space (#presenter-current minus controls) while
   * maintaining the slide's intrinsic aspect ratio from the markdown file.
   */
  private fitSlideFrame() {
    const parent = this.slideFrameContainer.parentElement;
    const controls = document.getElementById("presenter-slide-controls");
    if (!parent || !controls) return;

    const availW = parent.clientWidth;
    const availH = parent.clientHeight - controls.offsetHeight;

    if (availW <= 0 || availH <= 0) return;

    const ratio = this.slideW / this.slideH;

    let w: number, h: number;
    if (availW / availH > ratio) {
      // Container is wider than slide → constrained by height
      h = availH;
      w = h * ratio;
    } else {
      // Container is taller than slide → constrained by width
      w = availW;
      h = w / ratio;
    }

    this.slideFrameContainer.style.width = `${Math.round(w)}px`;
    this.slideFrameContainer.style.height = `${Math.round(h)}px`;
  }

  public updateViews(currentIndex: number, totalSlides: number) {
    const baseUrl = "/?role=preview";

    // Update Current Slide
    const currentSrc = `${baseUrl}#${currentIndex + 1}`;
    console.log("updateViews called:", { currentIndex, totalSlides, currentSrc });
    this.currentFrame.src = currentSrc;

    // Update Next Slide
    const nextIndex = Math.min(currentIndex + 1, totalSlides - 1);
    const nextSrc = `${baseUrl}#${nextIndex + 1}`;
    this.nextFrame.src = nextSrc;

    // Update slide info
    this.updateSlideInfo(currentIndex + 1, totalSlides);

    // Update progress bar
    this.updateProgressBar(currentIndex + 1, totalSlides);
  }

  private updateSlideInfo(current: number, total: number) {
    const currentSlideEl = this.slideInfoElement.querySelector(".current-slide");
    const totalSlidesEl = this.slideInfoElement.querySelector(".total-slides");

    if (currentSlideEl) currentSlideEl.textContent = current.toString();
    if (totalSlidesEl) totalSlidesEl.textContent = total.toString();
  }

  private updateProgressBar(current: number, total: number) {
    const maximum = Math.max(1, total);
    const value = Math.min(maximum, Math.max(0, current));
    this.progressBarElement.setAttribute("aria-valuemax", String(maximum));
    this.progressBarElement.setAttribute("aria-valuenow", String(value));

    const progressFill = this.progressBarElement.querySelector(".progress-fill") as HTMLElement;
    if (progressFill && total > 0) {
      const progress = (value / total) * 100;
      progressFill.style.width = `${progress}%`;
    }
  }

  public updateNotes(notesHtml: string) {
    if (notesHtml && notesHtml.trim().length > 0) {
      this.notesContainer.innerHTML = notesHtml;
    } else {
      this.notesContainer.innerHTML = '<div class="empty-notes">No speaker notes</div>';
    }
  }

  private startClock() {
    const update = () => {
      const now = new Date();
      this.clockElement.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      this.updateTimer();
    };

    if (this.clockTimer !== null) {
      window.clearInterval(this.clockTimer);
    }

    update();
    this.clockTimer = window.setInterval(update, 1000);
  }

  private updateTimer() {
    if (this.isPaused) return;
    this.timerElement.textContent = formatElapsedTime(Date.now() - this.startTime);
  }

  private resetTimer() {
    const now = Date.now();
    this.startTime = now;
    this.pausedTime = this.isPaused ? now : 0;
    this.timerElement.textContent = "00:00";
  }

  private toggleTimer(btn: HTMLButtonElement) {
    if (this.isPaused) {
      // Adjust start time to account for the paused duration.
      this.startTime += Date.now() - this.pausedTime;
      this.pausedTime = 0;
      this.isPaused = false;
      btn.textContent = "Pause";
      btn.setAttribute("aria-label", "タイマーを一時停止");
      this.updateTimer();
      return;
    }

    this.updateTimer();
    this.isPaused = true;
    this.pausedTime = Date.now();
    btn.textContent = "Resume";
    btn.setAttribute("aria-label", "タイマーを再開");
  }

  public destroy() {
    if (this.clockTimer !== null) {
      window.clearInterval(this.clockTimer);
      this.clockTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
  }

  public updateLaserPointerStatus(active: boolean) {
    const laserSlideBtn = document.getElementById("laser-slide-btn") as HTMLButtonElement;
    if (laserSlideBtn) {
      laserSlideBtn.setAttribute("aria-pressed", String(active));
      if (active) {
        laserSlideBtn.textContent = "🔴";
        laserSlideBtn.title = "レーザーポインター (クリックでOFF)";
        laserSlideBtn.setAttribute("aria-label", "レーザーポインターをオフにする");
        laserSlideBtn.classList.add("active");
      } else {
        laserSlideBtn.textContent = "⚪";
        laserSlideBtn.title = "レーザーポインター (クリックでON)";
        laserSlideBtn.setAttribute("aria-label", "レーザーポインターをオンにする");
        laserSlideBtn.classList.remove("active");
      }
    }

    if (!active) {
      // Cursor and overlay must be explicitly hidden when laser is toggled OFF
      // (mousemove might not fire if the pointer hasn't moved since the toggle)
      this.slideFrameContainer.style.cursor = "";
      this.cursorOverlay.classList.remove("active");
    }
  }

  /**
   * Update the laser pointer cursor overlay position on the presenter's screen.
   * Called from runtime-server.ts with viewport-relative pixel coordinates.
   * Hides the default cursor only when laser is active AND over the slide area
   * — applied inline on the wrapper element so cursor:none never leaks to
   * the controls area or letterbox gaps.
   */
  public updateLaserPointerPosition(x: number, y: number, active: boolean) {
    this.cursorOverlay.style.left = `${x}px`;
    this.cursorOverlay.style.top = `${y}px`;
    this.cursorOverlay.classList.toggle("active", active);

    // Hide cursor only when over the valid slide area AND laser is on.
    // Inline style ensures cursor:none is confined to the wrapper element;
    // controls, notes, and header keep their normal cursor at all times.
    this.slideFrameContainer.style.cursor = active ? "none" : "";
  }
}
