import type { MountFor } from "../figures/figureMount";
import {
  applyLine,
  pauseMs,
  rafFadeOpacity,
  rafGrowLine,
  readLineSnap,
  type LineSnap,
} from "../motion/figureUtils";
import { createHoverMotion, type MotionCleanup } from "../motion/createHoverMotion";
import { skipHoverMotion } from "../motion/reducedMotion";

const HIDE_MS = 220;
const DRAW_MS = 1020;
const BETWEEN_CYCLES_MS = 1000;

function restoreStaticRest(parts: SVGLineElement[], snaps: LineSnap[]): void {
  for (let i = 0; i < parts.length; i++) {
    const el = parts[i]!;
    applyLine(el, snaps[i]!);
    el.style.opacity = "";
    el.style.strokeDasharray = "";
    el.style.strokeDashoffset = "";
    el.style.stroke = "";
  }
}

async function playFigureHover(
  parts: SVGLineElement[],
  snaps: LineSnap[],
  signal: AbortSignal,
): Promise<void> {
  try {
    await rafFadeOpacity(parts, 1, 0, HIDE_MS, signal);
  } catch {
    return;
  }
  if (signal.aborted) return;

  for (let i = 0; i < parts.length; i++) {
    const el = parts[i]!;
    const s = snaps[i]!;
    applyLine(el, { x1: s.x1, y1: s.y1, x2: s.x1, y2: s.y1 });
    el.style.opacity = "1";
    el.style.strokeDasharray = "";
    el.style.strokeDashoffset = "";
  }

  try {
    await Promise.all(
      parts.map((el, i) => {
        const s = snaps[i]!;
        return rafGrowLine(el, s.x1, s.y1, s.x2, s.y2, DRAW_MS, signal);
      }),
    );
  } catch {
    return;
  }
  if (signal.aborted) return;
  restoreStaticRest(parts, snaps);
}

export function attachProducedMotion(
  panel: HTMLElement,
  mount: MountFor["produced"],
): MotionCleanup {
  if (skipHoverMotion()) return () => undefined;

  const parts = [...mount.els.produced];
  const restSnaps = parts.map(readLineSnap);
  const kw = panel.querySelector<HTMLElement>(".panel-fig-kw-line-qt");

  return createHoverMotion({
    panel,
    activateOn: kw ? [kw] : [],
    onStart: async (signal, { playOnce }) => {
      while (!signal.aborted) {
        await playFigureHover(parts, restSnaps, signal);
        if (signal.aborted || playOnce) break;
        try {
          await pauseMs(BETWEEN_CYCLES_MS, signal);
        } catch {
          break;
        }
      }
    },
    onStop: () => restoreStaticRest(parts, restSnaps),
  });
}
