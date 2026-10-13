import type { MountFor } from "../figures/figureMount";
import { createHoverMotion, type MotionCleanup } from "../motion/createHoverMotion";
import { skipHoverMotion } from "../motion/reducedMotion";
import {
  applyTrianglePose,
  rafEaseProgress,
  runTriangleCycle,
  triangleAtT,
  TRIANGLE_GROW_MS,
  type TriangleEls,
} from "../motion/triangleCycle";

const HIGHLIGHT_FADE_MS = 420;

export function attachShrinkChordMotion(
  panel: HTMLElement,
  mount: MountFor["shrinkChord"],
): MotionCleanup {
  if (skipHoverMotion()) return () => undefined;

  const {
    dx,
    dy,
    secant,
    pointT,
    labelT,
    labelDx,
    labelDy,
    highlightBox,
  } = mount.els;
  const geom = mount.geom;

  const kwEl = panel.querySelector<HTMLElement>(".panel-fig-kw-straight");
  if (!kwEl) return () => undefined;

  const els: TriangleEls = {
    dx,
    dy,
    sec: secant,
    dxLbl: labelDx,
    dyLbl: labelDy,
    tLbl: labelT,
    tDot: pointT,
  };

  const rest = triangleAtT(geom.qx, geom.qy, geom.tx, geom.ty);
  const txBig = geom.txFrom;
  const tyBig = geom.tyFrom;
  const txSmall = geom.tx;
  const tySmall = geom.ty;
  let highlightFadeAnim: Animation | null = null;

  const cancelBoxAnims = (): void => {
    highlightFadeAnim?.cancel();
    highlightFadeAnim = null;
    for (const a of highlightBox.getAnimations()) a.cancel();
  };

  const fadeInHighlight = (signal: AbortSignal): Promise<void> =>
    new Promise((resolve, reject) => {
      if (signal.aborted) {
        reject(new DOMException("Aborted", "AbortError"));
        return;
      }
      cancelBoxAnims();
      highlightBox.style.opacity = "0";
      const anim = highlightBox.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: HIGHLIGHT_FADE_MS,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        fill: "forwards",
      });
      highlightFadeAnim = anim;
      const onAbort = (): void => {
        anim.cancel();
        reject(new DOMException("Aborted", "AbortError"));
      };
      signal.addEventListener("abort", onAbort, { once: true });
      anim.onfinish = () => {
        signal.removeEventListener("abort", onAbort);
        anim.cancel();
        if (!signal.aborted) highlightBox.style.removeProperty("opacity");
        highlightFadeAnim = null;
        resolve();
      };
      anim.oncancel = () => {
        signal.removeEventListener("abort", onAbort);
        highlightFadeAnim = null;
        resolve();
      };
    });

  const restore = (): void => {
    cancelBoxAnims();
    applyTrianglePose(els, rest);
    highlightBox.style.removeProperty("opacity");
  };

  return createHoverMotion({
    panel,
    activateOn: [kwEl],
    onStart: async (signal, { playOnce }) => {
      await runTriangleCycle({
        signal,
        playOnce,
        animate: async (sig) => {
          highlightBox.style.opacity = "0";
          await rafEaseProgress(TRIANGLE_GROW_MS, sig, (e) => {
            applyTrianglePose(
              els,
              triangleAtT(
                geom.qx,
                geom.qy,
                txBig + e * (txSmall - txBig),
                tyBig + e * (tySmall - tyBig),
              ),
            );
          });
          applyTrianglePose(els, rest);
        },
        afterAnim: fadeInHighlight,
      });
    },
    onStop: restore,
  });
}
