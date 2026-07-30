import katex from "katex";

/** Render KaTeX into `.math` / `.math-display` nodes under `container`. */
export function renderMathIn(container: HTMLElement): void {
  container.querySelectorAll<HTMLElement>(".math, .math-display").forEach((el) => {
    const tex = el.textContent?.trim() ?? "";
    katex.render(tex, el, {
      throwOnError: false,
      displayMode: el.classList.contains("math-display"),
    });
  });
}
