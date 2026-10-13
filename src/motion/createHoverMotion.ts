import { bindTap, hasFineHover, isRecentTouch } from "../ui/pointerMode";

export type MotionCleanup = () => void;

export const PANEL_MOTION_STOP_EVENT = "panel-motion-stop";
export const PANEL_MOTION_TAP_EVENT = "panel-motion-tap";
export const MOTION_ACTIVE_CLASS = "is-motion-active";
export const KW_ACTIVE_CLASS = "is-kw-active";

export type HoverMotionStartOpts = {
  playOnce: boolean;
};

export type CreateHoverMotionOptions = {
  panel: HTMLElement;
  /** Keywords / controls that also activate via pointer or focus. */
  activateOn?: HTMLElement[];
  /**
   * Called when motion becomes active. Abort when inactive.
   * Loop yourself while `!signal.aborted` if the effect should repeat.
   * `playOnce` is true on coarse pointers: run one cycle then return.
   */
  onStart: (signal: AbortSignal, opts: HoverMotionStartOpts) => void | Promise<void>;
  /** Called when motion becomes inactive (after abort). */
  onStop: () => void;
};

export function dispatchPanelTap(panel: HTMLElement, target: EventTarget | null): void {
  panel.dispatchEvent(new CustomEvent(PANEL_MOTION_TAP_EVENT, { detail: { target } }));
}

/**
 * Unified panel hover/focus activation + AbortController cleanup contract.
 * Coarse pointers: tap plays once then onStop. Fine hover: enter/leave hold.
 */
export function createHoverMotion(opts: CreateHoverMotionOptions): MotionCleanup {
  const { panel, activateOn = [], onStart, onStop } = opts;

  let panelPointer = false;
  const keywordPointer = new Set<HTMLElement>();
  const keywordFocus = new Set<HTMLElement>();
  let runAbort: AbortController | null = null;

  const isActive = (): boolean =>
    panelPointer ||
    keywordPointer.size > 0 ||
    [...keywordFocus].some((el) => document.activeElement === el);

  const emitStop = (): void => {
    panel.dispatchEvent(new Event(PANEL_MOTION_STOP_EVENT));
  };

  const clearKwActive = (): void => {
    for (const el of activateOn) el.classList.remove(KW_ACTIVE_CLASS);
  };

  const stop = (emit = true): void => {
    panel.classList.remove(MOTION_ACTIVE_CLASS);
    if (emit) clearKwActive();
    if (!runAbort) {
      onStop();
      if (emit) emitStop();
      return;
    }
    runAbort.abort();
    runAbort = null;
    onStop();
    if (emit) emitStop();
  };

  const start = (playOnce: boolean): void => {
    if (runAbort) return;
    const ac = new AbortController();
    runAbort = ac;
    panel.classList.add(MOTION_ACTIVE_CLASS);
    void Promise.resolve(onStart(ac.signal, { playOnce })).finally(() => {
      if (runAbort !== ac) return;
      if (playOnce) {
        stop();
        return;
      }
      runAbort = null;
    });
  };

  const restartOnce = (): void => {
    if (runAbort) stop(false);
    start(true);
  };

  const reconcile = (): void => {
    if (isActive()) start(false);
    else stop();
  };

  const isMouseHover = (e: PointerEvent): boolean =>
    e.pointerType === "mouse" && hasFineHover() && !isRecentTouch();

  const onPanelEnter = (e: PointerEvent): void => {
    if (!isMouseHover(e)) return;
    panelPointer = true;
    reconcile();
  };
  const onPanelLeave = (e: PointerEvent): void => {
    if (!isMouseHover(e)) return;
    panelPointer = false;
    requestAnimationFrame(reconcile);
  };

  panel.addEventListener("pointerenter", onPanelEnter, { passive: true });
  panel.addEventListener("pointerleave", onPanelLeave, { passive: true });

  const keywordCleanups: Array<() => void> = [];
  for (const el of activateOn) {
    const onKwEnter = (e: PointerEvent): void => {
      if (!isMouseHover(e)) return;
      keywordPointer.add(el);
      reconcile();
    };
    const onKwLeave = (e: PointerEvent): void => {
      if (!isMouseHover(e)) return;
      keywordPointer.delete(el);
      requestAnimationFrame(reconcile);
    };
    const onFocusIn = (): void => {
      if (isRecentTouch() || !hasFineHover()) return;
      keywordFocus.add(el);
      reconcile();
    };
    const onFocusOut = (): void => {
      keywordFocus.delete(el);
      requestAnimationFrame(reconcile);
    };
    el.addEventListener("pointerenter", onKwEnter, { passive: true });
    el.addEventListener("pointerleave", onKwLeave, { passive: true });
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    keywordCleanups.push(() => {
      el.removeEventListener("pointerenter", onKwEnter);
      el.removeEventListener("pointerleave", onKwLeave);
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
    });
  }

  const unTap = bindTap(panel, (e) => {
    dispatchPanelTap(panel, e.target);
    for (const el of activateOn) {
      const hit = e.target instanceof Node && (el === e.target || el.contains(e.target));
      el.classList.toggle(KW_ACTIVE_CLASS, hit);
    }
    restartOnce();
  });

  return () => {
    stop();
    unTap();
    panel.removeEventListener("pointerenter", onPanelEnter);
    panel.removeEventListener("pointerleave", onPanelLeave);
    for (const c of keywordCleanups) c();
  };
}
