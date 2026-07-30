import { mountSlopeMorphUI, SLOPE_NARRATIVE_HTML, type SlopeMorphUIHandle } from "./mountUI";
import { attachScrollDrive } from "./scrollDrive";

const SLOPE_ON_THRESHOLDS = [0.14, 0.32, 0.5, 0.68] as const;
const SLOPE_OFF_THRESHOLDS = [0.09, 0.27, 0.45, 0.63] as const;
/** Pill jumps land inside each phase; last sits early in the Fig 11 hold. */
const SLOPE_PHASE_SCROLL_PROGRESS = [0.04, 0.23, 0.41, 0.59, 0.82] as const;

export type SlopeMorphSection = {
  el: HTMLElement;
  dispose: () => void;
};

/** Mount Figures 8–11 slope-morph section for the main chapter page. */
export function buildSlopeMorphSection(): SlopeMorphSection {
  const section = document.createElement("section");
  section.className = "slope-morph-section";
  section.innerHTML = `
    <div class="sm-sticky-stack">
      <header class="sm-header">
        <p class="sm-kicker">Figures 8-11</p>
        <h2 class="sm-title">How the sign and size of slope changes</h2>
      </header>
      <div class="sm-main-row">
        <div class="sm-narrative" id="sm-narrative" data-phase="0" aria-live="polite">
          ${SLOPE_NARRATIVE_HTML}
        </div>
        <div class="sm-figure-wrap">
          <figure class="sm-figure" aria-label="Slope morph for Figures 8 through 11">
            <div class="sm-figure-inner"></div>
          </figure>
        </div>
      </div>
      <p class="sm-hint">Scroll to pass from Figure 8 through Figure 11.</p>
    </div>
    <div class="sm-driver" aria-hidden="true"></div>
  `;

  const driver = section.querySelector<HTMLElement>(".sm-driver");
  if (!driver) throw new Error("slope morph section missing .sm-driver");

  const ui: SlopeMorphUIHandle | null = mountSlopeMorphUI({
    root: section,
    onThresholds: SLOPE_ON_THRESHOLDS,
    offThresholds: SLOPE_OFF_THRESHOLDS,
    phaseScrollProgress: SLOPE_PHASE_SCROLL_PROGRESS,
    attachDrive: (onProgress) =>
      attachScrollDrive(onProgress, { scope: "section", section, driver }),
  });

  return {
    el: section,
    dispose: () => ui?.dispose(),
  };
}
