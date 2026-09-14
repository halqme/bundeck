import type { NavigatorOptions } from "./types.js";

export class SlideNavigator {
  private slides: HTMLElement[];
  private currentSlideIndex: number = 0;
  private container: HTMLElement | null;
  private minScale: number;
  private minContainerWidth: number;
  private minContainerHeight: number;
  private minContainerScale: number;
  private recomputeTimeout: number | null = null;
  private onSlideChange?: (index: number) => void;

  constructor(options: NavigatorOptions = {}) {
    const selector = options.slideSelector || ".slide";
    this.slides = Array.from(document.querySelectorAll<HTMLElement>(selector));
    this.container = document.getElementById(options.containerId || "slide-container");
    this.minScale = options.minScale || 0.4;
    this.onSlideChange = options.onSlideChange;

    // Bind methods
    this.handleResize = this.handleResize.bind(this);
    this.handleOrientation = this.handleOrientation.bind(this);

    // Add listeners
    window.addEventListener("resize", this.handleResize);
    window.addEventListener("orientationchange", this.handleOrientation);

    // Get slide dimensions from CSS variables
    const root = document.documentElement;
    const slideWidth = parseInt(getComputedStyle(root).getPropertyValue("--slide-width") || "1280");
    const slideHeight = parseInt(
      getComputedStyle(root).getPropertyValue("--slide-height") || "720",
    );

    // Container scaling thresholds (defaults from CSS variables)
    this.minContainerWidth = options.minContainerWidth ?? slideWidth;
    this.minContainerHeight = options.minContainerHeight ?? slideHeight;
    this.minContainerScale = options.minContainerScale ?? 0.7;
  }

  public get totalSlides(): number {
    return this.slides.length;
  }

  public get currentIndex(): number {
    return this.currentSlideIndex;
  }

  public destroy() {
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("orientationchange", this.handleOrientation);
  }

  public goTo(index: number, suppressCallback = false) {
    if (this.slides.length === 0) return;

    // Clamp index
    const targetIndex = Math.max(0, Math.min(index, this.totalSlides - 1));

    // Precompute scale for target
    const target = this.slides[targetIndex];
    if (target) {
      try {
        const preScale = this.computeScaleForSlide(target);
        target.style.setProperty("--text-scale", String(Number(preScale.toFixed(3))));
      } catch (e) {
        console.warn("Failed to compute scale for slide:", e);
      }
    }

    this.slides.forEach((slide, i) => {
      const isActive = i === targetIndex;

      if (isActive) {
        slide.classList.add("active");
        this.scheduleRecompute(40);

        // Image loading handling
        const imgs = Array.from(slide.querySelectorAll("img"));
        imgs.forEach((img) => {
          if (!img.complete) {
            const onLoad = () => {
              this.scheduleRecompute();
              img.removeEventListener("load", onLoad);
            };
            img.addEventListener("load", onLoad);
          }
        });

        // Fonts ready handling
        if ((document as any).fonts && (document as any).fonts.ready) {
          (document as any).fonts.ready
            .then(() => {
              this.scheduleRecompute();
            })
            .catch(() => {});
        }
      } else {
        // Hiding logic with transition handling
        if (slide.classList.contains("active")) {
          let cleared = false;
          const onTrans = (e: TransitionEvent) => {
            if (e.propertyName === "opacity") {
              if (!cleared) {
                this.clearScaleFromSlide(slide);
                cleared = true;
              }
              slide.removeEventListener("transitionend", onTrans as EventListener);
            }
          };
          slide.addEventListener("transitionend", onTrans as EventListener);

          const fallback = window.setTimeout(() => {
            if (!cleared) this.clearScaleFromSlide(slide);
            try {
              slide.removeEventListener("transitionend", onTrans as EventListener);
            } catch {}
            clearTimeout(fallback);
          }, 350);
        } else {
          this.clearScaleFromSlide(slide);
        }

        slide.classList.remove("active");
      }
    });

    const prevIndex = this.currentSlideIndex;
    this.currentSlideIndex = targetIndex;

    if (!suppressCallback && this.onSlideChange && prevIndex !== targetIndex) {
      this.onSlideChange(targetIndex);
    }
  }

  public next() {
    if (this.currentSlideIndex < this.totalSlides - 1) {
      this.goTo(this.currentSlideIndex + 1);
    }
  }

  public prev() {
    if (this.currentSlideIndex > 0) {
      this.goTo(this.currentSlideIndex - 1);
    }
  }

  private computeScaleForSlide(slide: HTMLElement): number {
    const containerHeight = this.container ? this.container.clientHeight : window.innerHeight;

    const cs = window.getComputedStyle(slide);
    const paddingTop = parseFloat(cs.paddingTop || "0") || 0;
    const paddingBottom = parseFloat(cs.paddingBottom || "0") || 0;
    const availableHeight = Math.max(0, containerHeight - (paddingTop + paddingBottom));

    // slide.scrollHeight includes padding; subtract padding to get content box height
    const contentHeight = Math.max(0, (slide.scrollHeight || 0) - (paddingTop + paddingBottom));

    if (!contentHeight || contentHeight <= availableHeight) return 1;

    const raw = availableHeight / contentHeight;
    return Math.max(this.minScale, Math.min(1, raw));
  }

  private applyScaleToSlide(slide: HTMLElement) {
    const scale = this.computeScaleForSlide(slide);
    slide.style.setProperty("--text-scale", String(Number(scale.toFixed(3))));
  }

  private clearScaleFromSlide(slide: HTMLElement) {
    slide.style.removeProperty("--text-scale");
  }

  private scheduleRecompute(delay = 80) {
    if (this.recomputeTimeout !== null) {
      window.clearTimeout(this.recomputeTimeout);
    }
    this.recomputeTimeout = window.setTimeout(() => {
      const active = this.slides[this.currentSlideIndex];
      if (active) this.applyScaleToSlide(active);
      this.recomputeTimeout = null;
    }, delay);
  }

  private handleResize() {
    this.updateContainerTransform();
    this.scheduleRecompute(80);
  }

  private handleOrientation() {
    this.updateContainerTransform();
    this.scheduleRecompute(120);
  }

  /**
   * ビューポートがデザイン基準（minContainerWidth/minContainerHeight）より
   * 小さい場合に、#slide-container に transform: scale(...) を設定します。
   * 単純な閾値基準で無条件にスケールする実装です。
   */
  private updateContainerTransform() {
    if (!this.container) return;

    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // どちらか一方が閾値を下回ればスケールを適用
    if (vw < this.minContainerWidth || vh < this.minContainerHeight) {
      // スケール比率は両方の比率のうち小さい方を使う
      const sx = vw / this.minContainerWidth;
      const sy = vh / this.minContainerHeight;
      let s = Math.min(sx, sy);
      if (this.minContainerScale !== undefined) s = Math.max(s, this.minContainerScale);
      this.container.style.transform = `scale(${s})`;
      this.container.style.transformOrigin = "center center";
    } else {
      // 閾値以上では transform をリセット
      this.container.style.transform = "";
      this.container.style.transformOrigin = "";
    }
  }
}
