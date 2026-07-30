import type { MountFor } from "../figures/figureMount";
import type { MotionCleanup } from "../motion/createHoverMotion";
import { createPointerPresence } from "../motion/createPointerPresence";
import { createPointPulse, PULSE_PANEL } from "../motion/pointPulse";
import { prefersReducedMotion } from "../motion/reducedMotion";

export function attachTangentMotion(
  panel: HTMLElement,
  mount: MountFor["tangent"],
): MotionCleanup {
  if (prefersReducedMotion()) return () => undefined;

  const { pointQ, tangent } = mount.els;
  const pulse = createPointPulse(pointQ);
  let tangentSolid = false;

  const setTangentSolid = (solid: boolean): void => {
    if (solid === tangentSolid) return;
    tangentSolid = solid;
    if (solid) tangent.style.strokeDasharray = "none";
    else tangent.style.removeProperty("stroke-dasharray");
  };

  const presence = createPointerPresence({
    panel,
    onFrame: (elapsed) => {
      pulse.apply(elapsed, PULSE_PANEL);
      setTangentSolid(true);
    },
    onStop: () => {
      pulse.reset();
      setTangentSolid(false);
    },
  });

  return () => {
    presence();
    pulse.dispose();
  };
}
