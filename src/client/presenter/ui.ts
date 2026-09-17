import { createComponent, createSignal, type Accessor, type Setter } from "solid-js";
import { render } from "solid-js/web";
import {
  PresenterDashboard,
  type PresenterCursor,
  type PresenterDashboardProps,
} from "./dashboard.js";

export interface PresenterUIOptions {
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onTogglePresenterPointer?: (clientX: number, clientY: number) => void;
  onOpenView?: () => void;
}

/**
 * Controller for the Solid presenter dashboard.
 *
 * Runtime code owns presentation synchronization and updates this controller;
 * Solid owns the DOM and reacts to those state changes.
 */
export class PresenterUI {
  private readonly currentSlide: Accessor<number>;
  private readonly setCurrentSlide: Setter<number>;
  private readonly totalSlides: Accessor<number>;
  private readonly setTotalSlides: Setter<number>;
  private readonly currentSrc: Accessor<string>;
  private readonly setCurrentSrc: Setter<string>;
  private readonly nextSrc: Accessor<string>;
  private readonly setNextSrc: Setter<string>;
  private readonly notesHtml: Accessor<string>;
  private readonly setNotesHtml: Setter<string>;
  private readonly laserPointerActive: Accessor<boolean>;
  private readonly setLaserPointerActive: Setter<boolean>;
  private readonly cursor: Accessor<PresenterCursor>;
  private readonly setCursor: Setter<PresenterCursor>;
  private readonly options: PresenterUIOptions;
  private dispose: (() => void) | null = null;

  constructor(options: PresenterUIOptions = {}) {
    [this.currentSlide, this.setCurrentSlide] = createSignal(1);
    [this.totalSlides, this.setTotalSlides] = createSignal(1);
    [this.currentSrc, this.setCurrentSrc] = createSignal("");
    [this.nextSrc, this.setNextSrc] = createSignal("");
    [this.notesHtml, this.setNotesHtml] = createSignal("");
    [this.laserPointerActive, this.setLaserPointerActive] = createSignal(false);
    [this.cursor, this.setCursor] = createSignal<PresenterCursor>({
      x: 0,
      y: 0,
      active: false,
    });
    this.options = options;
  }

  public mount() {
    if (this.dispose) return;

    document.body.innerHTML = "";
    document.body.classList.add("mode-presenter");

    const props: PresenterDashboardProps = {
      currentSlide: this.currentSlide,
      totalSlides: this.totalSlides,
      currentSrc: this.currentSrc,
      nextSrc: this.nextSrc,
      notesHtml: this.notesHtml,
      laserPointerActive: this.laserPointerActive,
      cursor: this.cursor,
      onNavigatePrevious: () => this.options.onNavigatePrevious?.(),
      onNavigateNext: () => this.options.onNavigateNext?.(),
      onTogglePresenterPointer: (clientX, clientY) =>
        this.options.onTogglePresenterPointer?.(clientX, clientY),
      onOpenView: () => {
        if (this.options.onOpenView) {
          this.options.onOpenView();
        } else {
          this.openViewMode();
        }
      },
    };

    this.dispose = render(() => createComponent(PresenterDashboard, props), document.body);
  }

  public updateViews(currentIndex: number, totalSlides: number) {
    const baseUrl = "/?role=preview";
    const nextIndex = Math.min(currentIndex + 1, totalSlides - 1);

    this.setCurrentSrc(`${baseUrl}#${currentIndex + 1}`);
    this.setNextSrc(`${baseUrl}#${nextIndex + 1}`);
    this.setCurrentSlide(currentIndex + 1);
    this.setTotalSlides(totalSlides);
  }

  public updateNotes(notesHtml: string) {
    this.setNotesHtml(notesHtml);
  }

  public updateLaserPointerStatus(active: boolean) {
    this.setLaserPointerActive(active);
    if (!active) {
      this.setCursor((previous) => ({ ...previous, active: false }));
    }
  }

  /**
   * Update the laser pointer cursor overlay position on the presenter's screen.
   * Coordinates are relative to the viewport.
   */
  public updateLaserPointerPosition(x: number, y: number, active: boolean) {
    this.setCursor({ x, y, active });
  }

  public destroy() {
    this.dispose?.();
    this.dispose = null;
    document.body.classList.remove("mode-presenter");
  }

  private openViewMode() {
    const viewPath = window.location.pathname.replace(/\/presenter\/?$/, "") || "/";
    const viewUrl = window.location.origin + viewPath + window.location.hash;
    window.open(viewUrl, "_blank");
  }
}
