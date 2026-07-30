import { INK, circleEl, lineEl, setAttrs, textEl } from "../figures/svgHelpers";
import { getShape, sampleCurve, type ShapeDef } from "../shapes/defs";
import { FIG_H, FIG_PAD, FIG_W, SHAPE_FIG_IDS, type StaticFigNumber } from "./defs";

const SVG_NS = "http://www.w3.org/2000/svg";
const CURVE_STROKE = 1.7;

type LabelCorner = "upperLeft" | "upperRight" | "lowerRight";

type Scales = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  toX: (x: number) => number;
  toY: (y: number) => number;
};

type Pad = { left: number; right: number; top: number; bottom: number };

function createSvg(width: number, height: number, ariaLabel: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  setAttrs(svg, {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "100%",
    class: "chapter-fig-svg",
    role: "img",
    "aria-label": ariaLabel,
  });
  return svg;
}

function makeScales(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  width: number,
  height: number,
  pad: Pad,
): Scales {
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  return {
    xMin,
    xMax,
    yMin,
    yMax,
    toX: (x) => pad.left + ((x - xMin) / (xMax - xMin || 1)) * innerW,
    toY: (y) => pad.top + innerH - ((y - yMin) / (yMax - yMin || 1)) * innerH,
  };
}

function boundsFromPoints(
  pts: { x: number; y: number }[],
  xPadFrac = 0.08,
  yPadFrac = 0.12,
): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;
  for (const p of pts) {
    xMin = Math.min(xMin, p.x);
    xMax = Math.max(xMax, p.x);
    yMin = Math.min(yMin, p.y);
    yMax = Math.max(yMax, p.y);
  }
  const xPad = Math.max((xMax - xMin) * xPadFrac, 0.3);
  const yPad = Math.max((yMax - yMin) * yPadFrac, 0.3);
  return {
    xMin: xMin - xPad,
    xMax: xMax + xPad,
    yMin: yMin - yPad,
    yMax: yMax + yPad,
  };
}

