import type { MountFor } from "../figures/figureMount";
import { PROJECTION_GUIDE_DASH, PROJECTION_GUIDE_DASH_PERIOD } from "../figures/coords";
import { ACCENT, ACCENT_STROKE_WIDTH } from "../motion/accent";
import { bindFlagHovers } from "../motion/bindFlagHovers";
import type { MotionCleanup } from "../motion/createHoverMotion";
import { createPointerPresence } from "../motion/createPointerPresence";
import { createPointPulse, PULSE_PANEL, PULSE_Q_ACCENT } from "../motion/pointPulse";
import { skipHoverMotion } from "../motion/reducedMotion";

const MARCH_MS = 1200;

export function attachPointQMotion(
  panel: HTMLElement,
  mount: MountFor["pointQ"],
): MotionCleanup {
  if (skipHoverMotion()) return () => undefined;

  const { projX, projY, pointQ, labelQ, tickX, tickY } = mount.els;
  const projLines = [projX, projY];

  const qTriggers = [...panel.querySelectorAll<HTMLElement>(".math-fig-q")];
  const projXTriggers = [...panel.querySelectorAll<HTMLElement>(".math-fig-proj-x")];
  const projYTriggers = [...panel.querySelectorAll<HTMLElement>(".math-fig-proj-y")];

  let qHover = false;
  let projXHover = false;
  let projYHover = false;
  const pulse = createPointPulse(pointQ);

  type MotionMode = "q" | "projX" | "projY" | "projXY" | "panel";
  const MODE: Record<
    MotionMode,
    { marchX: boolean; marchY: boolean; pulse: boolean; accent: boolean }
  > = {
    q: { marchX: false, marchY: false, pulse: true, accent: true },
    projX: { marchX: true, marchY: false, pulse: false, accent: true },
    projY: { marchX: false, marchY: true, pulse: false, accent: true },
    projXY: { marchX: true, marchY: true, pulse: false, accent: true },
    panel: { marchX: true, marchY: true, pulse: true, accent: false },
  };

  const activeMode = (): MotionMode => {
    if (qHover) return "q";
    if (projXHover && projYHover) return "projXY";
    if (projXHover) return "projX";
    if (projYHover) return "projY";
    return "panel";
  };

  const syncSymbolLabelFills = (): void => {
    if (qHover) labelQ.style.fill = ACCENT;
    else labelQ.style.removeProperty("fill");
    if (projXHover) tickX.style.fill = ACCENT;
    else tickX.style.removeProperty("fill");
    if (projYHover) tickY.style.fill = ACCENT;
    else tickY.style.removeProperty("fill");
  };

  const clearProjLine = (ln: SVGLineElement): void => {
    ln.style.removeProperty("stroke-dasharray");
    ln.style.removeProperty("stroke-dashoffset");
    ln.style.removeProperty("stroke");
    ln.style.removeProperty("stroke-width");
  };

  const marchLine = (ln: SVGLineElement, elapsed: number, accentStroke: boolean): void => {
    const march =
      ((elapsed / MARCH_MS) * PROJECTION_GUIDE_DASH_PERIOD) % PROJECTION_GUIDE_DASH_PERIOD;
    if (accentStroke) {
      ln.style.stroke = ACCENT;
      ln.style.strokeWidth = String(ACCENT_STROKE_WIDTH);
    } else {
      ln.style.removeProperty("stroke");
      ln.style.removeProperty("stroke-width");
    }
    ln.style.strokeDasharray = PROJECTION_GUIDE_DASH;
    ln.style.strokeDashoffset = String(-march);
  };

  const onStop = (): void => {
    for (const ln of projLines) clearProjLine(ln);
    pulse.reset();
    syncSymbolLabelFills();
  };

  const presence = createPointerPresence({
    panel,
    onFrame: (elapsed) => {
      const cfg = MODE[activeMode()];
      if (cfg.pulse) {
        pulse.apply(elapsed, cfg.accent ? PULSE_Q_ACCENT : PULSE_PANEL);
      } else {
        pulse.reset();
      }
      if (cfg.marchX) marchLine(projX, elapsed, cfg.accent);
      else clearProjLine(projX);
      if (cfg.marchY) marchLine(projY, elapsed, cfg.accent);
      else clearProjLine(projY);
    },
    onStop,
  });

  const unbindQ = bindFlagHovers(qTriggers, (v) => {
    qHover = v;
  }, syncSymbolLabelFills);
  const unbindX = bindFlagHovers(projXTriggers, (v) => {
    projXHover = v;
  }, syncSymbolLabelFills);
  const unbindY = bindFlagHovers(projYTriggers, (v) => {
    projYHover = v;
  }, syncSymbolLabelFills);

  return () => {
    presence();
    unbindQ();
    unbindX();
    unbindY();
    pulse.dispose();
  };
}
