/**
 * Slide display area calculation utilities.
 *
 * All laser-pointer / coordinate-mapping code that involves
 * aspect-ratio-aware letterboxing lives here — once.
 */

export interface SlideDisplayArea {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Given a container's bounding rect and the slide's intrinsic dimensions,
 * compute the actual letterboxed display area (where the slide content
 * is rendered inside the container while maintaining aspect ratio).
 */
export function computeSlideDisplayArea(
  containerRect: DOMRect,
  slideWidth: number,
  slideHeight: number,
): SlideDisplayArea {
  const slideAspect = slideWidth / slideHeight;
  const containerAspect = containerRect.width / containerRect.height;

  let width: number;
  let height: number;
  let left: number;
  let top: number;

  if (containerAspect > slideAspect) {
    // Container is wider than slide → constrained by height
    height = containerRect.height;
    width = height * slideAspect;
    left = containerRect.left + (containerRect.width - width) / 2;
    top = containerRect.top;
  } else {
    // Container is taller than slide → constrained by width
    width = containerRect.width;
    height = width / slideAspect;
    left = containerRect.left;
    top = containerRect.top + (containerRect.height - height) / 2;
  }

  return { left, top, width, height };
}

/**
 * Derive the slide's intrinsic dimensions from CSS custom properties.
 * Falls back to 1280×720 (16:9).
 */
export function getSlideDimensions(): { slideWidth: number; slideHeight: number } {
  const root = document.documentElement;
  const slideWidth = parseInt(getComputedStyle(root).getPropertyValue("--slide-width") || "1280");
  const slideHeight = parseInt(getComputedStyle(root).getPropertyValue("--slide-height") || "720");
  return { slideWidth, slideHeight };
}

/**
 * Convert a client-space coordinate to a normalized (0‑1) coordinate
 * within the slide's letterboxed display area.
 */
export function clientToNormalized(
  clientX: number,
  clientY: number,
  area: SlideDisplayArea,
): { x: number; y: number } {
  const relX = clientX - area.left;
  const relY = clientY - area.top;
  const x = area.width > 0 ? relX / area.width : 0;
  const y = area.height > 0 ? relY / area.height : 0;
  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
  };
}

/**
 * Convert a normalized (0‑1) coordinate back to client-space coordinates
 * within the slide's letterboxed display area.
 */
export function normalizedToClient(
  normX: number,
  normY: number,
  area: SlideDisplayArea,
): { x: number; y: number } {
  return {
    x: area.left + normX * area.width,
    y: area.top + normY * area.height,
  };
}

/**
 * Compute an appropriate laser-pointer dot size (px) based on
 * the current viewport scale.
 */
export function calculateLaserPointerSize(slideWidth: number, slideHeight: number): number {
  const scaleX = window.innerWidth / slideWidth;
  const scaleY = window.innerHeight / slideHeight;
  const scale = Math.min(scaleX, scaleY);
  const baseSize = 12;
  return Math.max(6, Math.min(baseSize * scale, 30));
}
