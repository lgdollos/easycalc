import type { PanelFigureSpec } from "../content/panels";
import type {
  MountFor,
  PanelFigureGeom,
  PanelFigureGeomWithFrom,
  PanelFigureMount,
} from "./figureMount";
import {
  X0,
  curvePath,
  f,
  fp,
  FIG_HEIGHT,
  FIG_WIDTH,
  mathToSvg,
  PROJECTION_GUIDE_DASH,
  SECANT_DASH,
  LIMIT_DASH,
  createScales,
  type Scales,
} from "./coords";
import {
  INK,
  FIG_FONT_SCALE,
  circleEl,
  drawAxes,
  lineEl,
  producedSecantPair,
  setAttrs,
  textEl,
} from "./svgHelpers";
import { stackedDyDxLayout } from "./stackedDyDxLayout";

function tangentCaptionBelowQ(
  Qx: number,
  Qy: number,
  lineX1: number,
  lineY1: number,
  lineX2: number,
  lineY2: number,
  offN: number,
): { cx: number; cy: number } {
  const vx = lineX2 - lineX1;
  const vy = lineY2 - lineY1;
  const len = Math.hypot(vx, vy) || 1;
  let nx = -vy / len;
  let ny = vx / len;
  if (ny < 0) {
    nx = -nx;
    ny = -ny;
  }
  return { cx: Qx + nx * offN, cy: Qy + ny * offN };
}

function extendLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  scale: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return {
    x1: x1 - ux * scale,
    y1: y1 - uy * scale,
    x2: x2 + ux * scale,
    y2: y2 + uy * scale,
  };
}

type FigureShell = {
  svg: SVGSVGElement;
  root: SVGGElement;
  scales: Scales;
};

type SvgPoint = { x: number; y: number; mx: number; my: number };

function createFigureShell(): FigureShell {
  const scales = createScales();
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  setAttrs(svg, {
    viewBox: `0 0 ${FIG_WIDTH} ${FIG_HEIGHT}`,
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-hidden": "true",
  });
  svg.setAttribute("class", "panel-figure-svg");

  const root = document.createElementNS("http://www.w3.org/2000/svg", "g");
  root.setAttribute("class", "fig-root");
  svg.append(root);

  drawAxes(root, scales, "fig");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", curvePath(scales));
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", INK);
  path.setAttribute("stroke-width", "1.55");
  path.setAttribute("class", "fig-curve");
  root.append(path);

  return { svg, root, scales };
}

function svgPoint(scales: Scales, mx: number): SvgPoint {
  const my = f(mx);
  const [x, y] = mathToSvg(scales, mx, my);
  return { x, y, mx, my };
}

function geomFromPoints(q: SvgPoint, t: SvgPoint): PanelFigureGeom {
  return { qx: q.x, qy: q.y, tx: t.x, ty: t.y };
}

function geomWithFrom(q: SvgPoint, t: SvgPoint, from: SvgPoint): PanelFigureGeomWithFrom {
  return { qx: q.x, qy: q.y, tx: t.x, ty: t.y, txFrom: from.x, tyFrom: from.y };
}

function dashedProjections(
  root: SVGGElement,
  scales: Scales,
  xq: number,
  yq: number,
  Qx: number,
  Qy: number,
  withLabels: true,
): {
  projX: SVGLineElement;
  projY: SVGLineElement;
  tickX: SVGTextElement;
  tickY: SVGTextElement;
};
function dashedProjections(
  root: SVGGElement,
  scales: Scales,
  xq: number,
  yq: number,
  Qx: number,
  Qy: number,
  withLabels: boolean,
): {
  projX: SVGLineElement;
  projY: SVGLineElement;
  tickX: SVGTextElement | null;
  tickY: SVGTextElement | null;
};
function dashedProjections(
  root: SVGGElement,
  scales: Scales,
  xq: number,
  yq: number,
  Qx: number,
  Qy: number,
  withLabels: boolean,
) {
  const yBottom = scales.y.domain()[0]!;
  const xLeft = scales.x.domain()[0]!;
  const [, footY] = mathToSvg(scales, xq, yBottom);
  const [footX] = mathToSvg(scales, xLeft, yq);
  const lx = lineEl(Qx, Qy, Qx, footY, INK, { strokeWidth: 0.85, dash: PROJECTION_GUIDE_DASH });
  lx.setAttribute("class", "fig-proj-x");
  const ly = lineEl(Qx, Qy, footX, Qy, INK, { strokeWidth: 0.85, dash: PROJECTION_GUIDE_DASH });
  ly.setAttribute("class", "fig-proj-y");
  root.append(lx, ly);

  let tickX: SVGTextElement | null = null;
  let tickY: SVGTextElement | null = null;
  if (withLabels) {
    tickX = textEl(Qx + 4, footY + 13, "x", INK, 12);
    tickX.setAttribute("class", "fig-tick-x");
    tickY = textEl(footX - 4, Qy - 4, "y", INK, 12);
    tickY.setAttribute("text-anchor", "end");
    tickY.setAttribute("class", "fig-tick-y");
    root.append(tickX, tickY);
  }
  return { projX: lx, projY: ly, tickX, tickY };
}

