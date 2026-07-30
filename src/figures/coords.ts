import { scaleLinear } from "d3-scale";
import { line as d3Line } from "d3-shape";

export const FIG_WIDTH = 440;
export const FIG_HEIGHT = 280;
export const PADDING = { top: 14, right: 14, bottom: 22, left: 30 };

export const PROJECTION_GUIDE_DASH = "3 7";
export const SECANT_DASH = "5 3";
export const LIMIT_DASH = "4 3";
export const PROJECTION_GUIDE_DASH_PERIOD = PROJECTION_GUIDE_DASH.split(/\s+/).reduce(
  (sum, part) => sum + Number(part),
  0,
);

/** Book-style fragment: y = (1/4)x^2 + b */
export function f(x: number): number {
  return 0.25 * x * x + 3;
}

export function fp(x: number): number {
  return 0.5 * x;
}

export const X0 = 2;

/** Visible curve domain in math x (must match `createScales`). */
export const VIEW_CURVE_X_MIN = 0.82;
export const VIEW_CURVE_X_MAX = 3.78;

/** Q so chord [Q, Q+deltaX] is centered on the plotted x-range. */
export function qXForChordCenteredInViewport(deltaX: number): number {
  return (VIEW_CURVE_X_MIN + VIEW_CURVE_X_MAX) / 2 - deltaX / 2;
}

export type Scales = {
  x: ReturnType<typeof scaleLinear<number>>;
  y: ReturnType<typeof scaleLinear<number>>;
  innerW: number;
  innerH: number;
};

export function createScales(): Scales {
  const innerW = FIG_WIDTH - PADDING.left - PADDING.right;
  const innerH = FIG_HEIGHT - PADDING.top - PADDING.bottom;
  const xDomain: [number, number] = [VIEW_CURVE_X_MIN, VIEW_CURVE_X_MAX];
  const yDomain: [number, number] = [3.05, 6.55];
  const x = scaleLinear().domain(xDomain).range([PADDING.left, PADDING.left + innerW]);
  const y = scaleLinear().domain(yDomain).range([PADDING.top + innerH, PADDING.top]);
  return { x, y, innerW, innerH };
}

export function curvePath(scales: Scales): string {
  const samples = 80;
  const [xMin, xMax] = scales.x.domain();
  const step = (xMax - xMin) / (samples - 1);
  const pts: [number, number][] = [];
  for (let i = 0; i < samples; i++) {
    const xv = xMin + i * step;
    pts.push([scales.x(xv), scales.y(f(xv))]);
  }
  const ln = d3Line<[number, number]>()
    .x((d) => d[0])
    .y((d) => d[1]);
  return ln(pts) ?? "";
}

export function mathToSvg(scales: Scales, mx: number, my: number): [number, number] {
  return [scales.x(mx), scales.y(my)];
}
