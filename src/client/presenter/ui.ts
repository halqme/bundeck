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

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "presenter-dashboard";
    this.container.tabIndex = -1; // Allow focus programmatically

    // Ensure clicking anywhere keeps focus on the dashboard for shortcuts
    this.container.onclick = () => {
      this.container.focus();
    };

    // Header
    const header = document.createElement("div");
    header.id = "presenter-header";

    // Left side: Clock and Slide Info
    const headerLeft = document.createElement("div");
    headerLeft.className = "presenter-header-left";

    this.clockElement = document.createElement("div");
    this.clockElement.id = "presenter-clock";

    this.slideInfoElement = document.createElement("div");
    this.slideInfoElement.id = "presenter-slide-info";
    this.slideInfoElement.innerHTML =
      '<span class="current-slide">1</span> / <span class="total-slides">1</span>';

    headerLeft.appendChild(this.clockElement);
    headerLeft.appendChild(this.slideInfoElement);

    // Center: Progress Bar
    const headerCenter = document.createElement("div");
    headerCenter.className = "presenter-header-center";

    this.progressBarElement = document.createElement("div");
    this.progressBarElement.id = "presenter-progress-bar";
    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    this.progressBarElement.appendChild(progressFill);

    headerCenter.appendChild(this.progressBarElement);

    // Right side: Timer
    const headerRight = document.createElement("div");
    headerRight.className = "presenter-header-right";

    const timerWrapper = document.createElement("div");
    timerWrapper.id = "presenter-timer";
    this.timerElement = document.createElement("span");
    this.timerElement.textContent = "00:00";

    const timerControls = document.createElement("div");
    const resetBtn = document.createElement("button");
    resetBtn.textContent = "Reset";
    resetBtn.onclick = () => this.resetTimer();
    const pauseBtn = document.createElement("button");
    pauseBtn.textContent = "Pause";
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
    const currentView = document.createElement("div");
    currentView.id = "presenter-current";

    // Aspect-ratio container for the iframe — constrains iframe to slide ratio
    this.slideFrameContainer = document.createElement("div");

    this.currentFrame = document.createElement("iframe");
    // Initial src is empty to avoid race condition with hash update

    this.slideFrameContainer.appendChild(this.currentFrame);
    this.slideFrameContainer.id = "slide-frame-container";
    currentView.appendChild(this.slideFrameContainer);

    // Slide controls container
    const slideControls = document.createElement("div");
    slideControls.id = "presenter-slide-controls";

    // Previous slide button
    const prevBtn = document.createElement("button");
    prevBtn.id = "prev-slide-btn";
    prevBtn.innerHTML = "←";
    prevBtn.title = "前のスライド (←)";
    prevBtn.onclick = () => {
      if ((window as any).__navigatePrevious) {
        (window as any).__navigatePrevious();
      }
    };

    // Next slide button
    const nextBtn = document.createElement("button");
    nextBtn.id = "next-slide-btn";
    nextBtn.innerHTML = "→";
    nextBtn.title = "次のスライド (→)";
    nextBtn.onclick = () => {
      if ((window as any).__navigateNext) {
        (window as any).__navigateNext();
      }
    };

    // Laser pointer toggle button for slide area
    const laserSlideBtn = document.createElement("button");
    laserSlideBtn.id = "laser-slide-btn";
    laserSlideBtn.innerHTML = "🔴";
    laserSlideBtn.title = "レーザーポインター (クリックでON/OFF)";
    laserSlideBtn.onclick = (e) => {
      e.stopPropagation();
      if ((window as any).__togglePresenterPointer) {
        (window as any).__togglePresenterPointer();
      }
    };

    // Open view in new tab button
    const openViewBtn = document.createElement("button");
    openViewBtn.id = "open-view-btn";
    openViewBtn.innerHTML = "↗";
    openViewBtn.title = "新規タブでビューモードを開く";
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
    const nextView = document.createElement("div");
    nextView.id = "presenter-next";
    const nextLabel = document.createElement("div");
    nextLabel.className = "label";
    nextLabel.textContent = "NEXT SLIDE";
    this.nextFrame = document.createElement("iframe");
    // Initial src is empty
    nextView.appendChild(nextLabel);
    nextView.appendChild(this.nextFrame);

    // Notes
    this.notesContainer = document.createElement("div");
    this.notesContainer.id = "presenter-notes";

    this.container.appendChild(header);
    this.container.appendChild(currentView);
    this.container.appendChild(nextView);
    this.container.appendChild(this.notesContainer);

    // Laser pointer cursor overlay
    this.cursorOverlay = document.createElement("div");
    this.cursorOverlay.id = "presenter-cursor";
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
    const progressFill = this.progressBarElement.querySelector(".progress-fill") as HTMLElement;
    if (progressFill && total > 0) {
      const progress = (current / total) * 100;
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
    setInterval(() => {
      const now = new Date();
      this.clockElement.textContent = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }, 1000);
  }

  private resetTimer() {
    this.startTime = Date.now();
    this.pausedTime = 0;
    this.timerElement.textContent = "00:00";
  }

  private toggleTimer(btn: HTMLButtonElement) {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      btn.textContent = "Resume";
      this.pausedTime = Date.now();
    } else {
      btn.textContent = "Pause";
      // Adjust start time to account for pause duration
      const pauseDuration = Date.now() - this.pausedTime;
      this.startTime += pauseDuration;
    }
  }

  public updateLaserPointerStatus(active: boolean) {
    const laserSlideBtn = document.getElementById("laser-slide-btn") as HTMLButtonElement;
    if (laserSlideBtn) {
      if (active) {
        laserSlideBtn.innerHTML = "🔴";
        laserSlideBtn.title = "レーザーポインター (クリックでOFF)";
        laserSlideBtn.classList.add("active");
      } else {
        laserSlideBtn.innerHTML = "⚪";
        laserSlideBtn.title = "レーザーポインター (クリックでON)";
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
