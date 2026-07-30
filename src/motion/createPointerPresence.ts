import { CAPTURE_PASSIVE } from "./figureUtils";
import type { MotionCleanup } from "./createHoverMotion";

export type CreatePointerPresenceOptions = {
  panel: HTMLElement;
  /** Called each frame while pointer is inside the panel. `elapsed` from session start. */
  onFrame: (elapsed: number) => void;
  onStop: () => void;
};

/**
 * Document-level pointer tracking: motion runs while the cursor is inside `panel`.
 * Used by pulse/ripple panels (point Q, tangent).
 */
export function createPointerPresence(opts: CreatePointerPresenceOptions): MotionCleanup {
  const { panel, onFrame, onStop } = opts;

  let rafId = 0;
  let tOrigin: number | null = null;
  let lastX = Number.NaN;
  let lastY = Number.NaN;
  let rect = panel.getBoundingClientRect();

  const refreshRect = (): void => {
    rect = panel.getBoundingClientRect();
  };

  const pointerInPanel = (): boolean => {
    if (!Number.isFinite(lastX) || !Number.isFinite(lastY)) return false;
    return lastX >= rect.left && lastX < rect.right && lastY >= rect.top && lastY < rect.bottom;
  };

  const stop = (): void => {
    if (rafId === 0) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
    tOrigin = null;
    onStop();
  };

  const frame = (now: number): void => {
    if (!pointerInPanel()) {
      stop();
      return;
    }
    if (tOrigin === null) tOrigin = now;
    onFrame(now - tOrigin);
    rafId = requestAnimationFrame(frame);
  };

  const start = (): void => {
    if (rafId !== 0) return;
    tOrigin = null;
    rafId = requestAnimationFrame(frame);
  };

  const sync = (): void => {
    if (pointerInPanel()) start();
    else stop();
  };

  const onScrollOrResize = (): void => {
    refreshRect();
    sync();
  };

  const recordMove = (e: PointerEvent | MouseEvent): void => {
    lastX = e.clientX;
    lastY = e.clientY;
    sync();
  };

  const onBlur = (): void => stop();
  const onVisibility = (): void => {
    if (document.visibilityState === "hidden") stop();
  };

  document.addEventListener("pointermove", recordMove, CAPTURE_PASSIVE);
  window.addEventListener("scroll", onScrollOrResize, CAPTURE_PASSIVE);
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    stop();
    document.removeEventListener("pointermove", recordMove, CAPTURE_PASSIVE);
    window.removeEventListener("scroll", onScrollOrResize, CAPTURE_PASSIVE);
    window.removeEventListener("resize", onScrollOrResize);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
