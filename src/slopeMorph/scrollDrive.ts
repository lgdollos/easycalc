import { clamp01 } from "../motion/math";
import { prefersReducedMotion } from "../motion/reducedMotion";

export type SlopeScrollDrive = {
  dispose: () => void;
  scrollToProgress: (progress: number, behavior?: ScrollBehavior) => void;
};

export type ScrollDriveScope =
  | { scope: "document" }
  | {
      scope: "section";
      section: HTMLElement;
      driver: HTMLElement;
      /** Fraction of viewport height held after unpin (default 0.45). */
      endPauseVh?: number;
    };

export function attachScrollDrive(
  onDriverProgress: (progress: number) => void,
  scope: ScrollDriveScope = { scope: "document" },
): SlopeScrollDrive {
  let raf = 0;

  const getBounds = (): { start: number; end: number } => {
    if (scope.scope === "document") {
      const doc = document.documentElement;
      return { start: 0, end: Math.max(doc.scrollHeight - window.innerHeight, 1) };
    }
    // Progress stays at 0 until the sticky stack pins, then maps across the
    // driver minus a trailing pause so Fig 11 holds while still pinned.
    const sectionTop = scope.section.getBoundingClientRect().top + window.scrollY;
    const driverBottom = scope.driver.getBoundingClientRect().bottom + window.scrollY;
    const start = sectionTop;
    const pause = window.innerHeight * (scope.endPauseVh ?? 0.45);
    return { start, end: Math.max(start + 1, driverBottom - pause) };
  };

  const compute = (): void => {
    const { start, end } = getBounds();
    onDriverProgress(clamp01((window.scrollY - start) / (end - start)));
  };

  const onScrollOrResize = (): void => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      raf = 0;
      compute();
    });
  };

  window.addEventListener("scroll", onScrollOrResize, { passive: true });
  window.addEventListener("resize", onScrollOrResize);
  onScrollOrResize();

  return {
    dispose: () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (raf) cancelAnimationFrame(raf);
    },
    scrollToProgress: (progress, behavior: ScrollBehavior = "smooth") => {
      const { start, end } = getBounds();
      window.scrollTo({
        top: start + clamp01(progress) * (end - start),
        behavior: prefersReducedMotion() ? "auto" : behavior,
      });
    },
  };
}
