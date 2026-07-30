import { stackedDyDxLayout } from "../figures/stackedDyDxLayout";
import type { MountFor } from "../figures/figureMount";
import {
  applyCircleR,
  applyLine,
  applyTextPoint,
  easeCssCubicBezier,
  lerp,
  lerpPoint,
  readCircleR,
  readTextPoint,
  type LineSnap,
  type PointSnap,
} from "../motion/figureUtils";
import { createHoverMotion, type MotionCleanup } from "../motion/createHoverMotion";
import { prefersReducedMotion } from "../motion/reducedMotion";

const MERGE_MS = 700;
const REV_MS = 380;
const BAR_START_U = 0.62;
const SECANT_WIDTH_REST = 1;
const SECANT_WIDTH_MERGED = 2.5;
const POINT_R_MERGED = 4;

export function attachDyDxMergeMotion(
  panel: HTMLElement,
  mount: MountFor["dyDxMerge"],
): MotionCleanup {
  if (prefersReducedMotion()) return () => undefined;

  const { secant, fractionBar, labelDx, labelDy, labelQ, labelT, pointQ, pointT } = mount.els;
  const geom = mount.geom;

  const lay = stackedDyDxLayout(geom.qx, geom.qy, geom.tx, geom.ty);
  const barSnap: LineSnap = {
    x1: lay.cx - lay.barHalf,
    y1: lay.barY,
    x2: lay.cx + lay.barHalf,
    y2: lay.barY,
  };
  const dxRest = readTextPoint(labelDx);
  const dyRest = readTextPoint(labelDy);
  const dxEnd: PointSnap = { x: lay.cx, y: lay.dyY };
  const dyEnd: PointSnap = { x: lay.cx, y: lay.dxY };
  const qRRest = readCircleR(pointQ);
  const tRRest = readCircleR(pointT);

  let rafId = 0;
  let anim: { t0: number; u0: number; u1: number; dur: number } | null = null;
  let u = 0;

  const cancelRaf = (): void => {
    if (rafId !== 0) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };

  const applyState = (uLin: number): void => {
    applyTextPoint(labelDx, lerpPoint(dxRest, dxEnd, uLin));
    applyTextPoint(labelDy, lerpPoint(dyRest, dyEnd, uLin));
    applyCircleR(pointQ, lerp(qRRest, POINT_R_MERGED, uLin));
    applyCircleR(pointT, lerp(tRRest, POINT_R_MERGED, uLin));
    secant.setAttribute(
      "stroke-width",
      String(lerp(SECANT_WIDTH_REST, SECANT_WIDTH_MERGED, uLin)),
    );
    const o = 1 - uLin;
    labelQ.style.opacity = String(o);
    labelT.style.opacity = String(o);
    let barOp = 0;
    if (uLin > BAR_START_U) barOp = (uLin - BAR_START_U) / (1 - BAR_START_U);
    fractionBar.style.opacity = String(barOp);
    applyLine(fractionBar, barSnap);
  };

  const restoreRest = (): void => {
    cancelRaf();
    anim = null;
    u = 0;
    applyTextPoint(labelDx, dxRest);
    applyTextPoint(labelDy, dyRest);
    applyCircleR(pointQ, qRRest);
    applyCircleR(pointT, tRRest);
    secant.setAttribute("stroke-width", String(SECANT_WIDTH_REST));
    labelQ.style.removeProperty("opacity");
    labelT.style.removeProperty("opacity");
    fractionBar.style.opacity = "0";
    applyLine(fractionBar, barSnap);
  };

  const tick = (now: number): void => {
    if (!anim) {
      rafId = 0;
      return;
    }
    const raw = Math.min(1, (now - anim.t0) / anim.dur);
    u = anim.u0 + (anim.u1 - anim.u0) * easeCssCubicBezier(raw);
    applyState(u);
    if (raw < 1) {
      rafId = requestAnimationFrame(tick);
    } else {
      u = anim.u1;
      applyState(u);
      anim = null;
      rafId = 0;
    }
  };

  const startTo = (targetU: number): void => {
    const u0 = u;
    if (u0 === targetU) {
      applyState(u0);
      return;
    }
    cancelRaf();
    const span = Math.abs(targetU - u0);
    const full = targetU > u0 ? MERGE_MS : REV_MS;
    anim = { t0: performance.now(), u0, u1: targetU, dur: Math.max(1, full * span) };
    rafId = requestAnimationFrame(tick);
  };

  const kw = panel.querySelector<HTMLElement>(".panel-fig-kw-dydx");
  restoreRest();

  return createHoverMotion({
    panel,
    activateOn: kw ? [kw] : [],
    onStart: () => {
      startTo(1);
    },
    onStop: () => {
      startTo(0);
    },
  });
}
