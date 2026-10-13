import "./table-difference.css";
import { f, fp } from "../../figures/coords";
import { hoverOrTapLabel, subscribeFineHover } from "../../ui/pointerMode";

type Point = {
  x: number;
  y: number;
  slope: number;
};

const POINTS: Point[] = Array.from({ length: 6 }, (_, x) => ({
  x,
  y: f(x),
  slope: fp(x),
}));

const SVG_NS = "http://www.w3.org/2000/svg";
const WIDTH = 360;
const HEIGHT = 210;

function formatNumber(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0$/, "");
}

function createSvgElement<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string>,
) {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
  return el;
}

function scaleX(x: number) {
  return 34 + (x / 5) * 292;
}

function scaleY(value: number, max: number) {
  return 178 - ((value - 0) / max) * 138;
}

function curvePath(max: number, fn: (x: number) => number) {
  return Array.from({ length: 90 }, (_, index) => {
    const x = (index / 89) * 5;
    const screenX = scaleX(x);
    const screenY = scaleY(fn(x), max);
    return `${index === 0 ? "M" : "L"} ${screenX} ${screenY}`;
  }).join(" ");
}

function setActiveX(root: HTMLElement, x: number) {
  const clampedX = Math.max(0, Math.min(5, x));
  const nearest = Math.round(clampedX);
  const y = f(clampedX);
  const slope = fp(clampedX);
  const yMax = POINTS[POINTS.length - 1].y;

  root.style.setProperty("--active-x", String(clampedX));
  root.style.setProperty("--active-step", String(nearest));
  root.querySelectorAll<HTMLElement>("[data-x]").forEach((el) => {
    el.classList.toggle("is-active", Number(el.dataset.x) === nearest);
  });
  root.querySelectorAll<HTMLInputElement>(".td-scrub").forEach((input) => {
    input.value = String(clampedX);
  });

  const readout = root.querySelector<HTMLElement>(".td-live-readout");
  if (readout) {
    readout.textContent = `x = ${formatNumber(clampedX)}, y = ${formatNumber(y)}, dy/dx = ${formatNumber(slope)}`;
  }

  const tangentPoint = root.querySelector<SVGCircleElement>(".td-tangent-point");
  const tangentLine = root.querySelector<SVGLineElement>(".td-tangent-line");
  const riseLine = root.querySelector<SVGLineElement>(".td-rise-line");
  const runLine = root.querySelector<SVGLineElement>(".td-run-line");
  const slopeNeedle = root.querySelector<SVGLineElement>(".td-slope-needle");
  const yDot = root.querySelector<SVGCircleElement>(".td-y-live-dot");
  const slopeDot = root.querySelector<SVGCircleElement>(".td-slope-live-dot");

  const px = scaleX(clampedX);
  const py = scaleY(y, yMax);
  const rise = slope * 34;

  tangentPoint?.setAttribute("cx", String(px));
  tangentPoint?.setAttribute("cy", String(py));
  tangentLine?.setAttribute("x1", String(px - 54));
  tangentLine?.setAttribute("y1", String(py + slope * 54));
  tangentLine?.setAttribute("x2", String(px + 54));
  tangentLine?.setAttribute("y2", String(py - slope * 54));
  riseLine?.setAttribute("x1", String(px + 34));
  riseLine?.setAttribute("x2", String(px + 34));
  riseLine?.setAttribute("y1", String(py));
  riseLine?.setAttribute("y2", String(py - rise));
  runLine?.setAttribute("x1", String(px));
  runLine?.setAttribute("x2", String(px + 34));
  runLine?.setAttribute("y1", String(py));
  runLine?.setAttribute("y2", String(py));
  slopeNeedle?.setAttribute("y2", String(158 - slope * 42));
  yDot?.setAttribute("cx", String(px));
  yDot?.setAttribute("cy", String(py));
  slopeDot?.setAttribute("cx", String(px));
  slopeDot?.setAttribute("cy", String(scaleY(slope, 2.5)));
}

function createGrid() {
  const grid = createSvgElement("g", { class: "td-grid" });

  for (let i = 0; i <= 5; i += 1) {
    const x = scaleX(i);
    grid.append(createSvgElement("line", { x1: String(x), x2: String(x), y1: "32", y2: "178" }));
  }

  for (let i = 0; i <= 4; i += 1) {
    const y = 40 + i * 34;
    grid.append(createSvgElement("line", { x1: "34", x2: "326", y1: String(y), y2: String(y) }));
  }

  return grid;
}

function buildMiniGraph(kind: "curve" | "slope") {
  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    "aria-hidden": "true",
  });
  const max = kind === "curve" ? POINTS[POINTS.length - 1].y : 2.5;
  const fn = kind === "curve" ? f : fp;

  svg.append(createGrid());
  svg.append(createSvgElement("path", {
    class: kind === "curve" ? "td-curve-path" : "td-slope-path",
    d: curvePath(max, fn),
  }));

  POINTS.forEach((point) => {
    svg.append(createSvgElement("circle", {
      class: "td-plot-dot",
      "data-x": String(point.x),
      cx: String(scaleX(point.x)),
      cy: String(scaleY(fn(point.x), max)),
      r: "4.5",
    }));
  });

  svg.append(createSvgElement("circle", {
    class: kind === "curve" ? "td-y-live-dot" : "td-slope-live-dot",
    cx: String(scaleX(2)),
    cy: String(scaleY(fn(2), max)),
    r: "7",
  }));

  return svg;
}

