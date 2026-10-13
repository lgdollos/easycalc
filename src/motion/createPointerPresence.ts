import { bindTap, hasFineHover } from "../ui/pointerMode";
import { CAPTURE_PASSIVE } from "./figureUtils";
import {
  dispatchPanelTap,
  MOTION_ACTIVE_CLASS,
  PANEL_MOTION_STOP_EVENT,
  type MotionCleanup,
} from "./createHoverMotion";
import { PULSE_MS } from "./pointPulse";

export type CreatePointerPresenceOptions = {
  panel: HTMLElement;
  /** Called each frame while pointer is inside the panel. `elapsed` from session start. */
  onFrame: (elapsed: number) => void;
  onStop: () => void;
  /** Tap one-shot length. Defaults to one pulse period. */
  onceMs?: number;
};

/**
 * Fine hover: motion runs while the cursor is inside `panel`.
 * Coarse: tap runs one `onceMs` cycle then rest.
 */
export function createPointerPresence(opts: CreatePointerPresenceOptions): MotionCleanup {
  const { panel, onFrame, onStop, onceMs = PULSE_MS } = opts;

  let rafId = 0;
  let tOrigin: number | null = null;
  let lastX = Number.NaN;
  let lastY = Number.NaN;
  let rect = panel.getBoundingClientRect();
  let tapSession = false;

  const refreshRect = (): void => {
    rect = panel.getBoundingClientRect();
  };

  const pointerInPanel = (): boolean => {
    if (!Number.isFinite(lastX) || !Number.isFinite(lastY)) return false;
    return lastX >= rect.left && lastX < rect.right && lastY >= rect.top && lastY < rect.bottom;
  };

  const halt = (emitStop: boolean): void => {
    if (rafId === 0) return;
    cancelAnimationFrame(rafId);
    rafId = 0;
    tOrigin = null;
    tapSession = false;
    panel.classList.remove(MOTION_ACTIVE_CLASS);
    onStop();
    if (emitStop) panel.dispatchEvent(new Event(PANEL_MOTION_STOP_EVENT));
  };

  const frame = (now: number): void => {
    if (tapSession) {
      if (tOrigin === null) tOrigin = now;
      const elapsed = now - tOrigin;
      onFrame(elapsed);
      if (elapsed >= onceMs) {
        halt(true);
        return;
      }
      rafId = requestAnimationFrame(frame);
      return;
    }
    if (!pointerInPanel()) {
      halt(true);
      return;
    }
    if (tOrigin === null) tOrigin = now;
    onFrame(now - tOrigin);
    rafId = requestAnimationFrame(frame);
  };

  const start = (once: boolean): void => {
    if (rafId !== 0) return;
    tOrigin = null;
    tapSession = once;
    if (once) panel.classList.add(MOTION_ACTIVE_CLASS);
    rafId = requestAnimationFrame(frame);
  };

  const sync = (): void => {
    if (tapSession) return;
    if (!hasFineHover()) return;
    if (pointerInPanel()) start(false);
    else halt(true);
  };

  const onScrollOrResize = (): void => {
    refreshRect();
    sync();
  };

  const recordMove = (e: PointerEvent | MouseEvent): void => {
    if (!hasFineHover()) return;
    if ("pointerType" in e && e.pointerType !== "mouse") return;
    lastX = e.clientX;
    lastY = e.clientY;
    sync();
  };

  const onBlur = (): void => {
    if (tapSession) return;
    halt(true);
  };
  const onVisibility = (): void => {
    if (document.visibilityState === "hidden") halt(true);
  };

  document.addEventListener("pointermove", recordMove, CAPTURE_PASSIVE);
  window.addEventListener("scroll", onScrollOrResize, CAPTURE_PASSIVE);
  window.addEventListener("resize", onScrollOrResize, { passive: true });
  window.addEventListener("blur", onBlur);
  document.addEventListener("visibilitychange", onVisibility);

  const unTap = bindTap(panel, (e) => {
    dispatchPanelTap(panel, e.target);
    if (rafId !== 0) halt(false);
    start(true);
  });

  return () => {
    halt(true);
    unTap();
    document.removeEventListener("pointermove", recordMove, CAPTURE_PASSIVE);
    window.removeEventListener("scroll", onScrollOrResize, CAPTURE_PASSIVE);
    window.removeEventListener("resize", onScrollOrResize);
    window.removeEventListener("blur", onBlur);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
