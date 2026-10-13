import type { MountFor } from "../figures/figureMount";
import { bindFlagHovers } from "../motion/bindFlagHovers";
import type { MotionCleanup } from "../motion/createHoverMotion";
import { createPointerPresence } from "../motion/createPointerPresence";
import { createPointPulse, PULSE_PANEL } from "../motion/pointPulse";
import { skipHoverMotion } from "../motion/reducedMotion";

export function attachTangentMotion(
  panel: HTMLElement,
  mount: MountFor["tangent"],
): MotionCleanup {
  if (skipHoverMotion()) return () => undefined;

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

  const kw = panel.querySelector<HTMLElement>(".panel-fig-kw-slope-tangent");
  const unKw = kw ? bindFlagHovers([kw], () => undefined) : () => undefined;

  return () => {
    presence();
    unKw();
    pulse.dispose();
  };
}
