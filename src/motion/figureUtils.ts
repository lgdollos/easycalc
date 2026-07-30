import { easeOutCubic } from "./math";

/**
 * Shared SVG snap/lerp/easing/timing helpers for panel figure motion.
 */

export type LineSnap = { x1: number; y1: number; x2: number; y2: number };
export type PointSnap = { x: number; y: number };

export function readLineSnap(el: SVGLineElement): LineSnap {
  return {
    x1: Number(el.getAttribute("x1")),
    y1: Number(el.getAttribute("y1")),
    x2: Number(el.getAttribute("x2")),
    y2: Number(el.getAttribute("y2")),
  };
}

export function applyLine(el: SVGLineElement, s: LineSnap): void {
  el.setAttribute("x1", String(s.x1));
  el.setAttribute("y1", String(s.y1));
  el.setAttribute("x2", String(s.x2));
  el.setAttribute("y2", String(s.y2));
}

export function readTextPoint(el: SVGTextElement): PointSnap {
  return { x: Number(el.getAttribute("x")), y: Number(el.getAttribute("y")) };
}

export function applyTextPoint(el: SVGTextElement, p: PointSnap): void {
  el.setAttribute("x", String(p.x));
  el.setAttribute("y", String(p.y));
}

export function readCirclePoint(el: SVGCircleElement): PointSnap {
  return { x: Number(el.getAttribute("cx")), y: Number(el.getAttribute("cy")) };
}

export function applyCirclePoint(el: SVGCircleElement, p: PointSnap): void {
  el.setAttribute("cx", String(p.x));
  el.setAttribute("cy", String(p.y));
}

export function readCircleR(el: SVGCircleElement): number {
  return Number(el.getAttribute("r"));
}

export function applyCircleR(el: SVGCircleElement, r: number): void {
  el.setAttribute("r", String(r));
}

export const EASE_OUT_BEZ = {
  x1: 0.22,
  y1: 1,
  x2: 0.36,
  y2: 1,
} as const;

function sampleBezierComponent(t: number, p1: number, p2: number): number {
  const c = 3 * p1;
  const b = 3 * (p2 - p1) - c;
  const a = 1 - c - b;
  return ((a * t + b) * t + c) * t;
}

export function easeCssCubicBezier(
  u: number,
  bezier: { x1: number; y1: number; x2: number; y2: number } = EASE_OUT_BEZ,
): number {
  if (u <= 0) return 0;
  if (u >= 1) return 1;

  let tLow = 0;
  let tHigh = 1;
  for (let i = 0; i < 14; i++) {
    const tMid = (tLow + tHigh) * 0.5;
    const xMid = sampleBezierComponent(tMid, bezier.x1, bezier.x2);
    if (xMid < u) tLow = tMid;
    else tHigh = tMid;
  }
  const t = (tLow + tHigh) * 0.5;
  return sampleBezierComponent(t, bezier.y1, bezier.y2);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpPoint(a: PointSnap, b: PointSnap, t: number): PointSnap {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export function edgeSmooth(u: number, e0: number, e1: number): number {
  if (u <= e0) return 0;
  if (u >= e1) return 1;
  const t = (u - e0) / (e1 - e0);
  return t * t * (3 - 2 * t);
}

/** Resolves after ms, or rejects AbortError if signal aborts. */
export function pauseMs(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const t = window.setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = (): void => {
      window.clearTimeout(t);
      signal.removeEventListener("abort", onAbort);
      reject(new DOMException("Aborted", "AbortError"));
    };
    signal.addEventListener("abort", onAbort);
  });
}

export function rafFadeOpacity(
  elements: SVGElement[],
  from: number,
  to: number,
  ms: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const step = (now: number): void => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const u = Math.min(1, (now - t0) / ms);
      const o = from + (to - from) * u;
      for (const el of elements) el.style.opacity = String(o);
      if (u < 1) requestAnimationFrame(step);
      else {
        for (const el of elements) el.style.opacity = String(to);
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

export function rafGrowLine(
  el: SVGLineElement,
  x1: number,
  y1: number,
  x2End: number,
  y2End: number,
  ms: number,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    const step = (now: number): void => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const u = Math.min(1, (now - t0) / ms);
      const t = easeOutCubic(u);
      el.setAttribute("x2", String(x1 + (x2End - x1) * t));
      el.setAttribute("y2", String(y1 + (y2End - y1) * t));
      if (u < 1) requestAnimationFrame(step);
      else {
        el.setAttribute("x2", String(x2End));
        el.setAttribute("y2", String(y2End));
        resolve();
      }
    };
    requestAnimationFrame(step);
  });
}

export const CAPTURE_PASSIVE = { passive: true, capture: true } as const;

export function cssVarRoot(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

export function cancelAllAnimations(elements: Element[]): void {
  for (const el of elements) {
    for (const a of el.getAnimations()) a.cancel();
  }
}
