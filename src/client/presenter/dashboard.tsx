import h from "solid-js/h";
import { createSignal, onCleanup, onMount, type Accessor } from "solid-js";
import type { JSX } from "solid-js";
import { getSlideDimensions } from "../core/geometry.js";
import { formatElapsedTime } from "./timer.js";

export interface PresenterCursor {
  x: number;
  y: number;
  active: boolean;
}

export interface PresenterDashboardProps {
  currentSlide: Accessor<number>;
  totalSlides: Accessor<number>;
  currentSrc: Accessor<string>;
  nextSrc: Accessor<string>;
  notesHtml: Accessor<string>;
  laserPointerActive: Accessor<boolean>;
  cursor: Accessor<PresenterCursor>;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onTogglePresenterPointer: (clientX: number, clientY: number) => void;
  onOpenView: () => void;
}

function formatClock(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Dynamic JSX expressions are zero-argument accessors because the Bun build
 * uses Solid's hyperscript factory, which wires those accessors to effects.
 */
export function PresenterDashboard(props: PresenterDashboardProps): JSX.Element {
  let dashboard: HTMLElement | undefined;
  let slideFrameContainer: HTMLDivElement | undefined;

  const [clockTime, setClockTime] = createSignal(Date.now());
  const [startTime, setStartTime] = createSignal(Date.now());
  const [isPaused, setIsPaused] = createSignal(false);
  const [pausedTime, setPausedTime] = createSignal(0);

  const totalSlides = () => Math.max(0, props.totalSlides());
  const progressMaximum = () => Math.max(1, totalSlides());
  const progressValue = () => Math.min(progressMaximum(), Math.max(0, props.currentSlide()));
  const progressPercent = () =>
    totalSlides() > 0 ? `${(progressValue() / totalSlides()) * 100}%` : "0%";
  const notesContent = () => {
    const html = props.notesHtml();
    return html.trim().length > 0 ? html : '<div class="empty-notes">No speaker notes</div>';
  };
  const elapsedTime = () => {
    const endTime = isPaused() ? pausedTime() : clockTime();
    return formatElapsedTime(endTime - startTime());
  };

  const fitSlideFrame = () => {
    const frame = slideFrameContainer;
    const parent = frame?.parentElement;
    const controls = document.getElementById("presenter-slide-controls");
    if (!frame || !parent || !controls) return;

    const { slideWidth, slideHeight } = getSlideDimensions();
    const availableWidth = parent.clientWidth;
    const availableHeight = parent.clientHeight - controls.offsetHeight;

    if (availableWidth <= 0 || availableHeight <= 0) return;

    const ratio = slideWidth / slideHeight;
    let width: number;
    let height: number;

    if (availableWidth / availableHeight > ratio) {
      height = availableHeight;
      width = height * ratio;
    } else {
      width = availableWidth;
      height = width / ratio;
    }

    frame.style.width = `${Math.round(width)}px`;
    frame.style.height = `${Math.round(height)}px`;
  };

  const resetTimer = () => {
    const now = Date.now();
    setStartTime(now);
    setPausedTime(isPaused() ? now : 0);
    setClockTime(now);
  };

  const toggleTimer = () => {
    const now = Date.now();

    if (isPaused()) {
      setStartTime(startTime() + now - pausedTime());
      setPausedTime(0);
      setIsPaused(false);
      setClockTime(now);
      return;
    }

    setClockTime(now);
    setIsPaused(true);
    setPausedTime(now);
  };

  const handleLaserToggle = (event: MouseEvent) => {
    event.stopPropagation();
    props.onTogglePresenterPointer(event.clientX, event.clientY);
  };

  const handleOpenView = (event: MouseEvent) => {
    event.stopPropagation();
    props.onOpenView();
  };

  let resizeObserver: ResizeObserver | undefined;
  let clockTimer: number | undefined;

  onMount(() => {
    dashboard?.focus();
    fitSlideFrame();

    const parent = slideFrameContainer?.parentElement;
    if (parent) {
      resizeObserver = new ResizeObserver(fitSlideFrame);
      resizeObserver.observe(parent);
    }

    clockTimer = window.setInterval(() => setClockTime(Date.now()), 1000);
  });

  onCleanup(() => {
    resizeObserver?.disconnect();
    if (clockTimer !== undefined) window.clearInterval(clockTimer);
  });

  return (
    <main
      ref={(element) => {
        dashboard = element;
      }}
      id="presenter-dashboard"
      tabIndex={-1}
      aria-label="プレゼンターモード"
    >
      <header id="presenter-header">
        <div class="presenter-header-left">
          <time id="presenter-clock" aria-label="現在時刻">
            {() => formatClock(clockTime())}
          </time>
          <div id="presenter-slide-info" role="status" aria-live="polite" aria-atomic="true">
            <span class="current-slide">{() => props.currentSlide()}</span> /{" "}
            <span class="total-slides">{() => props.totalSlides()}</span>
          </div>
        </div>

        <div class="presenter-header-center">
          <div
            id="presenter-progress-bar"
            role="progressbar"
            aria-label="スライド進行状況"
            aria-valuemin="0"
            aria-valuemax={() => progressMaximum()}
            aria-valuenow={() => progressValue()}
          >
            <div class="progress-fill" style={() => `width: ${progressPercent()}`} />
          </div>
        </div>

        <div class="presenter-header-right">
          <div id="presenter-timer" role="timer" aria-label="経過時間">
            <span>{() => elapsedTime()}</span>
            <div>
              <button
                type="button"
                onClick={toggleTimer}
                aria-label={() => (isPaused() ? "タイマーを再開" : "タイマーを一時停止")}
              >
                {() => (isPaused() ? "Resume" : "Pause")}
              </button>
              <button type="button" onClick={resetTimer} aria-label="タイマーをリセット">
                Reset
              </button>
            </div>
          </div>
        </div>
      </header>

      <section id="presenter-current" aria-label="現在のスライド">
        <div
          ref={(element) => {
            slideFrameContainer = element;
          }}
          id="slide-frame-container"
          role="region"
          aria-label="現在のスライド表示"
          style={() => (props.cursor().active ? { cursor: "none" } : {})}
        >
          <iframe
            src={() => props.currentSrc() || undefined}
            title="現在のスライド"
            tabIndex={-1}
          />
        </div>

        <nav id="presenter-slide-controls" aria-label="スライド操作">
          <button
            type="button"
            id="prev-slide-btn"
            title="前のスライド (←)"
            aria-label="前のスライド"
            onClick={() => props.onNavigatePrevious()}
          >
            ←
          </button>
          <button
            type="button"
            id="next-slide-btn"
            title="次のスライド (→)"
            aria-label="次のスライド"
            onClick={() => props.onNavigateNext()}
          >
            →
          </button>
          <button
            type="button"
            id="laser-slide-btn"
            title={() =>
              `レーザーポインター (クリックで${props.laserPointerActive() ? "OFF" : "ON"})`
            }
            aria-label={() =>
              `レーザーポインターを${props.laserPointerActive() ? "オフ" : "オン"}にする`
            }
            aria-pressed={() => (props.laserPointerActive() ? "true" : "false")}
            class={() => (props.laserPointerActive() ? "active" : undefined)}
            onClick={handleLaserToggle}
          >
            {() => (props.laserPointerActive() ? "🔴" : "⚪")}
          </button>
          <button
            type="button"
            id="open-view-btn"
            title="新規タブでビューモードを開く"
            aria-label="ビューモードを新しいタブで開く"
            onClick={handleOpenView}
          >
            ↗
          </button>
        </nav>
      </section>

      <section id="presenter-next" aria-label="次のスライド">
        <h2 class="label">NEXT SLIDE</h2>
        <iframe src={() => props.nextSrc() || undefined} title="次のスライド" tabIndex={-1} />
      </section>

      <aside
        id="presenter-notes"
        aria-label="スピーカーノート"
        aria-live="polite"
        innerHTML={notesContent}
      />

      <div
        id="presenter-cursor"
        aria-hidden="true"
        class={() => (props.cursor().active ? "active" : undefined)}
        style={() => `left: ${props.cursor().x}px; top: ${props.cursor().y}px`}
      />
    </main>
  ) as unknown as JSX.Element;
}
