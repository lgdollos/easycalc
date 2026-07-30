import { renderMathIn } from "../ui/renderMath";

export function buildOpeningCopy(): HTMLElement {
  const section = document.createElement("section");
  section.className = "opening-copy";
  section.innerHTML = `
    <p>It is useful to consider what geometrical meaning can be given to the differential coefficient.</p>
    <p>In the first place, any function of <span class="math">x</span>, such, for example, as <span class="math">x^2</span>, or <span class="math">\\sqrt{x}</span>, or <span class="math">ax+b</span>, can be plotted as a curve; and nowadays every schoolboy is familiar with the process of curve-plotting.</p>
  `;
  renderMathIn(section);
  return section;
}
