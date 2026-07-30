import { clamp01, easeOutCubic } from "../motion/math";

export const MORPH_KEY_TARGETS = [0, 0.25, 0.5, 0.75, 1] as const;

export type MorphPhase = 0 | 1 | 2 | 3 | 4;

export type MorphSequenceOptions = {
  reducedMotion: boolean;
  /** Global morph parameter in [0, 1] (piecewise across Fig 8–11). */
  onMorphT: (t: number) => void;
  /** Active narrative phase (0 = Fig 8 … 4 = Fig 11). */
  onPhase: (phase: MorphPhase) => void;
  durationMs?: number;
  /** Forward thresholds: progress >= on[i] allows index i + 1. Length 4. */
  onThresholds?: readonly number[];
  /** Reverse thresholds: progress < off[i] drops below index i + 1. Length 4. */
  offThresholds?: readonly number[];
};

const EPS = 0.003;

function resolveTargetIndex(
  progress: number,
  onT: readonly number[],
  offT: readonly number[],
): number {
  let idx = 0;
  while (idx < 4 && progress >= onT[idx]) {
    idx += 1;
  }
  while (idx > 0 && progress < offT[idx - 1]) {
    idx -= 1;
  }
  return idx;
}

function reducedMotionTargetIndex(progress: number): number {
  return Math.min(4, Math.max(0, Math.floor(progress * 5)));
}

export function createMorphSequence(opts: MorphSequenceOptions) {
  const durationMs = Math.max(1, opts.durationMs ?? 520);
  const onT = opts.onThresholds ?? [0.14, 0.3, 0.46, 0.62];
  const offT = opts.offThresholds ?? [0.1, 0.26, 0.42, 0.58];

  let morphT = 0;
  let animating = false;
  let animRaf = 0;
  let t0 = 0;
  let fromT = 0;
  let toT = 0;
  let lastPhase: MorphPhase = 0;

  const applyFrame = (now: number) => {
    const elapsed = now - t0;
    const u = clamp01(elapsed / durationMs);
    const eased = easeOutCubic(u);
    morphT = fromT + (toT - fromT) * eased;
    opts.onMorphT(morphT);

    if (u < 1) {
      animRaf = requestAnimationFrame(applyFrame);
    } else {
      morphT = toT;
      animating = false;
      animRaf = 0;
      opts.onMorphT(morphT);
    }
  };

  const keyForIndex = (i: number): number => MORPH_KEY_TARGETS[i] ?? 0;

  const cancelAnim = () => {
    if (animRaf) cancelAnimationFrame(animRaf);
    animRaf = 0;
    animating = false;
  };

  const startAnim = (targetIndex: number) => {
    const idx = Math.min(4, Math.max(0, targetIndex));
    const next = keyForIndex(idx);
    if (Math.abs(morphT - next) < EPS) {
      if (idx !== lastPhase) {
        lastPhase = idx as MorphPhase;
        opts.onPhase(lastPhase);
      }
      return;
    }
    cancelAnim();
    fromT = morphT;
    toT = next;
    animating = true;
    t0 = performance.now();
    const phase = idx as MorphPhase;
    if (phase !== lastPhase) {
      lastPhase = phase;
      opts.onPhase(phase);
    }
    animRaf = requestAnimationFrame(applyFrame);
  };

  const handleDriverProgress = (progress: number) => {
    if (opts.reducedMotion) {
      const idx = reducedMotionTargetIndex(progress);
      const next = keyForIndex(idx);
      if (Math.abs(morphT - next) >= EPS || idx !== lastPhase) {
        cancelAnim();
        morphT = next;
        opts.onMorphT(morphT);
        lastPhase = idx as MorphPhase;
        opts.onPhase(lastPhase);
      }
      return;
    }

    const targetIdx = resolveTargetIndex(progress, onT, offT);
    const targetKey = keyForIndex(targetIdx);

    if (animating && Math.abs(toT - targetKey) > 0.02) {
      cancelAnim();
    }

    if (!animating) {
      if (Math.abs(morphT - targetKey) < EPS) {
        if (targetIdx !== lastPhase) {
          lastPhase = targetIdx as MorphPhase;
          opts.onPhase(lastPhase);
        }
      } else {
        startAnim(targetIdx);
      }
    }
  };

  const dispose = () => {
    cancelAnim();
  };

  const jumpToPhase = (phase: MorphPhase) => {
    if (opts.reducedMotion) {
      const next = keyForIndex(phase);
      cancelAnim();
      morphT = next;
      opts.onMorphT(morphT);
      lastPhase = phase;
      opts.onPhase(lastPhase);
      return;
    }

    startAnim(phase);
  };

  return { handleDriverProgress, jumpToPhase, dispose, getMorphT: () => morphT };
}
