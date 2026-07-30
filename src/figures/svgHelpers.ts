import { PADDING, type Scales } from "./coords";

export const INK = "#0a0a0a";

export const FIG_FONT =
  'Georgia, "Iowan Old Style", "Palatino Linotype", Palatino, "Times New Roman", Times, serif';

/** Scales all figure label sizes together so hierarchy stays consistent. */
export const FIG_FONT_SCALE = 1.6;

export function setAttrs(el: Element, attrs: Record<string, string | number>) {
  for (const [k, v] of Object.entries(attrs)) {
    el.setAttribute(k, String(v));
  }
}

export function lineEl(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  opts: { strokeWidth?: number; dash?: string; class?: string } = {},
): SVGLineElement {
  const ln = document.createElementNS("http://www.w3.org/2000/svg", "line");
  setAttrs(ln, { x1, y1, x2, y2, stroke, "stroke-width": opts.strokeWidth ?? 1 });
  if (opts.dash) ln.setAttribute("stroke-dasharray", opts.dash);
  if (opts.class) ln.setAttribute("class", opts.class);
  return ln;
}

export function circleEl(
  cx: number,
  cy: number,
  r: number,
  fill: string,
  klass?: string,
): SVGCircleElement {
  const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  setAttrs(c, { cx, cy, r, fill });
  if (klass) c.setAttribute("class", klass);
  return c;
}

export function textEl(
  x: number,
  y: number,
  text: string,
  fill = INK,
  size = 11.5,
): SVGTextElement {
  const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
  setAttrs(t, {
    x,
    y,
    fill,
    "font-size": size * FIG_FONT_SCALE,
    "font-family": FIG_FONT,
    "font-style": "italic",
  });
  t.textContent = text;
  return t;
}

export function drawAxes(
  root: SVGGElement,
  scales: Scales,
  prefix: string,
  opts: { showOrigin?: boolean } = {},
) {
  const left = PADDING.left;
  const bottom = PADDING.top + scales.innerH;
  const right = PADDING.left + scales.innerW;
  const top = PADDING.top;

  const xAxis = lineEl(left, bottom, right, bottom, INK, {
    strokeWidth: 1,
    class: `${prefix}-axis-x`,
  });
  const yAxis = lineEl(left, top, left, bottom, INK, {
    strokeWidth: 1,
    class: `${prefix}-axis-y`,
  });
  root.append(xAxis, yAxis);

  const ox = textEl(right - 4, bottom + 24, "X", INK, 12);
  ox.setAttribute("text-anchor", "end");
  ox.setAttribute("class", `${prefix}-axis-label-x`);
  const oy = textEl(left - 5, top + 5, "Y", INK, 12);
  oy.setAttribute("text-anchor", "end");
  oy.setAttribute("class", `${prefix}-axis-label-y`);
  root.append(ox, oy);

  if (opts.showOrigin) {
    const oo = textEl(left - 4, bottom + 13, "O", INK, 11);
    oo.setAttribute("text-anchor", "end");
    oo.setAttribute("class", `${prefix}-axis-label-o`);
    root.append(oo);
  }
}

export function unitNormal(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): { ux: number; uy: number; nx: number; ny: number } {
  const vx = x2 - x1;
  const vy = y2 - y1;
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len;
  const uy = vy / len;
  const nx = -vy / len;
  const ny = vx / len;
  return { ux, uy, nx, ny };
}

export function extendLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  scale: number,
): { x1: number; y1: number; x2: number; y2: number } {
  const { ux, uy } = unitNormal(x1, y1, x2, y2);
  return {
    x1: x1 - ux * scale,
    y1: y1 - uy * scale,
    x2: x2 + ux * scale,
    y2: y2 + uy * scale,
  };
}

export function producedSecantPair(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  scale: number,
  dash: string,
  stroke: string,
): [SVGLineElement, SVGLineElement] {
  const ext = extendLine(x1, y1, x2, y2, scale);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const secL = lineEl(mx, my, ext.x1, ext.y1, stroke, {
    strokeWidth: 1,
    dash,
    class: "fig-secant-produced-part",
  });
  const secR = lineEl(mx, my, ext.x2, ext.y2, stroke, {
    strokeWidth: 1,
    dash,
    class: "fig-secant-produced-part",
  });
  return [secL, secR];
}
