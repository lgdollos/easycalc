import "katex/dist/katex.min.css";
import "./style.css";
import { CHAPTER_BRIDGE_HTML, CHAPTER_REMAINDER_HTML } from "./content/chapterContent";
import { buildOpeningCopy } from "./content/openingCopy";
import { PANELS } from "./content/panels";
import { renderPanelFigure } from "./figures/renderPanel";
import type { PanelFigureMount } from "./figures/figureMount";
import { attachPanelMotion } from "./panelMotion";
import type { MotionCleanup } from "./motion/createHoverMotion";
import { attachPanelGridEnterStagger } from "./motion/panelGridEnter";
import { buildSlopeMorphSection } from "./slopeMorph/mountSection";
import { buildTwinPlotsInteractive } from "./twinPlots/interactive";
import { mountStaticFigures } from "./staticFigures/mount";
import { attachHoverGuide } from "./ui/hoverGuide";
import { renderMathIn } from "./ui/renderMath";

function buildChapterBlock(
  html: string,
  enhance?: (article: HTMLElement) => void,
): HTMLElement {
  const article = document.createElement("article");
  article.className = "chapter-copy";
  article.innerHTML = html;
  renderMathIn(article);
  enhance?.(article);
  return article;
}

function buildApp(root: HTMLElement): MotionCleanup {
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <h1>Geometrical meaning of differentiation</h1>
    <p>From Sylvanus P. Thompson, <cite>Calculus Made Easy</cite> — Chapter X.</p>
  `;

  const grid = document.createElement("div");
  grid.className = "panel-grid";
  const panelMounts: Array<{ cell: HTMLElement; mount: PanelFigureMount }> = [];

  for (const panel of PANELS) {
    const cell = document.createElement("article");
    cell.className = "panel";
    cell.dataset.panel = String(panel.id);

    const textWrap = document.createElement("div");
    textWrap.className = "panel-text";

    const title = document.createElement("h2");
    title.className = "panel-title";
    const num = document.createElement("span");
    num.className = "panel-title-num";
    num.textContent = `${panel.id}`;
    title.append(num, document.createTextNode(` ${panel.title}`));

    const body = document.createElement("div");
    body.className = "panel-body";
    body.innerHTML = panel.bodyHtml;

    textWrap.append(title, body);
    renderMathIn(body);

    const fig = document.createElement("figure");
    fig.className = "panel-figure";
    fig.dataset.panel = String(panel.id);
    const mount = renderPanelFigure(panel.figure);
    fig.append(mount.svg);

    cell.append(textWrap, fig);
    panelMounts.push({ cell, mount });
    grid.append(cell);
  }

  attachHoverGuide(grid, "hover", { placement: "outside-top-left" });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `<p>Source text (public domain): <a href="https://calculusmadeeasy.org/10.html" rel="noopener noreferrer">calculusmadeeasy.org/10.html</a>. Figures are recreated in the local comic and morph styles.</p>`;
  renderMathIn(footer);

  const slopeSection = buildSlopeMorphSection();

  root.append(
    header,
    buildOpeningCopy(),
    grid,
    buildChapterBlock(CHAPTER_BRIDGE_HTML),
    slopeSection.el,
    buildChapterBlock(CHAPTER_REMAINDER_HTML, (article) => {
      mountStaticFigures(article);
      const slot = article.querySelector(".twin-plots-slot");
      if (slot) slot.replaceWith(buildTwinPlotsInteractive());
    }),
    footer,
  );

  attachPanelGridEnterStagger(grid);
  const motionCleanups = panelMounts.map(({ cell, mount }) => attachPanelMotion(cell, mount));

  return () => {
    for (const cleanup of motionCleanups) cleanup();
    slopeSection.dispose();
  };
}

const app = document.querySelector<HTMLElement>("#app");
if (app) {
  const disposeApp = buildApp(app);
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      disposeApp();
      app.replaceChildren();
    });
  }
}
