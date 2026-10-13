import { POINTS, dTipFor } from "./model";
import { createFig23, createFig24 } from "./renderPlots";
import { attachHoverGuide } from "../ui/hoverGuide";
import { hoverOrTapLabel, subscribeFineHover } from "../ui/pointerMode";
import { renderMathIn } from "../ui/renderMath";

/** Linked table + Figures 23/24 + readout. Shared by main chapter and twin-plots prototype. */
export function buildTwinPlotsInteractive(): HTMLElement {
  const host = document.createElement("div");
  host.className = "twin-plots-interactive";
  host.tabIndex = 0;

  let activeX = Number.NaN;
  const colsByX = new Map<number, HTMLElement[]>();
  const readoutHtml = new Map<number, string>();

  const fig23 = createFig23({ onPick: setActiveX });
  const fig24 = createFig24({ onPick: setActiveX });

  host.innerHTML = `
    <div class="tp-table-wrap">
      <div class="tp-hint-row"></div>
      <table class="tp-table">
        <tbody>
          <tr data-row="x">
            <th scope="row"><span class="math">x</span></th>
          </tr>
          <tr data-row="y">
            <th scope="row"><span class="math">y</span></th>
          </tr>
          <tr data-row="d">
            <th scope="row"><span class="math">d</span></th>
          </tr>
        </tbody>
      </table>
    </div>

    <p>
      Then plot them out in two curves, in Figure 23 plotting the values of
      <span class="math">y</span> against those of <span class="math">x</span> and in Figure 24
      those of <span class="math">\\dfrac{dy}{dx}</span> against those of
      <span class="math">x</span>.
    </p>

    <div class="tp-plots">
      <figure class="tp-fig">
        <figcaption class="tp-fig-label">Figure 23</figcaption>
        <div class="tp-fig23-slot"></div>
      </figure>
      <figure class="tp-fig">
        <figcaption class="tp-fig-label">Figure 24</figcaption>
        <div class="tp-fig24-slot"></div>
      </figure>
    </div>

    <p class="tp-punch">
      For any assigned value of <span class="math">x</span>, the height of the ordinate in the
      second curve is proportional to the slope of the first curve.
    </p>
    <p class="tp-readout" aria-live="polite"></p>
  `;

  const hintRow = host.querySelector<HTMLElement>(".tp-hint-row")!;
  const hint = document.createElement("p");
  hint.className = "tp-hint";
  const syncHint = (): void => {
    hint.textContent =
      hoverOrTapLabel() === "Hover"
        ? "Hover a table column, or move across either figure — table, Figure 23, and Figure 24 stay linked."
        : "Tap a table column, or tap either figure — table, Figure 23, and Figure 24 stay linked.";
  };
  syncHint();
  subscribeFineHover(syncHint);
  const hintGuide = attachHoverGuide(hintRow, "hover", { placement: "inline" });
  hintRow.appendChild(hint);
  hintRow.prepend(hintGuide.el);

  const table = host.querySelector<HTMLTableElement>(".tp-table")!;
  const rowX = table.querySelector<HTMLTableRowElement>('tr[data-row="x"]')!;
  const rowY = table.querySelector<HTMLTableRowElement>('tr[data-row="y"]')!;
  const rowD = table.querySelector<HTMLTableRowElement>('tr[data-row="d"]')!;
  const readout = host.querySelector<HTMLElement>(".tp-readout")!;

  const figs = host.querySelectorAll<HTMLElement>(".tp-fig");
  const fig23El = figs[0]!;
  const fig24El = figs[1]!;
  const fig23Slot = host.querySelector<HTMLElement>(".tp-fig23-slot")!;
  const fig24Slot = host.querySelector<HTMLElement>(".tp-fig24-slot")!;
  fig23Slot.appendChild(fig23.svg);
  fig24Slot.appendChild(fig24.svg);
  attachHoverGuide(fig23El, "hover");
  attachHoverGuide(fig24El, "hover");

  function makeCell(x: number, inner: string, focusable: boolean) {
    const td = document.createElement("td");
    td.className = "tp-col";
    td.dataset.x = String(x);
    td.innerHTML = `<span class="math">${inner}</span>`;
    if (focusable) {
      td.tabIndex = 0;
      td.setAttribute("aria-label", `x equals ${x}`);
    }
    return td;
  }

  function setActiveX(x: number) {
    if (x === activeX) return;

    colsByX.get(activeX)?.forEach((el) => el.classList.remove("is-active"));
    colsByX.get(x)?.forEach((el) => el.classList.add("is-active"));

    activeX = x;
    table.dataset.activeX = String(x);
    fig23.setX(x);
    fig24.setX(x);
    readout.innerHTML = readoutHtml.get(x) ?? "";
  }

  for (const p of POINTS) {
    const tdX = makeCell(p.x, String(p.x), true);
    const tdY = makeCell(p.x, p.yLabel, false);
    const tdD = makeCell(p.x, p.dLabel, false);
    tdD.classList.add("tp-col-d");
    const tip = document.createElement("span");
    tip.className = "tp-d-tip";
    tip.setAttribute("aria-hidden", "true");
    tip.innerHTML = `<span class="math">${dTipFor(p)}</span>`;
    tdD.appendChild(tip);

    const onEnter = () => {
      setActiveX(p.x);
    };
    for (const td of [tdX, tdY, tdD]) {
      td.addEventListener("pointerenter", onEnter);
      td.addEventListener("focus", onEnter);
      td.addEventListener("click", onEnter);
    }
    tdX.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setActiveX(p.x);
      }
    });

    colsByX.set(p.x, [tdX, tdY, tdD]);
    rowX.appendChild(tdX);
    rowY.appendChild(tdY);
    rowD.appendChild(tdD);

    const scratch = document.createElement("div");
    scratch.innerHTML =
      `Here <span class="math">x = ${p.x}</span>, ` +
      `<span class="math">y = ${p.yLabel}</span>, ` +
      `<span class="math">d = \\dfrac{dy}{dx} = ${p.dLabel}</span> — ` +
      `the ordinate on Figure 24 has that height; the tangent on Figure 23 has that slope.`;
    renderMathIn(scratch);
    readoutHtml.set(p.x, scratch.innerHTML);
  }

  host.addEventListener("keydown", (e) => {
    const idx = POINTS.findIndex((p) => p.x === activeX);
    if (e.key === "ArrowRight" && idx < POINTS.length - 1) {
      e.preventDefault();
      setActiveX(POINTS[idx + 1].x);
    } else if (e.key === "ArrowLeft" && idx > 0) {
      e.preventDefault();
      setActiveX(POINTS[idx - 1].x);
    }
  });

  renderMathIn(host);
  setActiveX(2);
  return host;
}
