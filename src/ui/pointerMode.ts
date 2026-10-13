const FINE_HOVER_MQ = "(hover: hover) and (pointer: fine)";
const COARSE_MQ = "(any-pointer: coarse)";
const TAP_SLOP_PX = 28;
const TAP_DEBOUNCE_MS = 400;
const TOUCH_HOVER_GUARD_MS = 1500;

let lastTouchAt = 0;

function markTouch(): void {
  lastTouchAt = performance.now();
}

window.addEventListener("touchstart", markTouch, { capture: true, passive: true });

export function isRecentTouch(): boolean {
  return performance.now() - lastTouchAt < TOUCH_HOVER_GUARD_MS;
}

export function hasFineHover(): boolean {
  if (navigator.maxTouchPoints > 0) return false;
  if (window.matchMedia(COARSE_MQ).matches) return false;
  return window.matchMedia(FINE_HOVER_MQ).matches;
}

export function hoverOrTapLabel(): "Hover" | "Tap" {
  return hasFineHover() ? "Hover" : "Tap";
}

export function subscribeFineHover(onChange: (fine: boolean) => void): () => void {
  const fineMq = window.matchMedia(FINE_HOVER_MQ);
  const coarseMq = window.matchMedia(COARSE_MQ);
  const handler = (): void => {
    onChange(hasFineHover());
  };
  fineMq.addEventListener("change", handler);
  coarseMq.addEventListener("change", handler);
  return () => {
    fineMq.removeEventListener("change", handler);
    coarseMq.removeEventListener("change", handler);
  };
}

/**
 * iOS Safari: pointerup is often cancelled on a scrollable page, and click on a
 * non-link is unreliable. touchend with slop is the event that actually fires.
 */
export function bindTap(el: HTMLElement, onTap: (e: Event) => void): () => void {
  let x0 = 0;
  let y0 = 0;
  let touchId = -1;
  let tracking = false;
  let lastFire = 0;

  const fire = (e: Event): void => {
    const now = performance.now();
    if (now - lastFire < TAP_DEBOUNCE_MS) return;
    lastFire = now;
    markTouch();
    onTap(e);
  };

  const onTouchStart = (e: TouchEvent): void => {
    const t = e.changedTouches[0];
    if (!t) return;
    markTouch();
    touchId = t.identifier;
    x0 = t.clientX;
    y0 = t.clientY;
    tracking = true;
  };

  const movedPastSlop = (t: Touch): boolean => Math.hypot(t.clientX - x0, t.clientY - y0) > TAP_SLOP_PX;

  const onTouchMove = (e: TouchEvent): void => {
    if (!tracking) return;
    for (const t of e.changedTouches) {
      if (t.identifier === touchId && movedPastSlop(t)) {
        tracking = false;
        return;
      }
    }
  };

  const onTouchEnd = (e: TouchEvent): void => {
    if (!tracking) return;
    tracking = false;
    let t: Touch | undefined;
    for (const item of e.changedTouches) {
      if (item.identifier === touchId) {
        t = item;
        break;
      }
    }
    if (!t || movedPastSlop(t)) return;
    fire(e);
  };

  const onTouchCancel = (): void => {
    tracking = false;
  };

  const onClick = (e: MouseEvent): void => {
    if (hasFineHover() && !isRecentTouch()) return;
    fire(e);
  };

  const tapOpts: AddEventListenerOptions = { capture: true, passive: true };
  el.addEventListener("touchstart", onTouchStart, tapOpts);
  el.addEventListener("touchmove", onTouchMove, tapOpts);
  el.addEventListener("touchend", onTouchEnd, tapOpts);
  el.addEventListener("touchcancel", onTouchCancel, tapOpts);
  el.addEventListener("click", onClick, { capture: true });
  return () => {
    el.removeEventListener("touchstart", onTouchStart, tapOpts);
    el.removeEventListener("touchmove", onTouchMove, tapOpts);
    el.removeEventListener("touchend", onTouchEnd, tapOpts);
    el.removeEventListener("touchcancel", onTouchCancel, tapOpts);
    el.removeEventListener("click", onClick, { capture: true });
  };
}
