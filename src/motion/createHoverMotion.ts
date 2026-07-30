export type MotionCleanup = () => void;

export type CreateHoverMotionOptions = {
  panel: HTMLElement;
  /** Keywords / controls that also activate via pointer or focus. */
  activateOn?: HTMLElement[];
  /**
   * Called when motion becomes active. Abort when inactive.
   * Loop yourself while `!signal.aborted` if the effect should repeat.
   */
  onStart: (signal: AbortSignal) => void | Promise<void>;
  /** Called when motion becomes inactive (after abort). */
  onStop: () => void;
};

/**
 * Unified panel hover/focus activation + AbortController cleanup contract.
 * All attachMotion modules should return the cleanup from this (or compose it).
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

  const stop = (): void => {
    if (!runAbort) {
      onStop();
      return;
    }
    runAbort.abort();
    runAbort = null;
    onStop();
  };

  const start = (): void => {
    if (runAbort) return;
    const ac = new AbortController();
    runAbort = ac;
    void Promise.resolve(onStart(ac.signal)).finally(() => {
      if (runAbort === ac) runAbort = null;
    });
  };

  const reconcile = (): void => {
    if (isActive()) start();
    else stop();
  };

  const onPanelEnter = (): void => {
    panelPointer = true;
    reconcile();
  };
  const onPanelLeave = (): void => {
    panelPointer = false;
    requestAnimationFrame(reconcile);
  };

  panel.addEventListener("pointerenter", onPanelEnter, { passive: true });
  panel.addEventListener("pointerleave", onPanelLeave, { passive: true });

  const keywordCleanups: Array<() => void> = [];
  for (const el of activateOn) {
    const onKwEnter = (): void => {
      keywordPointer.add(el);
      reconcile();
    };
    const onKwLeave = (): void => {
      keywordPointer.delete(el);
      requestAnimationFrame(reconcile);
    };
    const onFocusIn = (): void => {
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

  return () => {
    stop();
    panel.removeEventListener("pointerenter", onPanelEnter);
    panel.removeEventListener("pointerleave", onPanelLeave);
    for (const c of keywordCleanups) c();
  };
}
