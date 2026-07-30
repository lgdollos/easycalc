import {
  applyCirclePoint,
  applyLine,
  applyTextPoint,
  easeCssCubicBezier,
  pauseMs,
  type LineSnap,
  type PointSnap,
} from "./figureUtils";

export const TRIANGLE_GROW_MS = 2600;
export const TRIANGLE_HOLD_MS = 600;

export type TrianglePose = {
  dx: LineSnap;
  dy: LineSnap;
  sec: LineSnap;
  dxLbl: PointSnap;
  dyLbl: PointSnap;
  secLbl: PointSnap;
  tLbl: PointSnap;
  tDot: PointSnap;
};

/** Chord-progress pose: p=0 at Q, p=1 at T. */
export function triangleFromProgress(
  p: number,
  qx: number,
  qy: number,
  tx: number,
  ty: number,
): TrianglePose {
  const cx = qx + p * (tx - qx);
  const yTop = qy + p * (ty - qy);
  return {
    dx: { x1: qx, y1: qy, x2: cx, y2: qy },
    dy: { x1: cx, y1: qy, x2: cx, y2: yTop },
    sec: { x1: qx, y1: qy, x2: cx, y2: yTop },
    dxLbl: { x: (qx + cx) / 2, y: qy + 23 },
    dyLbl: { x: cx + 7, y: (qy + yTop) / 2 },
    secLbl: { x: (qx + cx) / 2 + 4, y: (qy + yTop) / 2 - 11 },
    tLbl: { x: cx - 16, y: yTop - 10 },
    tDot: { x: cx, y: yTop },
  };
}

/** Full triangle at a concrete T. */
export function triangleAtT(qx: number, qy: number, tx: number, ty: number): TrianglePose {
  return {
    dx: { x1: qx, y1: qy, x2: tx, y2: qy },
    dy: { x1: tx, y1: qy, x2: tx, y2: ty },
    sec: { x1: qx, y1: qy, x2: tx, y2: ty },
    dxLbl: { x: (qx + tx) / 2, y: qy + 23 },
    dyLbl: { x: tx + 7, y: (qy + ty) / 2 },
    secLbl: { x: (qx + tx) / 2 + 4, y: (qy + ty) / 2 - 11 },
    tLbl: { x: tx - 16, y: ty - 16 },
    tDot: { x: tx, y: ty },
  };
}

export type TriangleEls = {
  dx: SVGLineElement;
  dy: SVGLineElement;
  sec?: SVGLineElement | null;
  dxLbl?: SVGTextElement | null;
  dyLbl?: SVGTextElement | null;
  secLbl?: SVGTextElement | null;
  tLbl?: SVGTextElement | null;
  tDot?: SVGCircleElement | null;
};

export function applyTrianglePose(els: TriangleEls, pose: TrianglePose): void {
  applyLine(els.dx, pose.dx);
  applyLine(els.dy, pose.dy);
  if (els.sec) applyLine(els.sec, pose.sec);
  if (els.dxLbl) applyTextPoint(els.dxLbl, pose.dxLbl);
  if (els.dyLbl) applyTextPoint(els.dyLbl, pose.dyLbl);
  if (els.secLbl) applyTextPoint(els.secLbl, pose.secLbl);
  if (els.tLbl) applyTextPoint(els.tLbl, pose.tLbl);
  if (els.tDot) applyCirclePoint(els.tDot, pose.tDot);
}

/** RAF ease from 0→1; rejects AbortError when signal aborts. */
export function rafEaseProgress(
  ms: number,
  signal: AbortSignal,
  apply: (eased: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const t0 = performance.now();
    let rafId = 0;
    const tick = (now: number): void => {
      if (signal.aborted) {
        cancelAnimationFrame(rafId);
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      const u = Math.min(1, (now - t0) / ms);
      apply(easeCssCubicBezier(u));
      if (u < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };
    apply(0);
    rafId = requestAnimationFrame(tick);
  });
}

/**
 * Grow/shrink loop: animate → optional afterAnim → hold → repeat until abort.
 */
export async function runTriangleCycle(opts: {
  signal: AbortSignal;
  animate: (signal: AbortSignal) => Promise<void>;
  afterAnim?: (signal: AbortSignal) => Promise<void>;
  holdMs?: number;
}): Promise<void> {
  const holdMs = opts.holdMs ?? TRIANGLE_HOLD_MS;
  while (!opts.signal.aborted) {
    try {
      await opts.animate(opts.signal);
    } catch {
      break;
    }
    if (opts.signal.aborted) break;

    if (opts.afterAnim) {
      try {
        await opts.afterAnim(opts.signal);
      } catch {
        break;
      }
      if (opts.signal.aborted) break;
    }

    try {
      await pauseMs(holdMs, opts.signal);
    } catch {
      break;
    }
  }
}
