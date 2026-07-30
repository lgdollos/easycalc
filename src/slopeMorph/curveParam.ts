import { scaleLinear } from "d3-scale";
import { line as d3Line } from "d3-shape";
import {
  FIG_HEIGHT,
  FIG_WIDTH,
  PADDING,
  type Scales,
} from "../figures/coords";
import { clamp01 } from "../motion/math";

export const DX_MATH = 0.7;

/** Morph baseline parabola matching the book's Fig. 8 curve. */
function fMorph(x: number): number {
  return 0.25 * x * x + 3.2;
}

/**
 * Horizontal anchor for Q: positioned so that the secant from Q to Q+DX_MATH
 * has dy = dx (true 45° slope triangle) on the parabola.
 */
export const X_Q = 1.8;

/** View window for the morph figure — tight around the relevant curve portion. */
export const MORPH_VIEW_X_MIN = 0.5;
export const MORPH_VIEW_X_MAX = 3.2;

/** Fig. 9: straight graph through Q with slope greater than 1. */
export const M_STEEP = 2.25;
/** Gentle positive slope (Fig. 10): dy/dx at Q is 2·A_GENTLE·X_Q < 1. */
export const A_GENTLE = 0.12;
/** Downward-opening branch (Fig. 11). */
export const A_NEG = -0.14;
export const Y_Q = fMorph(X_Q);

function bForA(a: number): number {
  return Y_Q - a * X_Q * X_Q;
}

function quadY(x: number, a: number, b: number): number {
  return a * x * x + b;
}

const _lineIntercept = Y_Q - M_STEEP * X_Q;
const _bGentle = bForA(A_GENTLE);
const _bFlat = bForA(0);
const _bNeg = bForA(A_NEG);

const lineAt = (xv: number) => M_STEEP * xv + _lineIntercept;
const quadGentle = (xv: number) => quadY(xv, A_GENTLE, _bGentle);
const quadFlat = (xv: number) => quadY(xv, 0, _bFlat);
const quadNeg = (xv: number) => quadY(xv, A_NEG, _bNeg);

/** Per-segment endpoint functions for blending. */
const SEG_FNS: [(x: number) => number, (x: number) => number][] = [
  [fMorph, lineAt],
  [lineAt, quadGentle],
  [quadGentle, quadFlat],
  [quadFlat, quadNeg],
];

/**
 * y(x) for the morph: blends between segment endpoint functions.
 * Callers resolve the segment externally to avoid per-sample redundant work.
 */
export function yOnMorphCurve(x: number, globalT: number): number {
  const nSeg = 4;
  const u = clamp01(globalT) * nSeg;
  const i = Math.min(nSeg - 1, Math.floor(u));
  const local = u - i;
  const [fn0, fn1] = SEG_FNS[i];
  return (1 - local) * fn0(x) + local * fn1(x);
}

/**
 * Expand x-domain so that innerW/xSpan = innerH/ySpan, giving true isotropic
 * (1:1) pixel mapping. Anchors xMin at 0 (the y-axis) and expands rightward.
 */
function isotropicXDomain(
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  innerW: number,
  innerH: number,
): [number, number] {
  const xSpan = xMax - xMin || 1;
  const ySpan = yMax - yMin || 1;
  const targetXSpan = (innerW * ySpan) / innerH;
  if (xSpan >= targetXSpan) return [xMin, xMax];
  return [0, targetXSpan];
}

const _innerW = FIG_WIDTH - PADDING.left - PADDING.right;
const _innerH = FIG_HEIGHT - PADDING.top - PADDING.bottom;
const _baseYMin = Math.min(fMorph(0), fMorph(MORPH_VIEW_X_MIN));
const _baseYMax = fMorph(MORPH_VIEW_X_MAX);
const _basePad = (_baseYMax - _baseYMin) * 0.04;
const _ySpan = _baseYMax + _basePad - (_baseYMin - _basePad);
const _MORPH_Y_CEIL = _baseYMax + _basePad + 0.09;
const _MORPH_Y_FLOOR = _MORPH_Y_CEIL - _ySpan;
const [MORPH_ISO_X_MIN, MORPH_ISO_X_MAX] = isotropicXDomain(
  MORPH_VIEW_X_MIN,
  MORPH_VIEW_X_MAX,
  _MORPH_Y_FLOOR,
  _MORPH_Y_CEIL,
  _innerW,
  _innerH,
);

function createMorphScales(): Scales {
  const xDomain: [number, number] = [MORPH_ISO_X_MIN, MORPH_ISO_X_MAX];
  const yDomain: [number, number] = [_MORPH_Y_FLOOR, _MORPH_Y_CEIL];
  const x = scaleLinear().domain(xDomain).range([PADDING.left, PADDING.left + _innerW]);
  const y = scaleLinear().domain(yDomain).range([PADDING.top + _innerH, PADDING.top]);
  return { x, y, innerW: _innerW, innerH: _innerH };
}

export const morphScales = createMorphScales();

/** Pre-computed x-samples and reusable line generator for morphCurvePath. */
const CURVE_SAMPLES = 80;
const _curveXMin = morphScales.x.domain()[0];
const _curveXMax = morphScales.x.domain()[1];
const _curveStep = (_curveXMax - _curveXMin) / (CURVE_SAMPLES - 1);
const _sampleXv = new Float64Array(CURVE_SAMPLES);
const _sampleSx = new Float64Array(CURVE_SAMPLES);

for (let i = 0; i < CURVE_SAMPLES; i++) {
  _sampleXv[i] = _curveXMin + i * _curveStep;
  _sampleSx[i] = morphScales.x(_sampleXv[i]);
}

const _curveLineGen = d3Line<[number, number]>()
  .x((d) => d[0])
  .y((d) => d[1]);

const _pts: [number, number][] = Array.from({ length: CURVE_SAMPLES }, () => [0, 0]);

export function morphCurvePath(globalT: number): string {
  const nSeg = 4;
  const u = clamp01(globalT) * nSeg;
  const segIdx = Math.min(nSeg - 1, Math.floor(u));
  const local = u - segIdx;
  const [fn0, fn1] = SEG_FNS[segIdx];
  const yScale = morphScales.y;

  for (let i = 0; i < CURVE_SAMPLES; i++) {
    const y = (1 - local) * fn0(_sampleXv[i]) + local * fn1(_sampleXv[i]);
    _pts[i][0] = _sampleSx[i];
    _pts[i][1] = yScale(y);
  }
  return _curveLineGen(_pts) ?? "";
}