function pathFromSamples(
  samples: { x: number; y: number }[],
  toX: (x: number) => number,
  toY: (y: number) => number,
): string {
  return samples
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.x).toFixed(2)} ${toY(p.y).toFixed(2)}`)
    .join(" ");
}

function sampleFn(
  f: (x: number) => number,
  xMin: number,
  xMax: number,
  steps = 100,
): { x: number; y: number }[] {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const x = xMin + (i / steps) * (xMax - xMin);
    return { x, y: f(x) };
  });
}

function drawCrossingAxes(
  svg: SVGSVGElement,
  scales: Scales,
  pad: Pad,
  w: number,
  h: number,
): { yAxisX: number; xAxisY: number } {
  const xAxisY = scales.toY(Math.max(scales.yMin, Math.min(scales.yMax, 0)));
  const yAxisX = scales.toX(Math.max(scales.xMin, Math.min(scales.xMax, 0)));
  const showX = xAxisY >= pad.top && xAxisY <= h - pad.bottom;
  const showY = yAxisX >= pad.left && yAxisX <= w - pad.right;

  const axY = showX ? xAxisY : h - pad.bottom;
  const axX = showY ? yAxisX : pad.left;

  svg.append(
    lineEl(pad.left, axY, w - pad.right, axY, INK, { strokeWidth: 1, class: "sf-axis-x" }),
    lineEl(axX, pad.top, axX, h - pad.bottom, INK, { strokeWidth: 1, class: "sf-axis-y" }),
  );

  const labelY = textEl(axX + 6, pad.top + 11, "Y", INK, 11);
  labelY.setAttribute("text-anchor", "start");
  labelY.setAttribute("class", "sf-label-y");

  const labelO = textEl(axX - 8, axY + 16, "O", INK, 10);
  labelO.setAttribute("text-anchor", "end");
  labelO.setAttribute("class", "sf-label-o");

  const labels: SVGTextElement[] = [labelY, labelO];
  if (showX) {
    const labelX = textEl(w - pad.right + 4, axY + 15, "X", INK, 11);
    labelX.setAttribute("text-anchor", "start");
    labelX.setAttribute("class", "sf-label-x");
    labels.push(labelX);
  }
  svg.append(...labels);

  return { yAxisX: axX, xAxisY: axY };
}

function appendCurve(
  svg: SVGSVGElement,
  d: string,
  klass = "sf-curve",
): SVGPathElement {
  const path = document.createElementNS(SVG_NS, "path");
  setAttrs(path, {
    d,
    fill: "none",
    stroke: INK,
    "stroke-width": CURVE_STROKE,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    class: klass,
  });
  svg.appendChild(path);
  return path;
}

function labelAt(
  svg: SVGSVGElement,
  x: number,
  y: number,
  text: string,
  opts: { anchor?: string; size?: number; dx?: number; dy?: number } = {},
) {
  const t = textEl(x + (opts.dx ?? 0), y + (opts.dy ?? 0), text, INK, opts.size ?? 11);
  if (opts.anchor) t.setAttribute("text-anchor", opts.anchor);
  svg.appendChild(t);
  return t;
}

const CORNER_OFFSETS: Record<LabelCorner, { dx: number; dy: number; anchor: string }> = {
  upperLeft: { dx: -18, dy: -16, anchor: "end" },
  upperRight: { dx: 14, dy: -14, anchor: "start" },
  lowerRight: { dx: 14, dy: 16, anchor: "start" },
};

function labelOnYAxis(
  svg: SVGSVGElement,
  yAxisX: number,
  interceptY: number,
  text: string,
  opts: { size?: number; below?: boolean } = {},
) {
  const below = opts.below !== false;
  const t = textEl(yAxisX - 14, interceptY + (below ? 18 : -12), text, INK, opts.size ?? 11);
  t.setAttribute("text-anchor", "end");
  svg.appendChild(t);
  return t;
}

function labelNearPoint(
  svg: SVGSVGElement,
  px: number,
  py: number,
  text: string,
  corner: LabelCorner,
  opts: { size?: number } = {},
) {
  const { dx, dy, anchor } = CORNER_OFFSETS[corner];
  const t = textEl(px + dx, py + dy, text, INK, opts.size ?? 11);
  t.setAttribute("text-anchor", anchor);
  svg.appendChild(t);
  return t;
}

function figureShell(fig: number, svg: SVGSVGElement): HTMLElement {
  const figure = document.createElement("figure");
  figure.className = "chapter-fig";
  const cap = document.createElement("figcaption");
  cap.className = "chapter-fig-label";
  cap.textContent = `Figure ${fig}`;
  figure.append(cap, svg);
  return figure;
}

function renderShapeFig(fig: number, shape: ShapeDef): HTMLElement {
  const svg = createSvg(FIG_W, FIG_H, `Figure ${fig}`);
  const pts = sampleCurve(shape, 100);
  const b = boundsFromPoints(pts);
  const scales = makeScales(b.xMin, b.xMax, b.yMin, b.yMax, FIG_W, FIG_H, FIG_PAD);
  drawCrossingAxes(svg, scales, FIG_PAD, FIG_W, FIG_H);
  appendCurve(svg, pathFromSamples(pts, scales.toX, scales.toY));
  return figureShell(fig, svg);
}

function renderFig19(): HTMLElement {
  const svg = createSvg(FIG_W, FIG_H, "Figure 19: y equals x plus b at 45 degrees");
  const b = 1.5;
  const xMin = -0.5;
  const xMax = 4;
  const f = (x: number) => x + b;
  const pts = sampleFn(f, xMin, xMax, 2);
  const scales = makeScales(xMin, xMax, -0.3, f(xMax) + 0.4, FIG_W, FIG_H, FIG_PAD);
  const { yAxisX } = drawCrossingAxes(svg, scales, FIG_PAD, FIG_W, FIG_H);
  appendCurve(svg, pathFromSamples(pts, scales.toX, scales.toY));

  // Intercept tick + label b
  const bx = scales.toX(0);
  const by = scales.toY(b);
  svg.append(circleEl(bx, by, 3.2, INK, "sf-point"));
  labelOnYAxis(svg, yAxisX, by, "b", { below: false });

  // Equal dx / dy step on the line
  const x0 = 1.2;
  const x1 = 2.2;
  const y0 = f(x0);
  const y1 = f(x1);
  const s0x = scales.toX(x0);
  const s0y = scales.toY(y0);
  const s1x = scales.toX(x1);
  const s1y = scales.toY(y1);
  const cornerX = scales.toX(x1);
  const cornerY = scales.toY(y0);

  svg.append(
    lineEl(s0x, s0y, cornerX, cornerY, INK, { strokeWidth: 1, class: "sf-dx" }),
    lineEl(cornerX, cornerY, s1x, s1y, INK, { strokeWidth: 1, class: "sf-dy" }),
  );
  labelAt(svg, (s0x + cornerX) / 2, cornerY, "dx", { dy: 16, anchor: "middle", size: 10 });
  labelAt(svg, cornerX, (cornerY + s1y) / 2, "dy", { dx: 10, dy: 4, size: 10 });

  return figureShell(19, svg);
}

function renderFig20(): HTMLElement {
  const svg = createSvg(FIG_W, FIG_H, "Figure 20: y equals a x plus b with slope one third");
  const b = 1.8;
  const a = 1 / 3;
  const xMin = -0.4;
  const xMax = 5.5;
  const f = (x: number) => a * x + b;
  const pts = sampleFn(f, xMin, xMax, 2);
  const scales = makeScales(xMin, xMax, -0.3, f(xMax) + 0.5, FIG_W, FIG_H, FIG_PAD);
  const { yAxisX } = drawCrossingAxes(svg, scales, FIG_PAD, FIG_W, FIG_H);
  appendCurve(svg, pathFromSamples(pts, scales.toX, scales.toY));

  const bx = scales.toX(0);
  const by = scales.toY(b);
  svg.append(circleEl(bx, by, 3.2, INK, "sf-point"));
  labelOnYAxis(svg, yAxisX, by, "b", { below: false });

  return figureShell(20, svg);
}

function renderFig21(): HTMLElement {
  // Magnified rise/run: dx = 3 * dy
  const w = 320;
  const h = 220;
  const pad = { left: 48, right: 36, top: 28, bottom: 40 };
  const svg = createSvg(w, h, "Figure 21: magnified dx three times dy");

  const x0 = pad.left + 20;
  const y0 = h - pad.bottom - 20;
  const dx = 180;
  const dy = 60;
  const x1 = x0 + dx;
  const y1 = y0 - dy;

  svg.append(
    lineEl(x0, y0, x1, y1, INK, { strokeWidth: CURVE_STROKE, class: "sf-slope-line" }),
    lineEl(x0, y0, x1, y0, INK, { strokeWidth: 1.2, class: "sf-dx" }),
    lineEl(x1, y0, x1, y1, INK, { strokeWidth: 1.2, class: "sf-dy" }),
  );

  labelAt(svg, (x0 + x1) / 2, y0, "dx", { dy: 20, anchor: "middle", size: 12 });
  labelAt(svg, x1, (y0 + y1) / 2, "dy", { dx: 12, dy: 4, size: 12 });

  // Tick marks suggesting 3 units along dx
  for (let i = 1; i <= 2; i++) {
    const tx = x0 + (dx * i) / 3;
    svg.append(lineEl(tx, y0 - 5, tx, y0 + 5, INK, { strokeWidth: 1 }));
  }

  return figureShell(21, svg);
}

function renderFig22(): HTMLElement {
  const svg = createSvg(FIG_W, FIG_H, "Figure 22: parabola y equals a x squared plus b");
  const b = 1.4;
  const a = 0.22;
  const xMin = -3.2;
  const xMax = 3.2;
  const f = (x: number) => a * x * x + b;
  const pts = sampleFn(f, xMin, xMax, 80);
  const scales = makeScales(xMin, xMax, -0.2, f(xMax) + 0.4, FIG_W, FIG_H, FIG_PAD);
  const { yAxisX } = drawCrossingAxes(svg, scales, FIG_PAD, FIG_W, FIG_H);
  appendCurve(svg, pathFromSamples(pts, scales.toX, scales.toY));

  const pX = scales.toX(0);
  const pY = scales.toY(b);
  svg.append(circleEl(pX, pY, 4, INK, "sf-point-p"));
  labelNearPoint(svg, pX, pY, "P", "upperRight");
  labelOnYAxis(svg, yAxisX, pY, "b", { size: 10 });

  // Q on left branch, R on right
  const qx = -2.2;
  const rx = 2.4;
  const qPx = scales.toX(qx);
  const qPy = scales.toY(f(qx));
  const rPx = scales.toX(rx);
  const rPy = scales.toY(f(rx));
  svg.append(
    circleEl(qPx, qPy, 3.2, INK, "sf-point-q"),
    circleEl(rPx, rPy, 3.2, INK, "sf-point-r"),
  );
  labelAt(svg, qPx, qPy, "Q", { dy: -26, anchor: "middle" });
  labelAt(svg, rPx, rPy, "R", { dy: -26, anchor: "middle" });

  return figureShell(22, svg);
}

function renderFig25(): HTMLElement {
  // Semicubical-style cusp pointing up: two branches meet at a sharp tip
  const svg = createSvg(FIG_W, FIG_H, "Figure 25: curve with a sudden cusp");
  const steps = 80;
  const left: { x: number; y: number }[] = [];
  const right: { x: number; y: number }[] = [];
  // Parametric cusp: x = t^2 * sign, y = 1.6 - t^3  (tip at top)
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 1.6;
    const y = 1.6 - t * t * t * 0.55;
    left.push({ x: -t * t, y });
    right.push({ x: t * t, y });
  }
  const pts = [...left.reverse(), ...right.slice(1)];
  const b = boundsFromPoints(pts, 0.15, 0.1);
  // Keep origin in view
  b.yMin = Math.min(b.yMin, -0.2);
  const scales = makeScales(b.xMin, b.xMax, b.yMin, b.yMax, FIG_W, FIG_H, FIG_PAD);
  drawCrossingAxes(svg, scales, FIG_PAD, FIG_W, FIG_H);
  appendCurve(svg, pathFromSamples(pts, scales.toX, scales.toY));

  const tip = { x: 0, y: 1.6 };
  svg.append(circleEl(scales.toX(tip.x), scales.toY(tip.y), 3.5, INK, "sf-cusp-tip"));

  return figureShell(25, svg);
}

function renderFig28(): HTMLElement {
  const svg = createSvg(FIG_W, FIG_H, "Figure 28: cubic with maximum and minimum");
  // y = (1/3)x^3 - 2x^2 + 3x + 1
  const f = (x: number) => (1 / 3) * x * x * x - 2 * x * x + 3 * x + 1;
  const xMin = -1.2;
  const xMax = 5.2;
  const pts = sampleFn(f, xMin, xMax, 120);
  const yVals = pts.map((p) => p.y);
  const yMin = Math.min(...yVals, -0.5) - 0.4;
  const yMax = Math.max(...yVals) + 0.5;
  const scales = makeScales(xMin, xMax, yMin, yMax, FIG_W, FIG_H, FIG_PAD);
  drawCrossingAxes(svg, scales, FIG_PAD, FIG_W, FIG_H);
  appendCurve(svg, pathFromSamples(pts, scales.toX, scales.toY));

  const maxPt = { x: 1, y: f(1) }; // 7/3
  const minPt = { x: 3, y: f(3) }; // 1
  const maxPx = scales.toX(maxPt.x);
  const maxPy = scales.toY(maxPt.y);
  const minPx = scales.toX(minPt.x);
  const minPy = scales.toY(minPt.y);

  // Soft horizontal guides at y = 1 and y ≈ 7/3
  const y1 = scales.toY(1);
  const yMaxH = scales.toY(maxPt.y);
  svg.append(
    lineEl(FIG_PAD.left, y1, FIG_W - FIG_PAD.right, y1, INK, {
      strokeWidth: 0.7,
      dash: "3 4",
      class: "sf-guide",
    }),
    lineEl(FIG_PAD.left, yMaxH, FIG_W - FIG_PAD.right, yMaxH, INK, {
      strokeWidth: 0.7,
      dash: "3 4",
      class: "sf-guide",
    }),
  );
  labelAt(svg, FIG_W - FIG_PAD.right, y1, "1", { dx: 4, dy: 12, size: 9 });
  labelAt(svg, FIG_W - FIG_PAD.right, yMaxH, "2⅓", { dx: 4, dy: -6, size: 9 });

  svg.append(
    circleEl(maxPx, maxPy, 3.8, INK, "sf-extremum"),
    circleEl(minPx, minPy, 3.8, INK, "sf-extremum"),
  );
  labelNearPoint(svg, maxPx, maxPy, "max", "upperRight", { size: 9 });
  labelNearPoint(svg, minPx, minPy, "min", "lowerRight", { size: 9 });

  return figureShell(28, svg);
}

export function renderStaticFigure(fig: StaticFigNumber): HTMLElement {
  if (fig in SHAPE_FIG_IDS) {
    const id = SHAPE_FIG_IDS[fig];
    return renderShapeFig(fig, getShape(id));
  }

  switch (fig) {
    case 19:
      return renderFig19();
    case 20:
      return renderFig20();
    case 21:
      return renderFig21();
    case 22:
      return renderFig22();
    case 25:
      return renderFig25();
    case 28:
      return renderFig28();
    default:
      throw new Error(`No static render for Figure ${fig}`);
  }
}
