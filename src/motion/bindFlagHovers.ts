import { hasFineHover } from "../ui/pointerMode";
import { KW_ACTIVE_CLASS, PANEL_MOTION_STOP_EVENT, PANEL_MOTION_TAP_EVENT } from "./createHoverMotion";

type PanelTapDetail = { target: EventTarget | null };

/** Bind pointerenter/leave on triggers to a boolean flag + optional change callback. */
export function bindFlagHovers(
  triggers: HTMLElement[],
  setFlag: (v: boolean) => void,
  onChange?: () => void,
): () => void {
  const enter = (e: PointerEvent): void => {
    if (e.pointerType !== "mouse" || !hasFineHover()) return;
    setFlag(true);
    onChange?.();
  };
  const leave = (e: PointerEvent): void => {
    if (e.pointerType !== "mouse" || !hasFineHover()) return;
    setFlag(false);
    onChange?.();
  };
  for (const el of triggers) {
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
  }

  const panel = triggers[0]?.closest(".panel");
  const hitTrigger = (target: EventTarget | null): boolean => {
    if (!(target instanceof Node)) return false;
    return triggers.some((t) => t === target || t.contains(target));
  };

  const onPanelTap = (e: Event): void => {
    const target = (e as CustomEvent<PanelTapDetail>).detail?.target ?? null;
    const hit = hitTrigger(target);
    for (const t of triggers) t.classList.toggle(KW_ACTIVE_CLASS, hit);
    setFlag(hit);
    onChange?.();
  };
  const onMotionStop = (): void => {
    for (const t of triggers) t.classList.remove(KW_ACTIVE_CLASS);
    setFlag(false);
    onChange?.();
  };
  panel?.addEventListener(PANEL_MOTION_TAP_EVENT, onPanelTap);
  panel?.addEventListener(PANEL_MOTION_STOP_EVENT, onMotionStop);

  return () => {
    for (const el of triggers) {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    }
    panel?.removeEventListener(PANEL_MOTION_TAP_EVENT, onPanelTap);
    panel?.removeEventListener(PANEL_MOTION_STOP_EVENT, onMotionStop);
  };
}
