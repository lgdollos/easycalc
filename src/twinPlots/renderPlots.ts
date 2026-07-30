import katex from "katex";
import { circleEl, lineEl, setAttrs, INK } from "../figures/svgHelpers";
import { POINTS, dOf, yOf } from "./model";

const SVG_NS = "http://www.w3.org/2000/svg";
const ACCENT = "#b12322";

const W = 400;
const H = 260;
const PAD = { left: 44, right: 18, top: 18, bottom: 36 };
const X_DOMAIN = { min: -0.4, max: 5.4 } as const;

type Scales = {
  toX: (x: number) => number;
  toY: (v: number) => number;
  xMin: number;
  xMax: number;
  vMin: number;
  vMax: number;
};

type Crosshair = {
  ordinate: SVGLineElement;
  guideH: SVGLineElement;
  point: SVGCircleElement;
};

function mathCurveLabel(
  tex: string,
  cx: number,
  cy: number,
  width: number,
  height = 30,
): SVGForeignObjectElement {
  const fo = document.createElementNS(SVG_NS, "foreignObject");
  setAttrs(fo, {
    x: cx - width / 2,
    y: cy - height / 2,
    width,
    height,
    class: "tp-math-label",
  });
  const inner = document.createElement("div");
  inner.className = "tp-math-label-inner";
  inner.innerHTML = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: false,
  });
  fo.appendChild(inner);
  return fo;
}

function svgRoot(ariaLabel: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  setAttrs(svg, {
    viewBox: `0 0 ${W} ${H}`,
    width: "100%",
    height: "100%",
    role: "img",
    "aria-label": ariaLabel,
    class: "tp-svg",
  });
  return svg;
}

function makeScales(xMin: number, xMax: number, vMin: number, vMax: number): Scales {
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  return {
    xMin,
    xMax,
    vMin,
    vMax,
    toX: (x) => PAD.left + ((x - xMin) / (xMax - xMin)) * innerW,
    toY: (v) => PAD.top + innerH - ((v - vMin) / (vMax - vMin)) * innerH,
  };
}

