import type { ShapeId } from "../shapes/defs";

export const FIG_W = 420;
export const FIG_H = 280;
export const FIG_PAD = { left: 40, right: 28, top: 24, bottom: 36 };

/** Book Figs 12–18 map onto shape-gallery curve ids. */
export const SHAPE_FIG_IDS: Record<number, ShapeId> = {
  12: "constant",
  13: "steepening",
  14: "flattening",
  15: "minimum",
  16: "maximum",
  17: "leastSlope",
  18: "verticalNose",
};

export const STATIC_FIG_NUMBERS = [
  12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 25, 28,
] as const;

export type StaticFigNumber = (typeof STATIC_FIG_NUMBERS)[number];

export function isStaticFigNumber(n: number): n is StaticFigNumber {
  return (STATIC_FIG_NUMBERS as readonly number[]).includes(n);
}
