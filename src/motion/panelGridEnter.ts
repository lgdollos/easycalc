import { prefersReducedMotion } from "./reducedMotion";

const STAGGER_MS = 100;

/** Parse durations like `"480ms"` or `"0.48s"` → milliseconds. */
function parseTimeToMs(css: string, fallbackMs: number): number {
  const t = css.trim().toLowerCase();
  if (t.endsWith("ms")) {
    const n = Number.parseFloat(t);
    return Number.isFinite(n) ? n : fallbackMs;
  }
  if (t.endsWith("s")) {
    const n = Number.parseFloat(t);
    return Number.isFinite(n) ? n * 1000 : fallbackMs;
  }
  return fallbackMs;
}

function settlePanelMotionVars(grid: HTMLElement): void {
  const panels = grid.querySelectorAll<HTMLElement>(".panel[data-panel]");
  let maxDelayMs = 0;
  for (const p of panels) {
    maxDelayMs = Math.max(
      maxDelayMs,
      parseTimeToMs(p.style.getPropertyValue("--panel-enter-delay"), 0),
    );
  }

  const durationMs = parseTimeToMs(
    getComputedStyle(grid).getPropertyValue("--panel-enter-duration"),
    480,
  );

  window.setTimeout(() => {
    grid.classList.remove("panel-grid--enter-prep");
    for (const p of panels) {
      p.style.removeProperty("--panel-enter-delay");
    }
  }, maxDelayMs + durationMs + 50);
}

export function attachPanelGridEnterStagger(grid: HTMLElement): void {
  if (prefersReducedMotion()) return;

  grid.classList.add("panel-grid--enter-prep");

  for (const panel of grid.querySelectorAll<HTMLElement>(".panel[data-panel]")) {
    const id = Number(panel.dataset.panel);
    if (!Number.isFinite(id)) continue;
    panel.style.setProperty("--panel-enter-delay", `${Math.max(0, id - 1) * STAGGER_MS}ms`);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          grid.classList.add("panel-grid--entered");
          settlePanelMotionVars(grid);
          observer.disconnect();
          return;
        }
      }
    },
    { threshold: 0.08 },
  );

  observer.observe(grid);
}