function pathSamples(
  x0: number,
  x1: number,
  fn: (x: number) => number,
  toX: (x: number) => number,
  toY: (v: number) => number,
  n = 80,
): string {
  return Array.from({ length: n + 1 }, (_, i) => {
    const x = x0 + (i / n) * (x1 - x0);
    const px = toX(x);
    const py = toY(fn(x));
    return `${i === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
  }).join(" ");
}

function axisLabel(x: number, y: number, text: string, anchor = "middle"): SVGTextElement {
  const t = document.createElementNS(SVG_NS, "text");
  setAttrs(t, {
    x,
    y,
    fill: INK,
    "font-size": 11,
    "font-family": 'Georgia, "Iowan Old Style", Palatino, serif',
    "font-style": "italic",
    "text-anchor": anchor,
    class: "tp-axis-label",
  });
  t.textContent = text;
  return t;
}

function drawFrame(
  g: SVGGElement,
  scales: Scales,
  yLabel: string,
  opts: { yTicks?: number[] } = {},
) {
  const bottom = scales.toY(scales.vMin);
  const left = PAD.left;
  const right = W - PAD.right;
  const top = PAD.top;

  g.append(
    lineEl(left, bottom, right, bottom, INK, { strokeWidth: 1.1, class: "tp-axis-x" }),
    lineEl(left, top, left, bottom, INK, { strokeWidth: 1.1, class: "tp-axis-y" }),
    axisLabel(right - 2, bottom + 18, "x", "end"),
    axisLabel(left - 8, top + 10, yLabel, "end"),
  );

  for (let x = 0; x <= 5; x++) {
    const sx = scales.toX(x);
    g.append(
      lineEl(sx, bottom, sx, bottom + 4, INK, { strokeWidth: 1 }),
      axisLabel(sx, bottom + 16, String(x)),
    );
  }

  for (const v of opts.yTicks ?? []) {
    if (v < scales.vMin || v > scales.vMax) continue;
    const sy = scales.toY(v);
    g.append(
      lineEl(left - 4, sy, left, sy, INK, { strokeWidth: 1 }),
      axisLabel(left - 7, sy + 3.5, String(v), "end"),
    );
  }
}

export type PlotHandles = {
  svg: SVGSVGElement;
  setX: (x: number) => void;
};

export type PlotOptions = {
  onPick: (x: number) => void;
};

function nearestTableX(dataX: number): number {
  let best = POINTS[0].x;
  let bestDist = Infinity;
  for (const p of POINTS) {
    const dist = Math.abs(p.x - dataX);
    if (dist < bestDist) {
      bestDist = dist;
      best = p.x;
    }
  }
  return best;
}

function attachPlotPicker(
  svg: SVGSVGElement,
  scales: Scales,
  onPick: (x: number) => void,
) {
  svg.classList.add("tp-plot-interactive");
  const pick = (e: PointerEvent) => {
    const rect = svg.getBoundingClientRect();
    const frac = (e.clientX - rect.left) / Math.max(rect.width, 1);
    const dataX = scales.xMin + frac * (scales.xMax - scales.xMin);
    onPick(nearestTableX(dataX));
  };
  svg.addEventListener("pointermove", pick);
  svg.addEventListener("pointerdown", pick);
}

function addHoverDots(
  layer: SVGGElement,
  scales: Scales,
  yAt: (x: number) => number,
  onPick: (x: number) => void,
): SVGCircleElement[] {
  const visible: SVGCircleElement[] = [];
  for (const p of POINTS) {
    const sx = scales.toX(p.x);
    const sy = scales.toY(yAt(p.x));
    const hit = circleEl(sx, sy, 11, "transparent", "tp-hit-dot");
    hit.dataset.x = String(p.x);
    hit.style.cursor = "pointer";
    hit.addEventListener("pointerenter", () => onPick(p.x));
    hit.addEventListener("click", () => onPick(p.x));
    const dot = circleEl(sx, sy, 3.2, INK, "tp-static-dot");
    dot.dataset.x = String(p.x);
    layer.append(hit, dot);
    visible.push(dot);
  }
  return visible;
}

function markActiveDots(dots: SVGCircleElement[], x: number) {
  for (const dot of dots) {
    const active = Number(dot.dataset.x) === x;
    dot.classList.toggle("is-active", active);
    setAttrs(dot, {
      r: active ? 4.2 : 3.2,
      fill: active ? ACCENT : INK,
    });
  }
}

function createCrosshair(): Crosshair {
  return {
    ordinate: lineEl(0, 0, 0, 0, ACCENT, {
      strokeWidth: 1.6,
      dash: "5 3.5",
      class: "tp-ordinate",
    }),
    guideH: lineEl(0, 0, 0, 0, ACCENT, {
      strokeWidth: 1.35,
      dash: "5 3.5",
      class: "tp-ord-guide",
    }),
    point: circleEl(0, 0, 5, ACCENT, "tp-live-dot"),
  };
}

function updateCrosshair(
  x: number,
  valueAt: (x: number) => number,
  scales: Scales,
  dots: SVGCircleElement[],
  crosshair: Crosshair,
) {
  const v = valueAt(x);
  const sx = scales.toX(x);
  const sy = scales.toY(v);

  markActiveDots(dots, x);
  setAttrs(crosshair.point, { cx: sx, cy: sy });
  setAttrs(crosshair.ordinate, {
    x1: sx,
    y1: scales.toY(scales.vMin),
    x2: sx,
    y2: sy,
  });
  setAttrs(crosshair.guideH, {
    x1: PAD.left,
    y1: sy,
    x2: sx,
    y2: sy,
  });

  return { sx, sy, v };
}

/** Fig. 23 — y against x, with tangent driven by dy/dx. */
export function createFig23(opts: PlotOptions): PlotHandles {
  const svg = svgRoot("Figure 23: y plotted against x, with tangent");
  const scales = makeScales(X_DOMAIN.min, X_DOMAIN.max, 0, 10);
  const layer = document.createElementNS(SVG_NS, "g");
  drawFrame(layer, scales, "y", { yTicks: [3, 5, 7, 9] });

  const curve = document.createElementNS(SVG_NS, "path");
  setAttrs(curve, {
    d: pathSamples(0, 5, yOf, scales.toX, scales.toY),
    fill: "none",
    stroke: INK,
    "stroke-width": 1.7,
    "stroke-linecap": "round",
    class: "tp-curve",
  });
  layer.appendChild(curve);

  const eqAt = 4.5;
  layer.appendChild(
    mathCurveLabel(
      String.raw`\tfrac{1}{4}x^{2}+3`,
      scales.toX(eqAt),
      scales.toY(yOf(eqAt)) - 26,
      108,
    ),
  );

  const dots = addHoverDots(layer, scales, yOf, opts.onPick);
  const crosshair = createCrosshair();
  const tangent = lineEl(0, 0, 0, 0, ACCENT, { strokeWidth: 1.6, class: "tp-tangent" });
  const run = lineEl(0, 0, 0, 0, ACCENT, { strokeWidth: 1.2, class: "tp-run" });
  const rise = lineEl(0, 0, 0, 0, ACCENT, { strokeWidth: 1.2, class: "tp-rise" });

  layer.append(crosshair.ordinate, crosshair.guideH, tangent, run, rise, crosshair.point);
  svg.appendChild(layer);
  attachPlotPicker(svg, scales, opts.onPick);

  function setX(x: number) {
    const { sx, sy } = updateCrosshair(x, yOf, scales, dots, crosshair);
    const slope = dOf(x);

    const runPx = 42;
    const risePx = slope * runPx;
    setAttrs(tangent, {
      x1: sx - runPx,
      y1: sy + risePx,
      x2: sx + runPx,
      y2: sy - risePx,
    });

    // Slope triangle centered on the live dot (hypotenuse midpoint = point)
    const markRun = 36;
    const markRise = slope * markRun;
    const ax = sx - markRun / 2;
    const ay = sy + markRise / 2;
    const bx = sx + markRun / 2;
    const by = sy - markRise / 2;
    const cx = bx;
    const cy = ay;
    setAttrs(run, { x1: ax, y1: ay, x2: cx, y2: cy });
    setAttrs(rise, { x1: cx, y1: cy, x2: bx, y2: by });

    const showTri = Math.abs(slope) > 0.02;
    run.setAttribute("opacity", showTri ? "1" : "0");
    rise.setAttribute("opacity", showTri ? "1" : "0");
  }

  return { svg, setX };
}

/** Fig. 24 — dy/dx against x; accent ordinate height = slope. */
export function createFig24(opts: PlotOptions): PlotHandles {
  const svg = svgRoot("Figure 24: dy/dx plotted against x, with ordinate");
  const scales = makeScales(X_DOMAIN.min, X_DOMAIN.max, -0.3, 3.2);
  const layer = document.createElementNS(SVG_NS, "g");
  drawFrame(layer, scales, "dy/dx", { yTicks: [0, 0.5, 1, 1.5, 2, 2.5] });

  const line = document.createElementNS(SVG_NS, "path");
  setAttrs(line, {
    d: pathSamples(0, 5, dOf, scales.toX, scales.toY),
    fill: "none",
    stroke: INK,
    "stroke-width": 1.7,
    "stroke-linecap": "round",
    class: "tp-deriv-line",
  });
  layer.appendChild(line);

  const eqAt = 4.5;
  layer.appendChild(
    mathCurveLabel(
      String.raw`\tfrac{1}{2}x`,
      scales.toX(eqAt),
      scales.toY(dOf(eqAt)) - 22,
      56,
    ),
  );

  const dots = addHoverDots(layer, scales, dOf, opts.onPick);
  const crosshair = createCrosshair();

  layer.append(crosshair.ordinate, crosshair.guideH, crosshair.point);
  svg.appendChild(layer);
  attachPlotPicker(svg, scales, opts.onPick);

  function setX(x: number) {
    updateCrosshair(x, dOf, scales, dots, crosshair);
  }

  return { svg, setX };
}
