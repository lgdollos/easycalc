import { createMorphFigure } from "./renderFigure";
import { createMorphSequence, type MorphPhase } from "./morphSequence";
import { createSlopePillNav } from "./pills";
import { attachHoverGuide } from "../ui/hoverGuide";
import { renderMathIn } from "../ui/renderMath";
import { prefersReducedMotion } from "../motion/reducedMotion";
import type { SlopeScrollDrive } from "./scrollDrive";

export const SLOPE_NARRATIVE_HTML = `
  <p class="sm-narrative-block sm-p0">
    If a curve is sloping up at <span class="math">45°</span> at a particular point, as in Figure 8,
    <span class="math">dy</span> and <span class="math">dx</span> will be equal, and the value of
    <span class="math">\\dfrac{dy}{dx} = 1</span>.
  </p>
  <p class="sm-narrative-block sm-p1">
    If the curve slopes up steeper than <span class="math">45°</span> (Figure 9),
    <span class="math">\\dfrac{dy}{dx}</span> will be greater than <span class="math">1</span>.
  </p>
  <p class="sm-narrative-block sm-p2">
    If the curve slopes up very gently, as in Figure 10,
    <span class="math">\\dfrac{dy}{dx}</span> will be a fraction smaller than <span class="math">1</span>.
  </p>
  <p class="sm-narrative-block sm-p3">
    For a horizontal line, or a horizontal place in a curve, <span class="math">dy = 0</span>, and therefore
    <span class="math">\\dfrac{dy}{dx} = 0</span>.
  </p>
  <p class="sm-narrative-block sm-p4">
    If a curve slopes <em>downward</em>, as in Figure 11, <span class="math">dy</span> will be a step down,
    and must therefore be reckoned of negative value; hence <span class="math">\\dfrac{dy}{dx}</span> will have
    negative sign also.
  </p>
`;

export type { SlopeScrollDrive };

export type MountSlopeMorphUIOptions = {
  /** Root that already contains sticky stack, narrative, figure wrap, etc. */
  root: HTMLElement;
  onThresholds: readonly number[];
  offThresholds: readonly number[];
  phaseScrollProgress: readonly number[];
  attachDrive: (onProgress: (progress: number) => void) => SlopeScrollDrive;
};

export type SlopeMorphUIHandle = {
  dispose: () => void;
};

function setNarrativePhase(narrative: HTMLElement, phase: MorphPhase): void {
  narrative.dataset.phase = String(phase);
}

/** Wire morph figure, sequence, pills, and scroll drive into an already-built DOM tree. */
export function mountSlopeMorphUI(opts: MountSlopeMorphUIOptions): SlopeMorphUIHandle | null {
  const { root, onThresholds, offThresholds, phaseScrollProgress, attachDrive } = opts;

  const smHeader = root.querySelector<HTMLElement>(".sm-header");
  const figureInner = root.querySelector<HTMLElement>(".sm-figure-inner");
  const figureWrap = root.querySelector<HTMLElement>(".sm-figure-wrap");
  const narrative = root.querySelector<HTMLElement>("#sm-narrative")
    ?? root.querySelector<HTMLElement>(".sm-narrative");

  if (!smHeader || !figureInner || !figureWrap || !narrative) return null;

  renderMathIn(root);

  const reducedMotion = prefersReducedMotion();
  const { svg, setT } = createMorphFigure();
  figureInner.append(svg);
  attachHoverGuide(smHeader, "scroll", { placement: "on-bottom-left-edge" });

  let scrollToPhase: (phase: MorphPhase) => void = () => undefined;
  const pillNav = createSlopePillNav((phase) => scrollToPhase(phase));
  figureWrap.append(pillNav.el);

  const sequence = createMorphSequence({
    reducedMotion,
    onMorphT: setT,
    onPhase: (phase) => {
      setNarrativePhase(narrative, phase);
      pillNav.setPhase(phase);
    },
    durationMs: 520,
    onThresholds,
    offThresholds,
  });

  const scrollDrive = attachDrive(sequence.handleDriverProgress);
  scrollToPhase = (phase) => {
    scrollDrive.scrollToProgress(phaseScrollProgress[phase] ?? 0, "auto");
    sequence.jumpToPhase(phase);
  };

  return {
    dispose: () => {
      scrollDrive.dispose();
      sequence.dispose();
    },
  };
}
