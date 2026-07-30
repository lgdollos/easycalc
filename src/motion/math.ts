export function clamp01(x: number): number {
  return Math.min(1, Math.max(0, x));
}

export function easeOutCubic(t: number): number {
  const p = 1 - clamp01(t);
  return 1 - p * p * p;
}
