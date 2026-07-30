import type { MountFor } from "../figures/figureMount";
import type { MotionCleanup } from "../motion/createHoverMotion";
import { attachPointQMotion } from "./pointQ";
import { attachChordMotion } from "./chord";
import { attachManySlopesMotion } from "./manySlopes";
import { attachShrinkChordMotion } from "./shrinkChord";
import { attachDyDxMergeMotion } from "./dyDxMerge";
import { attachProducedMotion } from "./produced";
import { attachLimitShrinkMotion } from "./limitShrink";
import { attachTangentMotion } from "./tangent";

/** Correlated dispatch so mount.kind selects the matching attacher. */
export function attachPanelMotion(
  panel: HTMLElement,
  mount: MountFor[keyof MountFor],
): MotionCleanup {
  switch (mount.kind) {
    case "pointQ":
      return attachPointQMotion(panel, mount);
    case "chord":
      return attachChordMotion(panel, mount);
    case "manySlopes":
      return attachManySlopesMotion(panel, mount);
    case "shrinkChord":
      return attachShrinkChordMotion(panel, mount);
    case "dyDxMerge":
      return attachDyDxMergeMotion(panel, mount);
    case "produced":
      return attachProducedMotion(panel, mount);
    case "limitShrink":
      return attachLimitShrinkMotion(panel, mount);
    case "tangent":
      return attachTangentMotion(panel, mount);
    default: {
      const _exhaustive: never = mount;
      throw new Error(`Unknown mount kind: ${JSON.stringify(_exhaustive)}`);
    }
  }
}