function renderPointQ(): MountFor["pointQ"] {
  const { svg, root, scales } = createFigureShell();
  const q = svgPoint(scales, X0);

  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const labelQ = textEl(q.x - 16, q.y - 18, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  root.append(pointQ, labelQ);

  const proj = dashedProjections(root, scales, q.mx, q.my, q.x, q.y, true);

  return {
    kind: "pointQ",
    svg,
    els: {
      pointQ,
      labelQ,
      projX: proj.projX,
      projY: proj.projY,
      tickX: proj.tickX,
      tickY: proj.tickY,
    },
    geom: geomFromPoints(q, q),
  };
}

function renderTangent(spec: PanelFigureSpec): MountFor["tangent"] {
  const { svg, root, scales } = createFigureShell();
  const xq = spec.qMathX ?? X0;
  const q = svgPoint(scales, xq);
  const m = fp(xq);
  const dMath = 1.12;
  const [x1, y1] = mathToSvg(scales, xq - dMath, q.my - m * dMath);
  const [x2, y2] = mathToSvg(scales, xq + dMath, q.my + m * dMath);

  const tangent = lineEl(x1, y1, x2, y2, INK, { strokeWidth: 1, dash: SECANT_DASH });
  tangent.setAttribute("class", "fig-tangent");
  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const labelQ = textEl(q.x, q.y - 20, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  labelQ.setAttribute("text-anchor", "middle");
  root.append(tangent, pointQ, labelQ);

  const capPos = tangentCaptionBelowQ(q.x, q.y, x1, y1, x2, y2, 46);
  const slope = textEl(capPos.cx, capPos.cy, "dy/dx = slope of tangent", INK, 11);
  slope.setAttribute("class", "fig-tangent-caption");
  slope.setAttribute("text-anchor", "end");
  root.append(slope);

  return {
    kind: "tangent",
    svg,
    els: { tangent, pointQ, labelQ },
    geom: geomFromPoints(q, q),
  };
}

function renderLimitShrink(spec: PanelFigureSpec): MountFor["limitShrink"] {
  const { svg, root, scales } = createFigureShell();
  const xq = spec.qMathX ?? X0;
  const q = svgPoint(scales, xq);
  const t = svgPoint(scales, xq + (spec.deltaX ?? 0));
  const from = svgPoint(scales, xq + (spec.shrinkFromDeltaX ?? spec.deltaX ?? 0));

  const dx = lineEl(q.x, q.y, t.x, q.y, INK, { strokeWidth: 1 });
  dx.setAttribute("class", "fig-dx");
  dx.style.opacity = "0";
  const dy = lineEl(t.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  dy.setAttribute("class", "fig-dy");
  dy.style.opacity = "0";

  const extLimit = extendLine(q.x, q.y, t.x, t.y, 118);
  const limit = lineEl(extLimit.x1, extLimit.y1, extLimit.x2, extLimit.y2, INK, {
    strokeWidth: 1,
    dash: LIMIT_DASH,
  });
  limit.setAttribute("class", "fig-secant fig-secant-limit");

  const [secL, secR] = producedSecantPair(q.x, q.y, t.x, t.y, 105, SECANT_DASH, INK);
  secL.style.opacity = "0";
  secR.style.opacity = "0";

  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const pointT = circleEl(t.x, t.y, 5.5, INK, "fig-point-t");
  pointT.style.opacity = "0";
  const labelQ = textEl(q.x - 16, q.y - 18, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  const labelT = textEl(t.x - 16, t.y - 16, "T", INK, 13.5);
  labelT.setAttribute("class", "fig-label-t");
  labelT.style.opacity = "0";
  const labelDx0 = textEl((q.x + t.x) / 2, q.y + 16, "dx → 0", INK, 11);
  labelDx0.setAttribute("class", "fig-label-dx0");

  root.append(dx, dy, limit, secL, secR, pointQ, pointT, labelQ, labelT, labelDx0);

  return {
    kind: "limitShrink",
    svg,
    els: {
      dx,
      dy,
      limit,
      produced: [secL, secR],
      pointQ,
      pointT,
      labelQ,
      labelT,
      labelDx0,
    },
    geom: geomWithFrom(q, t, from),
  };
}

function renderManySlopes(spec: PanelFigureSpec): MountFor["manySlopes"] {
  const { svg, root, scales } = createFigureShell();
  const q = svgPoint(scales, X0);
  const t = svgPoint(scales, X0 + (spec.deltaX ?? 0));

  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const pointT = circleEl(t.x, t.y, 5.5, INK, "fig-point-t");
  const labelQ = textEl(q.x - 16, q.y - 18, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  const labelT = textEl(t.x - 16, t.y - 16, "T", INK, 13.5);
  labelT.setAttribute("class", "fig-label-t");
  root.append(pointQ, pointT, labelQ, labelT);

  const fractions = [0.32, 0.6, 0.88] as const;
  const slopeLabelBelow = 18 * FIG_FONT_SCALE;
  const manyOverlays: SVGLineElement[] = [];
  const manyEndpoints: SVGCircleElement[] = [];
  const manyLabels: SVGTextElement[] = [];

  for (let i = 0; i < fractions.length; i++) {
    const frac = fractions[i]!;
    const xm = X0 + (spec.deltaX ?? 0) * frac;
    const mid = svgPoint(scales, xm);
    const overlayLen = Math.hypot(mid.x - q.x, mid.y - q.y);
    const overlay = lineEl(q.x, q.y, mid.x, mid.y, INK, { strokeWidth: 0.9 });
    overlay.setAttribute("class", `fig-secant-many-overlay fig-secant-many-overlay-${i + 1}`);
    overlay.style.setProperty("--secant-len", String(overlayLen));
    const endDot = circleEl(mid.x, mid.y, 3.6, INK, `fig-secant-endpoint fig-secant-endpoint-${i + 1}`);
    const sl = textEl(mid.x, mid.y + slopeLabelBelow, `slope${i + 1}`, INK, 10);
    sl.setAttribute("text-anchor", "middle");
    sl.setAttribute("class", `fig-slope-label fig-slope-label-${i + 1}`);
    root.append(overlay, endDot, sl);
    manyOverlays.push(overlay);
    manyEndpoints.push(endDot);
    manyLabels.push(sl);
  }

  return {
    kind: "manySlopes",
    svg,
    els: {
      pointQ,
      pointT,
      labelQ,
      labelT,
      manyOverlays: manyOverlays as [SVGLineElement, SVGLineElement, SVGLineElement],
      manyEndpoints: manyEndpoints as [SVGCircleElement, SVGCircleElement, SVGCircleElement],
      manyLabels: manyLabels as [SVGTextElement, SVGTextElement, SVGTextElement],
    },
    geom: geomFromPoints(q, t),
  };
}

function renderChord(spec: PanelFigureSpec): MountFor["chord"] {
  const { svg, root, scales } = createFigureShell();
  const xq = spec.qMathX ?? X0;
  const q = svgPoint(scales, xq);
  const t = svgPoint(scales, xq + (spec.deltaX ?? 0));

  const dx = lineEl(q.x, q.y, t.x, q.y, INK, { strokeWidth: 1 });
  dx.setAttribute("class", "fig-dx");
  const dy = lineEl(t.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  dy.setAttribute("class", "fig-dy");
  root.append(dx, dy);

  const labelDx = textEl((q.x + t.x) / 2, q.y + 23, "dx", INK, 13);
  labelDx.setAttribute("class", "fig-label-dx");
  const dyMidY = (q.y + t.y) / 2;
  const labelDy = textEl(t.x + 7, dyMidY, "dy", INK, 13);
  labelDy.setAttribute("class", "fig-label-dy");
  root.append(labelDx, labelDy);

  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const pointT = circleEl(t.x, t.y, 5.5, INK, "fig-point-t");
  const labelQ = textEl(q.x - 16, q.y - 18, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  const labelT = textEl(t.x - 16, t.y - 16, "T", INK, 13.5);
  labelT.setAttribute("class", "fig-label-t");
  root.append(pointQ, pointT, labelQ, labelT);

  const secant = lineEl(q.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  secant.setAttribute("class", "fig-secant");
  root.append(secant);

  let labelSecant: SVGTextElement | null = null;
  if ((spec.secantLabel ?? true) && (spec.deltaX ?? 0) >= 0.1) {
    labelSecant = textEl((q.x + t.x) / 2 + 4, (q.y + t.y) / 2 - 11, "dy/dx", INK, 11);
    labelSecant.setAttribute("class", "fig-label-secant");
    root.append(labelSecant);
  }

  let projX: SVGLineElement | null = null;
  let projY: SVGLineElement | null = null;
  let tickX: SVGTextElement | null = null;
  let tickY: SVGTextElement | null = null;
  if (spec.showQAxisProjectionGuides) {
    const proj = dashedProjections(
      root,
      scales,
      q.mx,
      q.my,
      q.x,
      q.y,
      spec.showQAxisProjectionLabels ?? false,
    );
    projX = proj.projX;
    projY = proj.projY;
    tickX = proj.tickX;
    tickY = proj.tickY;
  }

  return {
    kind: "chord",
    svg,
    els: {
      dx,
      dy,
      labelDx,
      labelDy,
      pointQ,
      pointT,
      labelQ,
      labelT,
      secant,
      labelSecant,
      projX,
      projY,
      tickX,
      tickY,
    },
    geom: geomFromPoints(q, t),
  };
}

function renderShrinkChord(spec: PanelFigureSpec): MountFor["shrinkChord"] {
  const { svg, root, scales } = createFigureShell();
  const xq = spec.qMathX ?? X0;
  const q = svgPoint(scales, xq);
  const t = svgPoint(scales, xq + (spec.deltaX ?? 0));
  const from = svgPoint(scales, xq + (spec.shrinkFromDeltaX ?? spec.deltaX ?? 0));

  const dx = lineEl(q.x, q.y, t.x, q.y, INK, { strokeWidth: 1 });
  dx.setAttribute("class", "fig-dx");
  const dy = lineEl(t.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  dy.setAttribute("class", "fig-dy");
  root.append(dx, dy);

  const labelDx = textEl((q.x + t.x) / 2, q.y + 23, "dx", INK, 13);
  labelDx.setAttribute("class", "fig-label-dx");
  const labelDy = textEl(t.x + 7, (q.y + t.y) / 2, "dy", INK, 13);
  labelDy.setAttribute("class", "fig-label-dy");
  root.append(labelDx, labelDy);

  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const pointT = circleEl(t.x, t.y, 5.5, INK, "fig-point-t");
  const labelQ = textEl(q.x - 16, q.y - 18, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  const labelT = textEl(t.x - 16, t.y - 16, "T", INK, 13.5);
  labelT.setAttribute("class", "fig-label-t");
  root.append(pointQ, pointT, labelQ, labelT);

  const highlightBox = document.createElementNS("http://www.w3.org/2000/svg", "rect");
  setAttrs(highlightBox, {
    x: Math.min(q.x, t.x) - 10,
    y: Math.min(q.y, t.y) - 10,
    width: Math.abs(t.x - q.x) + 20,
    height: Math.abs(t.y - q.y) + 20,
    fill: "none",
    stroke: INK,
    "stroke-width": 0.85,
    "stroke-dasharray": LIMIT_DASH,
  });
  highlightBox.setAttribute("class", "fig-highlight-box");
  const curve = root.querySelector(".fig-curve");
  if (curve?.nextSibling) root.insertBefore(highlightBox, curve.nextSibling);
  else root.append(highlightBox);

  const secant = lineEl(q.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  secant.setAttribute("class", "fig-secant");
  root.append(secant);

  return {
    kind: "shrinkChord",
    svg,
    els: {
      dx,
      dy,
      labelDx,
      labelDy,
      pointQ,
      pointT,
      labelQ,
      labelT,
      secant,
      highlightBox,
    },
    geom: geomWithFrom(q, t, from),
  };
}

function renderDyDxMerge(spec: PanelFigureSpec): MountFor["dyDxMerge"] {
  const { svg, root, scales } = createFigureShell();
  const xq = spec.qMathX ?? X0;
  const q = svgPoint(scales, xq);
  const t = svgPoint(scales, xq + (spec.deltaX ?? 0));

  const dx = lineEl(q.x, q.y, t.x, q.y, INK, { strokeWidth: 1 });
  dx.setAttribute("class", "fig-dx");
  const dy = lineEl(t.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  dy.setAttribute("class", "fig-dy");
  root.append(dx, dy);

  const labelDx = textEl((q.x + t.x) / 2, q.y + 23, "dx", INK, 13);
  labelDx.setAttribute("class", "fig-label-dx");
  labelDx.setAttribute("text-anchor", "middle");
  const dyMidY = (q.y + t.y) / 2;
  const labelDy = textEl(t.x + 19, dyMidY + 5, "dy", INK, 13);
  labelDy.setAttribute("class", "fig-label-dy");
  labelDy.setAttribute("text-anchor", "middle");
  root.append(labelDx, labelDy);

  const lay = stackedDyDxLayout(q.x, q.y, t.x, t.y);
  const fractionBar = lineEl(
    lay.cx - lay.barHalf,
    lay.barY,
    lay.cx + lay.barHalf,
    lay.barY,
    INK,
    { strokeWidth: 0.9, class: "fig-dydx-fraction-bar" },
  );
  fractionBar.style.opacity = "0";
  root.append(fractionBar);

  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const pointT = circleEl(t.x, t.y, 5.5, INK, "fig-point-t");
  const labelQ = textEl(q.x - 16, q.y - 18, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  const labelT = textEl(t.x - 16, t.y - 16, "T", INK, 13.5);
  labelT.setAttribute("class", "fig-label-t");
  root.append(pointQ, pointT, labelQ, labelT);

  const secant = lineEl(q.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  secant.setAttribute("class", "fig-secant");
  root.append(secant);

  return {
    kind: "dyDxMerge",
    svg,
    els: {
      dx,
      dy,
      labelDx,
      labelDy,
      pointQ,
      pointT,
      labelQ,
      labelT,
      secant,
      fractionBar,
    },
    geom: geomFromPoints(q, t),
  };
}

function renderProduced(spec: PanelFigureSpec): MountFor["produced"] {
  const { svg, root, scales } = createFigureShell();
  const xq = spec.qMathX ?? X0;
  const q = svgPoint(scales, xq);
  const t = svgPoint(scales, xq + (spec.deltaX ?? 0));

  const dx = lineEl(q.x, q.y, t.x, q.y, INK, { strokeWidth: 1 });
  dx.setAttribute("class", "fig-dx");
  const dy = lineEl(t.x, q.y, t.x, t.y, INK, { strokeWidth: 1 });
  dy.setAttribute("class", "fig-dy");
  root.append(dx, dy);

  const labelDx = textEl((q.x + t.x) / 2, q.y + 23, "dx", INK, 13);
  labelDx.setAttribute("class", "fig-label-dx");
  labelDx.setAttribute("text-anchor", "middle");
  const dyMidY = (q.y + t.y) / 2;
  const labelDy = textEl(t.x + 19, dyMidY + 5, "dy", INK, 13);
  labelDy.setAttribute("class", "fig-label-dy");
  labelDy.setAttribute("text-anchor", "middle");
  root.append(labelDx, labelDy);

  const pointQ = circleEl(q.x, q.y, 5.5, INK, "fig-point-q");
  const pointT = circleEl(t.x, t.y, 5.5, INK, "fig-point-t");
  const labelQ = textEl(q.x - 16, q.y - 18, "Q", INK, 13.5);
  labelQ.setAttribute("class", "fig-label-q");
  const labelT = textEl(t.x - 16, t.y - 16, "T", INK, 13.5);
  labelT.setAttribute("class", "fig-label-t");
  root.append(pointQ, pointT, labelQ, labelT);

  const [secL, secR] = producedSecantPair(q.x, q.y, t.x, t.y, 105, SECANT_DASH, INK);
  root.append(secL, secR);

  return {
    kind: "produced",
    svg,
    els: {
      dx,
      dy,
      labelDx,
      labelDy,
      pointQ,
      pointT,
      labelQ,
      labelT,
      produced: [secL, secR],
    },
    geom: geomFromPoints(q, t),
  };
}

export function renderPanelFigure(spec: PanelFigureSpec): PanelFigureMount {
  switch (spec.kind) {
    case "pointQ":
      return renderPointQ();
    case "tangent":
      return renderTangent(spec);
    case "limitShrink":
      return renderLimitShrink(spec);
    case "manySlopes":
      return renderManySlopes(spec);
    case "chord":
      return renderChord(spec);
    case "shrinkChord":
      return renderShrinkChord(spec);
    case "dyDxMerge":
      return renderDyDxMerge(spec);
    case "produced":
      return renderProduced(spec);
    default: {
      const _exhaustive: never = spec.kind;
      throw new Error(`Unknown panel figure kind: ${_exhaustive}`);
    }
  }
}
