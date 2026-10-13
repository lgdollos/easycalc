import "./hover-guide.css";
import { hoverOrTapLabel, subscribeFineHover } from "./pointerMode";

export type HoverGuideInteraction = "drag" | "hover" | "scroll";

export type AttachHoverGuideOptions = {
  /** corner = top-left on figure; outside-top-left = just outside host top-left; on-bottom-left-edge = straddles host bottom border; inline = flow next to hint */
  placement?: "corner" | "outside-top-left" | "on-bottom-left-edge" | "inline";
};

const LABELS: Record<HoverGuideInteraction, string> = {
  drag: "Click & drag",
  hover: "Hover",
  scroll: "Scroll",
};

const HAND_ICON = `
  <svg class="hover-guide-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round">
    <path d="M8 11.5V8.2a1.15 1.15 0 0 1 2.3 0V11" />
    <path d="M10.3 11V6.4a1.15 1.15 0 1 1 2.3 0V11" />
    <path d="M12.6 11V6.9a1.15 1.15 0 1 1 2.3 0V11.2" />
    <path d="M14.9 11.4v-.7a1.15 1.15 0 1 1 2.3 0v5.1c0 2.7-1.85 5.05-4.45 5.7-.45.12-.92.2-1.4.2h-.2c-2.75 0-5.1-1.95-5.6-4.65L5.1 13a1.4 1.4 0 0 1 2.7-.65L8.7 14.2" />
  </svg>
`;

const SCROLL_ICON = `
  <svg class="hover-guide-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
    <rect x="8" y="3.5" width="8" height="17" rx="4" />
    <path d="M12 7v3.5" />
    <path d="M10.25 14.25 12 12.5l1.75 1.75" />
    <path d="M10.25 17.25 12 19l1.75-1.75" />
  </svg>
`;

const ICONS: Record<HoverGuideInteraction, string> = {
  drag: HAND_ICON,
  hover: HAND_ICON,
  scroll: SCROLL_ICON,
};

const PLACEMENT_CLASS: Record<NonNullable<AttachHoverGuideOptions["placement"]>, string> = {
  corner: "",
  "outside-top-left": "hover-guide--outside-top-left",
  "on-bottom-left-edge": "hover-guide--on-bottom-left-edge",
  inline: "hover-guide--inline",
};

const hoverLabelEls = new Set<HTMLElement>();
let hoverLabelUnsub: (() => void) | null = null;

function labelFor(interaction: HoverGuideInteraction): string {
  if (interaction === "hover") return hoverOrTapLabel();
  return LABELS[interaction];
}

function syncHoverLabels(): void {
  const text = hoverOrTapLabel();
  for (const el of hoverLabelEls) {
    if (!el.isConnected) hoverLabelEls.delete(el);
    else el.textContent = text;
  }
}

function trackHoverLabel(el: HTMLElement): void {
  hoverLabelEls.add(el);
  if (hoverLabelUnsub) return;
  hoverLabelUnsub = subscribeFineHover(() => {
    syncHoverLabels();
  });
}

export function createHoverGuide(
  interaction: HoverGuideInteraction,
  options: AttachHoverGuideOptions = {},
): HTMLElement {
  const placement = options.placement ?? "corner";
  const el = document.createElement("div");
  const extra = PLACEMENT_CLASS[placement];
  el.className = extra ? `hover-guide ${extra}` : "hover-guide";
  el.dataset.interaction = interaction;
  el.setAttribute("aria-hidden", "true");
  el.innerHTML = `${ICONS[interaction]}<span class="hover-guide-label">${labelFor(interaction)}</span>`;
  if (interaction === "hover") {
    const label = el.querySelector<HTMLElement>(".hover-guide-label");
    if (label) trackHoverLabel(label);
  }
  return el;
}

/** Mounts a persistent gesture pill on a host. Always visible. */
export function attachHoverGuide(
  host: HTMLElement,
  interaction: HoverGuideInteraction,
  options: AttachHoverGuideOptions = {},
): { el: HTMLElement } {
  const placement = options.placement ?? "corner";
  if (placement !== "inline") host.classList.add("has-hover-guide");
  const el = createHoverGuide(interaction, options);
  host.appendChild(el);
  return { el };
}
