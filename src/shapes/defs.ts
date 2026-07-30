export type ShapeId =
  | "constant"
  | "steepening"
  | "flattening"
  | "minimum"
  | "maximum"
  | "leastSlope"
  | "verticalNose";

export type ShapeDef = {
  id: ShapeId;
  fig: number;
  figLabel: string;
  captionHtml: string;
  /** Scrub parameter range (usually x; for Fig. 18 an arc parameter). */
  domain: { min: number; max: number };
  /** y as a function of scrub parameter t */
  f: (t: number) => number;
  /** dy/dx at scrub parameter t */
  fp: (t: number) => number;
  /** Plot x; defaults to identity (t is x). */
  xOf?: (t: number) => number;
  /** When |fp| exceeds this, readout shows infinity (Fig. 18). */
  infinityThreshold?: number;
};

function noseTheta(t: number): number {
  // t: 0 → top, 0.5 → left nose, 1 → bottom
  return Math.PI / 2 + t * Math.PI;
}

export const SHAPES: ShapeDef[] = [
  {
    id: "constant",
    fig: 12,
    figLabel: "Fig. 12",
    captionHtml: String.raw`If the “curve” happens to be a straight line, like that in Figure 12, the value of <span class="math">\dfrac{dy}{dx}</span> will be the same at all points along it. In other words its slope is constant.`,
    domain: { min: 0, max: 5 },
    f: (x) => 0.6 * x + 1,
    fp: () => 0.6,
  },
  {
    id: "steepening",
    fig: 13,
    figLabel: "Fig. 13",
    captionHtml: String.raw`If a curve is one that turns more upwards as it goes along to the right, the values of <span class="math">\dfrac{dy}{dx}</span> will become greater and greater with the increasing steepness, as in Figure 13.`,
    domain: { min: 0, max: 5 },
    f: (x) => 0.15 * x * x,
    fp: (x) => 0.3 * x,
  },
  {
    id: "flattening",
    fig: 14,
    figLabel: "Fig. 14",
    captionHtml: String.raw`If a curve is one that gets flatter and flatter as it goes along, the values of <span class="math">\dfrac{dy}{dx}</span> will become smaller and smaller as the flatter part is reached, as in Figure 14.`,
    domain: { min: 0, max: 5 },
    f: (x) => 2 * Math.sqrt(x + 0.2),
    fp: (x) => 1 / Math.sqrt(x + 0.2),
  },
  {
    id: "minimum",
    fig: 15,
    figLabel: "Fig. 15",
    captionHtml: String.raw`If a curve first descends, and then goes up again, as in Figure 15, <span class="math">\dfrac{dy}{dx}</span> is first negative, then zero at the trough, then positive. Here <span class="math">y</span> passes by a minimum — and for that <span class="math">x</span>, <span class="math">\dfrac{dy}{dx} = 0</span>.`,
    domain: { min: -2.5, max: 2.5 },
    f: (x) => 0.35 * x * x + 0.5,
    fp: (x) => 0.7 * x,
  },
  {
    id: "maximum",
    fig: 16,
    figLabel: "Fig. 16",
    captionHtml: String.raw`If a curve first ascends and then descends, as in Figure 16, <span class="math">\dfrac{dy}{dx}</span> is positive, then zero at the summit, then negative. Here <span class="math">y</span> passes by a maximum — and for that <span class="math">x</span>, <span class="math">\dfrac{dy}{dx} = 0</span>.`,
    domain: { min: -2.5, max: 2.5 },
    f: (x) => -0.35 * x * x + 2.5,
    fp: (x) => -0.7 * x,
  },
  {
    id: "leastSlope",
    fig: 17,
    figLabel: "Fig. 17",
    captionHtml: String.raw`If a curve has the peculiar form of Figure 17, the values of <span class="math">\dfrac{dy}{dx}</span> will always be positive; but there will be one particular place where the slope is least steep, where the value of <span class="math">\dfrac{dy}{dx}</span> will be a minimum.`,
    domain: { min: -2, max: 2 },
    f: (x) => x + 0.2 * x * x * x + 1.5,
    fp: (x) => 1 + 0.6 * x * x,
  },
  {
    id: "verticalNose",
    fig: 18,
    figLabel: "Fig. 18",
    captionHtml: String.raw`If a curve has the form of Figure 18, <span class="math">\dfrac{dy}{dx}</span> is negative in the upper part and positive in the lower; while at the nose where it becomes actually perpendicular, the value of <span class="math">\dfrac{dy}{dx}</span> will be infinitely great.`,
    domain: { min: 0, max: 1 },
    xOf: (t) => 2 * Math.cos(noseTheta(t)),
    f: (t) => 2 * Math.sin(noseTheta(t)),
    fp: (t) => {
      const theta = noseTheta(t);
      const s = Math.sin(theta);
      if (Math.abs(s) < 1e-4) return s >= 0 ? -1e6 : 1e6;
      return Math.cos(theta) / s;
    },
    infinityThreshold: 12,
  },
];

export function getShape(id: ShapeId): ShapeDef {
  const shape = SHAPES.find((s) => s.id === id);
  if (!shape) throw new Error(`Unknown shape: ${id}`);
  return shape;
}

export function clampToDomain(shape: ShapeDef, t: number): number {
  return Math.max(shape.domain.min, Math.min(shape.domain.max, t));
}

export function plotX(shape: ShapeDef, t: number): number {
  return shape.xOf ? shape.xOf(t) : t;
}

export function sampleCurve(
  shape: ShapeDef,
  steps = 80,
): { x: number; y: number }[] {
  const { min, max } = shape.domain;
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = min + (i / steps) * (max - min);
    return { x: plotX(shape, t), y: shape.f(t) };
  });
}

export function midDomain(shape: ShapeDef): number {
  return (shape.domain.min + shape.domain.max) / 2;
}
