/** Shared accent tokens for panel figure motion. Prefer CSS var when available. */

export const ACCENT = "rgba(177, 35, 34, 0.82)";
export const ACCENT_FILL = "rgba(177, 35, 34, 0.92)";
export const ACCENT_STROKE_SOFT = "rgba(177, 35, 34, 0.45)";
export const ACCENT_STROKE_WIDTH = 2.12;

export function accentFromCss(fallback = "#b12322"): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
  return v || fallback;
}
