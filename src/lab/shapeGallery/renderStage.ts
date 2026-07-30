import { circleEl, lineEl, setAttrs, INK } from "../../figures/svgHelpers";
import { sampleCurve, plotX, type ShapeDef } from "../../shapes/defs";

const SVG_NS = "http://www.w3.org/2000/svg";
const ACCENT = "#b12322";

export const STAGE_W = 420;
export const STAGE_H = 280;
const PAD = { left: 36, right: 20, top: 20, bottom: 32 };

export const THUMB_W = 72;
export const THUMB_H = 48;
const THUMB_PAD = 4;

type Scales = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  toX: (x: number) => number;
  toY: (y: number) => number;
};

function createSvg(width: number, height: number, klass: string): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  setAttrs(svg, {
    viewBox: `0 0 ${width} ${height}`,
    width: "100%",
    height: "100%",
    class: klass,
    role: "img",
  });
  return svg;
}

function boundsFor(shape: ShapeDef): { xMin: number; xMax: number; yMin: number; yMax: number } {
  const pts = sampleCurve(shape, 60);
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
  const xPad = Math.max((xMax - xMin) * 0.08, 0.3);
  const yPad = Math.max((yMax - yMin) * 0.12, 0.3);
  return {
    xMin: xMin - xPad,
    xMax: xMax + xPad,
    yMin: yMin - yPad,
    yMax: yMax + yPad,
  };
}

function makeScales(
  shape: ShapeDef,
  width: number,
  height: number,
  pad: { left: number; right: number; top: number; bottom: number },
): Scales {
  const b = boundsFor(shape);
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  return {
    ...b,
    toX: (x) => pad.left + ((x - b.xMin) / (b.xMax - b.xMin || 1)) * innerW,
    toY: (y) => pad.top + innerH - ((y - b.yMin) / (b.yMax - b.yMin || 1)) * innerH,
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

function drawAxes(g: SVGGElement, scales: Scales, width: number, height: number, pad: typeof PAD) {
  const xAxisY = scales.toY(Math.max(scales.yMin, Math.min(scales.yMax, 0)));
  const yAxisX = scales.toX(Math.max(scales.xMin, Math.min(scales.xMax, 0)));
  const showX = xAxisY >= pad.top && xAxisY <= height - pad.bottom;
  const showY = yAxisX >= pad.left && yAxisX <= width - pad.right;

  g.appendChild(
    lineEl(
      pad.left,
      showX ? xAxisY : height - pad.bottom,
      width - pad.right,
      showX ? xAxisY : height - pad.bottom,
      INK,
      { strokeWidth: 1, class: "sg-axis-x" },
    ),
  );

  g.appendChild(
    lineEl(
      showY ? yAxisX : pad.left,
      pad.top,
      showY ? yAxisX : pad.left,
      height - pad.bottom,
      INK,
      { strokeWidth: 1, class: "sg-axis-y" },
    ),
  );
}

export type StageHandles = {
  svg: SVGSVGElement;
  update: (shape: ShapeDef, t: number) => void;
  /** Map pointer clientX to scrub parameter t using cached scales. */
  clientXToT: (shape: ShapeDef, clientX: number) => number;
};

export function createStage(): StageHandles {
  const svg = createSvg(STAGE_W, STAGE_H, "sg-stage-svg");
  svg.setAttribute("aria-label", "Curve with movable point and tangent");

  const axesG = document.createElementNS(SVG_NS, "g");
  axesG.setAttribute("class", "sg-axes");
  const curvePath = document.createElementNS(SVG_NS, "path");
  setAttrs(curvePath, {
    class: "sg-curve",
    fill: "none",
    stroke: INK,
    "stroke-width": 1.75,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  });
  const tangent = lineEl(0, 0, 0, 0, ACCENT, {
    strokeWidth: 1.5,
    class: "sg-tangent",
  });
  const point = circleEl(0, 0, 4.5, ACCENT, "sg-point");

  svg.append(axesG, curvePath, tangent, point);

  let currentId: string | null = null;
  let scales: Scales | null = null;

  function rebuildShape(shape: ShapeDef) {
    currentId = shape.id;
    scales = makeScales(shape, STAGE_W, STAGE_H, PAD);
    axesG.replaceChildren();
    drawAxes(axesG, scales, STAGE_W, STAGE_H, PAD);
    curvePath.setAttribute(
      "d",
      pathFromSamples(sampleCurve(shape, 100), scales.toX, scales.toY),
    );
  }

  function update(shape: ShapeDef, t: number) {
    if (currentId !== shape.id || !scales) rebuildShape(shape);
    if (!scales) return;

    const x = plotX(shape, t);
    const y = shape.f(t);
    let fp = shape.fp(t);
    if (!Number.isFinite(fp)) fp = Math.sign(fp) * 1e6;
    if (shape.infinityThreshold !== undefined && Math.abs(fp) >= shape.infinityThreshold) {
      fp = Math.sign(fp || 1) * 1e6;
    }

    const sx = scales.toX(x);
    const sy = scales.toY(y);

    const eps = (scales.xMax - scales.xMin) * 0.02 || 0.05;
    const screenDx = scales.toX(x + eps) - scales.toX(x);
    const screenDy = scales.toY(y + fp * eps) - scales.toY(y);
    const len = Math.hypot(screenDx, screenDy) || 1;
    const half = 48;
    const ux = (screenDx / len) * half;
    const uy = (screenDy / len) * half;

    setAttrs(tangent, {
      x1: sx - ux,
      y1: sy - uy,
      x2: sx + ux,
      y2: sy + uy,
    });
    setAttrs(point, { cx: sx, cy: sy });
  }

  function clientXToT(shape: ShapeDef, clientX: number): number {
    if (currentId !== shape.id || !scales) rebuildShape(shape);
    const rect = svg.getBoundingClientRect();
    const fracX = (clientX - rect.left) / Math.max(rect.width, 1);

    if (shape.xOf) {
      return shape.domain.min + fracX * (shape.domain.max - shape.domain.min);
    }

    if (!scales) return shape.domain.min;
    const dataX = scales.xMin + fracX * (scales.xMax - scales.xMin);
    return Math.max(shape.domain.min, Math.min(shape.domain.max, dataX));
  }

  return { svg, update, clientXToT };
}

export function createThumbnail(shape: ShapeDef): SVGSVGElement {
  const svg = createSvg(THUMB_W, THUMB_H, "sg-thumb-svg");
  const scales = makeScales(shape, THUMB_W, THUMB_H, {
    left: THUMB_PAD,
    right: THUMB_PAD,
    top: THUMB_PAD,
    bottom: THUMB_PAD,
  });
  const path = document.createElementNS(SVG_NS, "path");
  setAttrs(path, {
    d: pathFromSamples(sampleCurve(shape, 40), scales.toX, scales.toY),
    fill: "none",
    stroke: INK,
    "stroke-width": 1.4,
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    class: "sg-thumb-curve",
  });
  svg.appendChild(path);
  return svg;
}
