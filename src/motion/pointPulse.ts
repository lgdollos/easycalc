import { circleEl } from "../figures/svgHelpers";
import { ACCENT_FILL, ACCENT_STROKE_SOFT } from "./accent";

export const PULSE_MS = 3000;
const RIPPLE_LAYERS = 3;
const RIPPLE_OUTER_OPACITY_FLOOR = 0.2;
const RIPPLE_STROKE_WIDTH_MIN = 0.52;

export type PulseStyle = {
  opacityMin: number;
  outset: number;
  strokeCap: number;
  accent: boolean;
};

export const PULSE_PANEL: PulseStyle = {
  opacityMin: 0.82,
  outset: 19,
  strokeCap: 0.42,
  accent: false,
};

export const PULSE_Q_ACCENT: PulseStyle = {
  opacityMin: 0.68,
  outset: 28,
  strokeCap: 0.62,
  accent: true,
};

export type PointPulseController = {
  apply: (elapsed: number, style: PulseStyle) => void;
  reset: () => void;
  dispose: () => void;
};

export function createPointPulse(pointQ: SVGCircleElement): PointPulseController {
  const baseR = Number.parseFloat(pointQ.getAttribute("r") ?? "5.5");
  const inkFill = pointQ.getAttribute("fill") ?? "#0a0a0a";
  let ripples: SVGCircleElement[] | null = null;

  const ensureRipples = (): SVGCircleElement[] => {
    if (ripples) return ripples;
    if (!pointQ.parentNode) return [];
    const parent = pointQ.parentNode;
    const cx = Number.parseFloat(pointQ.getAttribute("cx") ?? "0");
    const cy = Number.parseFloat(pointQ.getAttribute("cy") ?? "0");
    const layers: SVGCircleElement[] = [];
    for (let i = 0; i < RIPPLE_LAYERS; i++) {
      const c = circleEl(cx, cy, 0, "none", "fig-point-q-ripple");
      c.style.pointerEvents = "none";
      parent.insertBefore(c, pointQ);
      layers.push(c);
    }
    ripples = layers;
    return layers;
  };

  const resetRipples = (): void => {
    if (!ripples) return;
    for (const c of ripples) {
      c.setAttribute("r", "0");
      c.style.stroke = "none";
      c.style.removeProperty("stroke-width");
      c.style.removeProperty("stroke-opacity");
    }
  };

  const reset = (): void => {
    pointQ.style.removeProperty("opacity");
    pointQ.style.removeProperty("transform");
    pointQ.style.removeProperty("transform-box");
    pointQ.style.removeProperty("transform-origin");
    pointQ.style.removeProperty("fill");
    pointQ.style.removeProperty("stroke");
    pointQ.style.removeProperty("stroke-width");
    resetRipples();
  };

  const apply = (elapsed: number, style: PulseStyle): void => {
    const layers = ensureRipples();
    if (style.accent) {
      pointQ.style.fill = ACCENT_FILL;
      pointQ.style.stroke = ACCENT_STROKE_SOFT;
      pointQ.style.strokeWidth = "1";
    } else {
      pointQ.style.removeProperty("fill");
      pointQ.style.removeProperty("stroke");
      pointQ.style.removeProperty("stroke-width");
    }

    const phase = (elapsed % PULSE_MS) / PULSE_MS;
    const w = 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
    pointQ.style.opacity = String(1 + (style.opacityMin - 1) * w * 0.5);

    const rMax = baseR + style.outset;
    const rippleStroke = style.accent ? ACCENT_STROKE_SOFT : inkFill;
    const n = layers.length || RIPPLE_LAYERS;
    for (let i = 0; i < layers.length; i++) {
      const c = layers[i]!;
      const t = (phase + i / n) % 1;
      const easeOut = 1 - t;
      const r = baseR + t * (rMax - baseR);
      const sw = Math.max(RIPPLE_STROKE_WIDTH_MIN, 0.38 + 0.9 * easeOut);
      const fade = Math.pow(easeOut, 1.12);
      const op =
        style.strokeCap *
        (RIPPLE_OUTER_OPACITY_FLOOR + (1 - RIPPLE_OUTER_OPACITY_FLOOR) * fade);
      c.setAttribute("r", String(r));
      c.style.stroke = rippleStroke;
      c.style.strokeWidth = String(sw);
      c.style.strokeOpacity = String(op);
    }
  };

  const dispose = (): void => {
    reset();
    if (ripples) {
      for (const c of ripples) c.remove();
      ripples = null;
    }
  };

  return { apply, reset, dispose };
}
