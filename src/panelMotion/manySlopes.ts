import type { MountFor } from "../figures/figureMount";
import { accentFromCss } from "../motion/accent";
import {
  KW_ACTIVE_CLASS,
  MOTION_ACTIVE_CLASS,
  PANEL_MOTION_STOP_EVENT,
  type MotionCleanup,
} from "../motion/createHoverMotion";
import { skipHoverMotion } from "../motion/reducedMotion";
import { cancelAllAnimations, cssVarRoot } from "../motion/figureUtils";
import { bindTap, hasFineHover, isRecentTouch } from "../ui/pointerMode";

const DRAW_MS = 520;
const LINE_EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

function overlayStrokeLen(ln: SVGLineElement): number {
  const d = Math.hypot(
    Number(ln.getAttribute("x2")) - Number(ln.getAttribute("x1")),
    Number(ln.getAttribute("y2")) - Number(ln.getAttribute("y1")),
  );
  return d > 0.5 ? d : ln.getTotalLength();
}

export function attachManySlopesMotion(
  panel: HTMLElement,
  mount: MountFor["manySlopes"],
): MotionCleanup {
  if (skipHoverMotion()) return () => undefined;

  const slopesEl = panel.querySelector<HTMLElement>(".panel-fig-kw-slopes");
  const { manyOverlays: overlays, manyEndpoints: endpoints, manyLabels: labels } = mount.els;
  if (!slopesEl) return () => undefined;

  const lens = overlays.map(overlayStrokeLen);
  const inkColor = cssVarRoot("--ink", "#0a0a0a");
  const accentColor = accentFromCss();

  let panelPointerInside = false;
  let slopesAccentLatched = false;
  let activeLatch = false;
  let lastSlopesAccentWhileActive = false;
  let cycleGen = 0;
  let runAbort: AbortController | null = null;
  let sequenceDepth = 0;

  const slopesAccentActive = (): boolean =>
    hasFineHover()
      ? slopesEl.matches(":hover, :focus-visible")
      : slopesAccentLatched ||
        (document.activeElement === slopesEl && slopesEl.matches(":focus-visible"));
  const slopesFocusedVisible = (): boolean =>
    document.activeElement === slopesEl && slopesEl.matches(":focus-visible");
  const motionActive = (): boolean => panelPointerInside || slopesFocusedVisible();

  const cancelRun = (): void => {
    runAbort?.abort();
    runAbort = null;
    cancelAllAnimations([...overlays, ...endpoints, ...labels]);
  };

  const applyIdleStatic = (): void => {
    cancelAllAnimations([...overlays, ...endpoints, ...labels]);
    for (const ln of overlays) {
      ln.style.pointerEvents = "none";
      ln.style.strokeLinecap = "round";
      ln.style.removeProperty("stroke-dasharray");
      ln.style.removeProperty("stroke-dashoffset");
      ln.style.removeProperty("stroke");
    }
    for (const c of endpoints) {
      c.style.opacity = "1";
      c.style.removeProperty("fill");
    }
    for (const t of labels) {
      t.style.opacity = "1";
      t.style.removeProperty("fill");
    }
  };

  const applyHiddenForSequence = (): void => {
    for (let i = 0; i < overlays.length; i++) {
      const ln = overlays[i]!;
      const len = lens[i]!;
      ln.style.pointerEvents = "none";
      ln.style.strokeLinecap = "round";
      ln.style.strokeDasharray = String(len);
      ln.style.strokeDashoffset = String(len);
      ln.style.removeProperty("stroke");
    }
    for (const c of endpoints) {
      c.style.opacity = "0";
      c.style.removeProperty("fill");
    }
    for (const t of labels) {
      t.style.opacity = "0";
      t.style.removeProperty("fill");
    }
  };

  const applyVisibleColors = (): void => {
    const color = slopesAccentActive() ? accentColor : inkColor;
    for (let i = 0; i < overlays.length; i++) {
      const ln = overlays[i]!;
      const dashOff = ln.style.strokeDashoffset;
      if (dashOff === "") continue;
      const off = parseFloat(dashOff || "0");
      if (off < lens[i]! - 0.5) ln.style.stroke = color;
    }
    for (let i = 0; i < endpoints.length; i++) {
      const ep = endpoints[i]!;
      const lb = labels[i]!;
      const o =
        ep.style.opacity !== ""
          ? parseFloat(ep.style.opacity)
          : parseFloat(getComputedStyle(ep).opacity);
      if (o > 0.01) {
        ep.style.fill = color;
        lb.style.fill = color;
      }
    }
  };

  const commitSegment = (
    ln: SVGLineElement,
    len: number,
    ep: SVGCircleElement,
    lb: SVGTextElement,
    stroke: string,
    fill: string,
  ): void => {
    cancelAllAnimations([ln, ep, lb]);
    ln.style.strokeDasharray = String(len);
    ln.style.strokeDashoffset = "0";
    ln.style.stroke = stroke;
    ep.style.opacity = "1";
    lb.style.opacity = "1";
    ep.style.fill = fill;
    lb.style.fill = fill;
  };

  const bumpCycle = (): void => {
    cycleGen += 1;
    cancelRun();
  };

  const playSequence = async (gen: number): Promise<void> => {
    sequenceDepth++;
    try {
      const seqAccent = slopesAccentActive();
      const strokeSeq = seqAccent ? accentColor : inkColor;
      const fillSeq = strokeSeq;
      const ac = new AbortController();
      runAbort = ac;
      const { signal } = ac;

      for (let i = 0; i < overlays.length; i++) {
        if (gen !== cycleGen || signal.aborted || !motionActive()) return;
        const ln = overlays[i]!;
        const len = lens[i]!;
        const ep = endpoints[i]!;
        const lb = labels[i]!;
        ln.style.strokeDasharray = String(len);
        ln.style.strokeDashoffset = String(len);
        ln.style.stroke = strokeSeq;
        ep.style.fill = fillSeq;
        lb.style.fill = fillSeq;

        try {
          await Promise.all([
            ln.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], {
              duration: DRAW_MS,
              easing: LINE_EASE,
              fill: "forwards",
            }).finished,
            ep.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: DRAW_MS,
              easing: LINE_EASE,
              fill: "forwards",
            }).finished,
            lb.animate([{ opacity: 0 }, { opacity: 1 }], {
              duration: DRAW_MS,
              easing: LINE_EASE,
              fill: "forwards",
            }).finished,
          ]);
        } catch {
          return;
        }

        if (gen !== cycleGen || signal.aborted || !motionActive()) return;
        commitSegment(ln, len, ep, lb, strokeSeq, fillSeq);
      }
    } finally {
      sequenceDepth--;
      if (gen === cycleGen && !hasFineHover() && sequenceDepth === 0) {
        panelPointerInside = false;
        slopesAccentLatched = false;
        slopesEl.classList.remove(KW_ACTIVE_CLASS);
        panel.classList.remove(MOTION_ACTIVE_CLASS);
        applyIdleStatic();
        activeLatch = false;
        lastSlopesAccentWhileActive = false;
        panel.dispatchEvent(new Event(PANEL_MOTION_STOP_EVENT));
      }
    }
  };

  const reconcile = (): void => {
    const now = motionActive();
    const accent = slopesAccentActive();
    if (now !== activeLatch) {
      activeLatch = now;
      if (now) {
        bumpCycle();
        applyHiddenForSequence();
        void playSequence(cycleGen);
      } else {
        bumpCycle();
        applyIdleStatic();
      }
    } else if (now && !lastSlopesAccentWhileActive && accent) {
      bumpCycle();
      applyHiddenForSequence();
      void playSequence(cycleGen);
    } else if (now && sequenceDepth === 0) {
      applyVisibleColors();
    }
    lastSlopesAccentWhileActive = now ? accent : false;
  };

  const isMouseHover = (e: PointerEvent): boolean =>
    e.pointerType === "mouse" && hasFineHover() && !isRecentTouch();

  const onPanelEnter = (e: PointerEvent): void => {
    if (!isMouseHover(e)) return;
    panelPointerInside = true;
    reconcile();
  };
  const onPanelLeave = (e: PointerEvent): void => {
    if (!isMouseHover(e)) return;
    panelPointerInside = false;
    reconcile();
  };
  const onSlopesPointer = (e: PointerEvent): void => {
    if (!isMouseHover(e)) return;
    reconcile();
  };
  panel.addEventListener("pointerenter", onPanelEnter, { passive: true });
  panel.addEventListener("pointerleave", onPanelLeave, { passive: true });
  slopesEl.addEventListener("focusin", reconcile);
  slopesEl.addEventListener("focusout", reconcile);
  slopesEl.addEventListener("pointerenter", onSlopesPointer, { passive: true });
  slopesEl.addEventListener("pointerleave", onSlopesPointer, { passive: true });

  const unTap = bindTap(panel, (e) => {
    const onKw = e.target instanceof Node && (slopesEl === e.target || slopesEl.contains(e.target));
    slopesAccentLatched = onKw;
    slopesEl.classList.toggle(KW_ACTIVE_CLASS, onKw);
    panel.classList.add(MOTION_ACTIVE_CLASS);
    panelPointerInside = true;
    activeLatch = false;
    reconcile();
  });

  applyIdleStatic();

  return () => {
    bumpCycle();
    applyIdleStatic();
    unTap();
    panel.classList.remove(MOTION_ACTIVE_CLASS);
    slopesEl.classList.remove(KW_ACTIVE_CLASS);
    panel.removeEventListener("pointerenter", onPanelEnter);
    panel.removeEventListener("pointerleave", onPanelLeave);
    slopesEl.removeEventListener("focusin", reconcile);
    slopesEl.removeEventListener("focusout", reconcile);
    slopesEl.removeEventListener("pointerenter", onSlopesPointer);
    slopesEl.removeEventListener("pointerleave", onSlopesPointer);
  };
}
