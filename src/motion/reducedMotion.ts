import { hasFineHover } from "../ui/pointerMode";

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Skip hover loops. Still attach tap-once on touch (iOS Reduce Motion is common). */
export function skipHoverMotion(): boolean {
  return prefersReducedMotion() && hasFineHover();
}
