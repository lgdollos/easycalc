import type { MountFor } from "../figures/figureMount";
import { INK, extendLine } from "../figures/svgHelpers";
import {
  applyCirclePoint,
  applyLine,
  applyTextPoint,
  easeCssCubicBezier,
  edgeSmooth,
  type LineSnap,
} from "../motion/figureUtils";
import { accentFromCss } from "../motion/accent";
import { bindFlagHovers } from "../motion/bindFlagHovers";
import { createHoverMotion, type MotionCleanup } from "../motion/createHoverMotion";
import { skipHoverMotion } from "../motion/reducedMotion";
import {
  runTriangleCycle,
  triangleAtT,
  TRIANGLE_GROW_MS,
} from "../motion/triangleCycle";

function producedPair(
  qx: number,
  qy: number,
  tx: number,
  ty: number,
  scale: number,
): [LineSnap, LineSnap] {
  const ext = extendLine(qx, qy, tx, ty, scale);
  const mx = (qx + tx) / 2;
  const my = (qy + ty) / 2;
  return [
    { x1: mx, y1: my, x2: ext.x1, y2: ext.y1 },
    { x1: mx, y1: my, x2: ext.x2, y2: ext.y2 },
  ];
}

export function attachLimitShrinkMotion(
  panel: HTMLElement,
  mount: MountFor["limitShrink"],
): MotionCleanup {
  if (skipHoverMotion()) return () => undefined;

  const {
    dx,
    dy,
    produced,
    limit,
    pointQ,
    pointT,
    labelQ,
    labelT,
    labelDx0,
  } = mount.els;
  const geom = mount.geom;
  const kw = panel.querySelector<HTMLElement>(".panel-fig-kw-touch");
  if (!kw) return () => undefined;

  const [prodL, prodR] = produced;
  const { qx, qy, tx: txSmall, ty: tySmall, txFrom: txBig, tyFrom: tyBig } = geom;

  const limitRest = {
    x1: Number(limit.getAttribute("x1")),
    y1: Number(limit.getAttribute("y1")),
    x2: Number(limit.getAttribute("x2")),
    y2: Number(limit.getAttribute("y2")),
  };
  const qDotRest = { x: Number(pointQ.getAttribute("cx")), y: Number(pointQ.getAttribute("cy")) };
  const qLabRest = { x: Number(labelQ.getAttribute("x")), y: Number(labelQ.getAttribute("y")) };
  const dx0Rest = { x: Number(labelDx0.getAttribute("x")), y: Number(labelDx0.getAttribute("y")) };
  const restPose = triangleAtT(qx, qy, txSmall, tySmall);
  const restProd = producedPair(qx, qy, txSmall, tySmall, 105);

  let kwPointerInside = false;
  let cachedAccent: string | null = null;
  const accentColor = (): string => {
    if (!cachedAccent) cachedAccent = accentFromCss();
    return cachedAccent;
  };
  const colorSchemeMq = window.matchMedia("(prefers-color-scheme: dark)");
  const onColorSchemeChange = (): void => {
    cachedAccent = null;
  };
  colorSchemeMq.addEventListener("change", onColorSchemeChange);

  const accentWanted = (): boolean => kwPointerInside || document.activeElement === kw;

  const applyGeometry = (tx: number, ty: number): void => {
    const g = triangleAtT(qx, qy, tx, ty);
    applyLine(dx, g.dx);
    applyLine(dy, g.dy);
    const [pl, pr] = producedPair(qx, qy, tx, ty, 105);
    applyLine(prodL, pl);
    applyLine(prodR, pr);
    applyCirclePoint(pointT, g.tDot);
    applyTextPoint(labelT, g.tLbl);
  };

  const applyAnimStyles = (u: number): void => {
    const e = easeCssCubicBezier(Math.min(1, u));
    applyGeometry(txBig + e * (txSmall - txBig), tyBig + e * (tySmall - tyBig));

    const fTri = 1 - edgeSmooth(u, 0.38, 0.9);
    const fT = 1 - edgeSmooth(u, 0.34, 0.86);
    const fDx0 = edgeSmooth(u, 0, 0.18);
    const fLim = edgeSmooth(u, 0.76, 0.995);
    const useAccent = accentWanted();
    const ac = useAccent ? accentColor() : INK;
    const qWarm = !useAccent || u < 0.07 ? INK : ac;
    const auxWarm = !useAccent || u < 0.11 ? INK : ac;

    dx.style.opacity = String(fTri);
    dy.style.opacity = String(fTri);
    prodL.style.opacity = String(fTri);
    prodR.style.opacity = String(fTri);
    pointT.style.opacity = String(fT);
    labelT.style.opacity = String(fT);
    labelDx0.style.opacity = String(fDx0);
    limit.style.opacity = String(fLim);

    pointQ.style.fill = qWarm;
    labelQ.style.fill = qWarm;
    pointT.style.fill = auxWarm;
    labelT.style.fill = auxWarm;
    dx.style.stroke = auxWarm;
    dy.style.stroke = auxWarm;
    prodL.style.stroke = auxWarm;
    prodR.style.stroke = auxWarm;
  };

  const restoreRestGeometry = (): void => {
    applyLine(dx, restPose.dx);
    applyLine(dy, restPose.dy);
    applyLine(prodL, restProd[0]);
    applyLine(prodR, restProd[1]);
    applyLine(limit, limitRest);
    applyCirclePoint(pointQ, qDotRest);
    applyCirclePoint(pointT, restPose.tDot);
    applyTextPoint(labelQ, qLabRest);
    applyTextPoint(labelT, restPose.tLbl);
    applyTextPoint(labelDx0, dx0Rest);
    for (const el of [dx, dy, prodL, prodR, limit, pointQ, pointT, labelQ, labelT, labelDx0]) {
      el.style.removeProperty("fill");
      el.style.removeProperty("stroke");
    }
    dx.style.opacity = "0";
    dy.style.opacity = "0";
    prodL.style.opacity = "0";
    prodR.style.opacity = "0";
    pointT.style.opacity = "0";
    labelT.style.opacity = "0";
    limit.style.removeProperty("opacity");
    labelDx0.style.removeProperty("opacity");
  };

  const runShrink = (signal: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
      applyGeometry(txBig, tyBig);
      limit.style.opacity = "0";
      labelDx0.style.opacity = "0";
      dx.style.opacity = "1";
      dy.style.opacity = "1";
      prodL.style.opacity = "1";
      prodR.style.opacity = "1";
      pointT.style.opacity = "1";
      labelT.style.opacity = "1";
      applyAnimStyles(0);

      const t0 = performance.now();
      const tick = (now: number): void => {
        if (signal.aborted) {
          reject(new DOMException("Aborted", "AbortError"));
          return;
        }
        const u = Math.min(1, (now - t0) / TRIANGLE_GROW_MS);
        applyAnimStyles(u);
        if (u < 1) {
          requestAnimationFrame(tick);
        } else {
          applyGeometry(txSmall, tySmall);
          applyLine(limit, limitRest);
          dx.style.opacity = "0";
          dy.style.opacity = "0";
          prodL.style.opacity = "0";
          prodR.style.opacity = "0";
          pointT.style.opacity = "0";
          labelT.style.opacity = "0";
          limit.style.opacity = "1";
          labelDx0.style.opacity = "1";
          const endFill = accentWanted() ? accentColor() : INK;
          pointQ.style.fill = endFill;
          labelQ.style.fill = endFill;
          resolve();
        }
      };
      requestAnimationFrame(tick);
    });

  const unKw = bindFlagHovers([kw], (v) => {
    kwPointerInside = v;
  });

  const hoverCleanup = createHoverMotion({
    panel,
    activateOn: [kw],
    onStart: async (signal, { playOnce }) => {
      await runTriangleCycle({
        signal,
        playOnce,
        animate: runShrink,
      });
    },
    onStop: restoreRestGeometry,
  });

  return () => {
    hoverCleanup();
    unKw();
    colorSchemeMq.removeEventListener("change", onColorSchemeChange);
  };
}
