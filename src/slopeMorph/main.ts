import "katex/dist/katex.min.css";
import "./slope-morph.css";
import { attachScrollDrive } from "./scrollDrive";
import { mountSlopeMorphUI, SLOPE_NARRATIVE_HTML } from "./mountUI";

const SLOPE_ON_THRESHOLDS = [0.16, 0.36, 0.56, 0.76] as const;
const SLOPE_OFF_THRESHOLDS = [0.11, 0.31, 0.51, 0.71] as const;
const SLOPE_PHASE_SCROLL_PROGRESS = [0.04, 0.26, 0.46, 0.66, 0.88] as const;

function buildApp(root: HTMLElement) {
  root.className = "sm-root";
  root.innerHTML = `
    <div class="sm-sticky-stack">
      <header class="sm-header">
        <h1 class="sm-title">Geometrical meaning of differentiation</h1>
        <p class="sm-sub">From Silvanus P. Thompson, <cite>Calculus Made Easy</cite> — Chapter X.</p>
      </header>
      <div class="sm-main-row">
        <div class="sm-narrative" id="sm-narrative" data-phase="0" aria-live="polite">
          ${SLOPE_NARRATIVE_HTML}
        </div>
        <div class="sm-figure-wrap">
          <div class="sm-figure">
            <div class="sm-figure-inner"></div>
          </div>
        </div>
      </div>
      <p class="sm-hint">Scroll down to morph from Figure 8 through Figure 11.</p>
    </div>
    <div class="sm-driver" aria-hidden="true"></div>
    <footer class="sm-footer">
      <p>Source: <a href="https://calculusmadeeasy.org/10.html" rel="noopener noreferrer">calculusmadeeasy.org/10.html</a>
      · <a href="../index.html">Comic strip version</a></p>
    </footer>
  `;

  const ui = mountSlopeMorphUI({
    root,
    onThresholds: SLOPE_ON_THRESHOLDS,
    offThresholds: SLOPE_OFF_THRESHOLDS,
    phaseScrollProgress: SLOPE_PHASE_SCROLL_PROGRESS,
    attachDrive: (onProgress) => attachScrollDrive(onProgress, { scope: "document" }),
  });

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      ui?.dispose();
      root.replaceChildren();
    });
  }
}

const app = document.querySelector<HTMLElement>("#slope-app");
if (app) buildApp(app);