function buildTangentGraph() {
  const svg = createSvgElement("svg", {
    viewBox: `0 0 ${WIDTH} ${HEIGHT}`,
    "aria-label": "Curve with a tangent and rise over run marker",
    role: "img",
  });

  svg.append(createGrid());
  svg.append(createSvgElement("path", {
    class: "td-curve-path",
    d: curvePath(POINTS[POINTS.length - 1].y, f),
  }));
  svg.append(createSvgElement("line", { class: "td-tangent-line", x1: "0", y1: "0", x2: "0", y2: "0" }));
  svg.append(createSvgElement("line", { class: "td-run-line", x1: "0", y1: "0", x2: "0", y2: "0" }));
  svg.append(createSvgElement("line", { class: "td-rise-line", x1: "0", y1: "0", x2: "0", y2: "0" }));
  svg.append(createSvgElement("circle", { class: "td-tangent-point", cx: "0", cy: "0", r: "7" }));

  return svg;
}

function buildTableBridge(root: HTMLElement) {
  const table = `
    <table class="td-table">
      <thead>
        <tr>${POINTS.map((point) => `<th data-x="${point.x}">x = ${point.x}</th>`).join("")}</tr>
      </thead>
      <tbody>
        <tr>${POINTS.map((point) => `<td data-x="${point.x}">y ${formatNumber(point.y)}</td>`).join("")}</tr>
        <tr>${POINTS.map((point) => `<td data-x="${point.x}">dy/dx ${formatNumber(point.slope)}</td>`).join("")}</tr>
      </tbody>
    </table>
  `;

  root.querySelector(".td-table-slot")!.innerHTML = table;
  root.querySelector(".td-y-graph")!.append(buildMiniGraph("curve"));
  root.querySelector(".td-slope-graph")!.append(buildMiniGraph("slope"));
}

function buildTangentPrototype(root: HTMLElement) {
  root.querySelector(".td-tangent-graph")!.append(buildTangentGraph());
}

function buildSlopeCards(root: HTMLElement) {
  const cards = POINTS.map((point) => {
    const angle = Math.atan(point.slope) * (180 / Math.PI);
    return `
      <button class="td-card" type="button" data-x="${point.x}" aria-label="x ${point.x}, slope ${formatNumber(point.slope)}">
        <span>x = ${point.x}</span>
        <strong>${formatNumber(point.slope)}</strong>
        <i style="--angle: ${-angle}deg"></i>
      </button>
    `;
  }).join("");

  root.querySelector(".td-card-row")!.innerHTML = cards;
}

function attachEvents(root: HTMLElement) {
  root.querySelectorAll<HTMLElement>("[data-x]").forEach((el) => {
    const x = Number(el.dataset.x);
    el.addEventListener("pointerenter", () => setActiveX(root, x));
    el.addEventListener("focus", () => setActiveX(root, x));
    el.addEventListener("click", () => setActiveX(root, x));
  });

  root.querySelectorAll<HTMLInputElement>(".td-scrub").forEach((input) => {
    input.addEventListener("input", () => setActiveX(root, Number(input.value)));
  });
}

function buildApp(root: HTMLElement) {
  root.className = "td-root";
  root.innerHTML = `
    <main class="td-shell">
      <header class="td-header">
        <p>Three quieter drills for Thompson's example</p>
        <h1>y = 1/4x² + 3, so dy/dx = 1/2x</h1>
        <div class="td-live-readout" aria-live="polite"></div>
      </header>

      <section class="td-grid-layout">
        <article class="td-panel td-panel-wide">
          <div class="td-panel-copy">
            <span>Prototype 1</span>
            <h2>Same x, two heights</h2>
            <p data-td-hint="column">Hover a table column. The same x lights up on the y curve and on the derivative curve.</p>
          </div>
          <div class="td-table-slot"></div>
          <div class="td-two-graphs">
            <div>
              <h3>y against x</h3>
              <div class="td-y-graph"></div>
            </div>
            <div>
              <h3>dy/dx against x</h3>
              <div class="td-slope-graph"></div>
            </div>
          </div>
        </article>

        <article class="td-panel">
          <div class="td-panel-copy">
            <span>Prototype 2</span>
            <h2>Tangent ruler</h2>
            <p>Scrub x. The tangent steepens while the little rise/run marker reads the same slope.</p>
          </div>
          <input class="td-scrub" type="range" min="0" max="5" step="0.01" value="2" aria-label="Choose x value" />
          <div class="td-tangent-graph"></div>
        </article>

        <article class="td-panel">
          <div class="td-panel-copy">
            <span>Prototype 3</span>
            <h2>Slope cards</h2>
            <p data-td-hint="card">A fast drill: each x gets a number and a tiny line with that steepness. Hover any card.</p>
          </div>
          <div class="td-card-row"></div>
          <div class="td-needle-box" aria-hidden="true">
            <span>common slope meter</span>
            <svg viewBox="0 0 180 180">
              <line class="td-meter-axis" x1="28" y1="158" x2="154" y2="158" />
              <line class="td-slope-needle" x1="42" y1="158" x2="150" y2="74" />
            </svg>
          </div>
        </article>
      </section>
    </main>
  `;

  buildTableBridge(root);
  buildTangentPrototype(root);
  buildSlopeCards(root);
  attachEvents(root);
  setActiveX(root, 2);

  const columnHint = root.querySelector<HTMLElement>('[data-td-hint="column"]');
  const cardHint = root.querySelector<HTMLElement>('[data-td-hint="card"]');
  const syncHints = (): void => {
    const verb = hoverOrTapLabel();
    if (columnHint) {
      columnHint.textContent = `${verb} a table column. The same x lights up on the y curve and on the derivative curve.`;
    }
    if (cardHint) {
      cardHint.textContent = `A fast drill: each x gets a number and a tiny line with that steepness. ${verb} any card.`;
    }
  };
  syncHints();
  subscribeFineHover(syncHints);
}

const app = document.querySelector<HTMLElement>("#difference-app");
if (app) buildApp(app);
