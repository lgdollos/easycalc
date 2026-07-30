/** Bind pointerenter/leave on triggers to a boolean flag + optional change callback. */
export function bindFlagHovers(
  triggers: HTMLElement[],
  setFlag: (v: boolean) => void,
  onChange?: () => void,
): () => void {
  const enter = (): void => {
    setFlag(true);
    onChange?.();
  };
  const leave = (): void => {
    setFlag(false);
    onChange?.();
  };
  for (const el of triggers) {
    el.addEventListener("pointerenter", enter);
    el.addEventListener("pointerleave", leave);
  }
  return () => {
    for (const el of triggers) {
      el.removeEventListener("pointerenter", enter);
      el.removeEventListener("pointerleave", leave);
    }
  };
}
