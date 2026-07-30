import type { MountFor } from "../figures/figureMount";
import { ACCENT, ACCENT_STROKE_WIDTH } from "../motion/accent";
import { bindFlagHovers } from "../motion/bindFlagHovers";
import { createHoverMotion, type MotionCleanup } from "../motion/createHoverMotion";
import { prefersReducedMotion } from "../motion/reducedMotion";
import {
  applyTrianglePose,
  rafEaseProgress,
  runTriangleCycle,
  triangleFromProgress,
  TRIANGLE_GROW_MS,
  type TriangleEls,
} from "../motion/triangleCycle";

export function attachChordMotion(
  panel: HTMLElement,
  mount: MountFor["chord"],
): MotionCleanup {
  if (prefersReducedMotion()) return () => undefined;

  const { dx, dy, secant, labelDx, labelDy, labelSecant, labelT, pointT, geom } = {
    ...mount.els,
    geom: mount.geom,
  };

  const els: TriangleEls = {
    dx,
    dy,
    sec: secant,
    dxLbl: labelDx,
    dyLbl: labelDy,
    secLbl: labelSecant,
    tLbl: labelT,
    tDot: pointT,
  };

  const rest = triangleFromProgress(1, geom.qx, geom.qy, geom.tx, geom.ty);
  let dxTextHover = false;
  let dyTextHover = false;

  const syncFigFromText = (): void => {
    if (dxTextHover) {
      dx.style.stroke = ACCENT;
      dx.style.strokeWidth = String(ACCENT_STROKE_WIDTH);
    } else {
      dx.style.removeProperty("stroke");
      dx.style.removeProperty("stroke-width");
    }
    if (dyTextHover) {
      dy.style.stroke = ACCENT;
      dy.style.strokeWidth = String(ACCENT_STROKE_WIDTH);
    } else {
      dy.style.removeProperty("stroke");
      dy.style.removeProperty("stroke-width");
    }
    if (dxTextHover) labelDx.style.fill = ACCENT;
    else labelDx.style.removeProperty("fill");
    if (dyTextHover) labelDy.style.fill = ACCENT;
    else labelDy.style.removeProperty("fill");
  };

  const restore = (): void => {
    applyTrianglePose(els, rest);
    syncFigFromText();
  };

  const hoverCleanup = createHoverMotion({
    panel,
    onStart: async (signal) => {
      await runTriangleCycle({
        signal,
        animate: async (sig) => {
          await rafEaseProgress(TRIANGLE_GROW_MS, sig, (p) => {
            applyTrianglePose(
              els,
              triangleFromProgress(p, geom.qx, geom.qy, geom.tx, geom.ty),
            );
            syncFigFromText();
          });
        },
      });
    },
    onStop: restore,
  });

  const dxTriggers = [...panel.querySelectorAll<HTMLElement>(".math-fig-dx")];
  const dyTriggers = [...panel.querySelectorAll<HTMLElement>(".math-fig-dy")];
  const unDx = bindFlagHovers(
    dxTriggers,
    (v) => {
      dxTextHover = v;
    },
    syncFigFromText,
  );
  const unDy = bindFlagHovers(
    dyTriggers,
    (v) => {
      dyTextHover = v;
    },
    syncFigFromText,
  );

  return () => {
    hoverCleanup();
    unDx();
    unDy();
  };
}
