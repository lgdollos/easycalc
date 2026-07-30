import type { MorphPhase } from "./morphSequence";

type SlopePillSpec = {
  phase: MorphPhase;
  label: string;
  path: string;
};

type SlopePillNav = {
  el: HTMLElement;
  setPhase: (phase: MorphPhase) => void;
};

const SLOPE_PILLS: readonly SlopePillSpec[] = [
  {
    phase: 0,
    label: "Jump to Figure 8: 45° slope",
    path: "M15 34 L33 14",
  },
  {
    phase: 2,
    label: "Jump to Figure 10: gentle upward slope",
    path: "M12 30 C20 30 29 27 36 22",
  },
  {
    phase: 3,
    label: "Jump to horizontal slope",
    path: "M12 24 H36",
  },
  {
    phase: 4,
    label: "Jump to Figure 11: downward slope",
    path: "M12 18 C21 12 31 18 36 30",
  },
] as const;

function createMiniSlope(path: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  svg.setAttribute("class", "sm-pill-svg");

  const curve = document.createElementNS("http://www.w3.org/2000/svg", "path");
  curve.setAttribute("d", path);
  curve.setAttribute("fill", "none");
  curve.setAttribute("stroke", "currentColor");
  curve.setAttribute("stroke-width", "4.2");
  curve.setAttribute("stroke-linecap", "round");
  curve.setAttribute("stroke-linejoin", "round");
  svg.append(curve);

  return svg;
}

export function createSlopePillNav(onSelect: (phase: MorphPhase) => void): SlopePillNav {
  const el = document.createElement("nav");
  el.className = "sm-slope-pills";
  el.setAttribute("aria-label", "Slope figure shortcuts");

  const buttons = SLOPE_PILLS.map((pill) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "sm-slope-pill";
    button.dataset.phase = String(pill.phase);
    button.setAttribute("aria-label", pill.label);
    button.append(createMiniSlope(pill.path));
    button.addEventListener("click", () => onSelect(pill.phase));
    el.append(button);
    return button;
  });

  const setPhase = (phase: MorphPhase) => {
    // No dedicated pill for phase 1 (steep Fig 9); keep topmost active through it.
    const activePhase: MorphPhase = phase === 1 ? 0 : phase;
    for (const button of buttons) {
      const buttonPhase = Number(button.dataset.phase) as MorphPhase;
      const isActive = buttonPhase === activePhase;
      button.dataset.phaseState =
        isActive ? "active" : buttonPhase < phase ? "past" : "future";
      if (isActive) {
        button.setAttribute("aria-current", "true");
      } else {
        button.removeAttribute("aria-current");
      }
    }
  };

  setPhase(0);

  return { el, setPhase };
}
