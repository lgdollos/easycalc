import { isStaticFigNumber } from "./defs";
import { renderStaticFigure } from "./render";

/** Replace `.static-fig-slot[data-fig]` placeholders with rendered figures. */
export function mountStaticFigures(root: ParentNode): void {
  const slots = root.querySelectorAll<HTMLElement>(".static-fig-slot[data-fig]");
  slots.forEach((slot) => {
    const n = Number(slot.dataset.fig);
    if (!isStaticFigNumber(n)) {
      console.warn(`Unknown static figure slot: ${slot.dataset.fig}`);
      return;
    }
    slot.replaceWith(renderStaticFigure(n));
  });
}
