import "katex/dist/katex.min.css";
import "./shape-gallery.css";
import {
  SHAPES,
  clampToDomain,
  getShape,
  midDomain,
  plotX,
  type ShapeDef,
  type ShapeId,
} from "../../shapes/defs";
import { createStage, createThumbnail } from "./renderStage";
import { attachHoverGuide } from "../../ui/hoverGuide";
import { renderMathIn } from "../../ui/renderMath";

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "∞";
  if (Math.abs(value) < 1e-10) return "0";
  if (Number.isInteger(value)) return String(value);
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}

function signState(
  shape: ShapeDef,
  fp: number,
): { sign: "neg" | "zero" | "pos" | "inf"; label: string } {
  if (shape.infinityThreshold !== undefined && Math.abs(fp) >= shape.infinityThreshold) {
    return { sign: "inf", label: "dy/dx → ∞" };
  }
  if (!Number.isFinite(fp)) {
    return { sign: "inf", label: "dy/dx → ∞" };
  }
  if (Math.abs(fp) < 0.04) {
    return { sign: "zero", label: "dy/dx ≈ 0" };
  }
  if (fp < 0) {
    return { sign: "neg", label: "dy/dx < 0" };
  }
  return { sign: "pos", label: "dy/dx > 0" };
}

function buildApp(root: HTMLElement) {
  root.className = "sg-root";

  let activeId: ShapeId = "constant";
  let t = midDomain(getShape(activeId));

  const stage = createStage();

  root.innerHTML = `
    <header class="sg-header">
      <h1 class="sg-title">How slope changes along a curve</h1>
      <p class="sg-sub">From Silvanus P. Thompson, <cite>Calculus Made Easy</cite> — Chapter X, Figures 12–18.</p>
    </header>
    <p class="sg-intro">
      Pick a shape, then scrub along it. The red line is the tangent; its steepness is
      <span class="math">\\dfrac{dy}{dx}</span> at that point.
    </p>
    <div class="sg-thumbs" role="toolbar" aria-label="Curve shapes Figures 12 to 18"></div>
    <div class="sg-main-row">
      <div class="sg-caption" id="sg-caption" aria-live="polite"></div>
      <div class="sg-figure-wrap" id="sg-figure-wrap"></div>
    </div>
    <div class="sg-controls">
      <label class="sg-scrub-label">
        <span id="sg-scrub-name">Position along curve</span>
        <input class="sg-scrub" id="sg-scrub" type="range" min="0" max="1" step="any" />
      </label>
      <div class="sg-readout" aria-live="polite">
        <span class="sg-readout-values" id="sg-readout-values">
          x = <span id="sg-rv-x"></span>, y = <span id="sg-rv-y"></span>,
          <span class="math">\\dfrac{dy}{dx}</span> = <span id="sg-rv-slope"></span>
        </span>
        <span class="sg-sign-chip" id="sg-sign-chip" data-sign="pos"></span>
      </div>
    </div>
    <footer class="sg-footer">
      <p>
        Source:
        <a href="https://calculusmadeeasy.org/10.html" rel="noopener noreferrer">calculusmadeeasy.org/10.html</a>
        · <a href="../index.html">Chapter comic</a>
        · <a href="./slope-morph.html">Slope morph</a>
      </p>
    </footer>
  `;

  const thumbs = root.querySelector<HTMLElement>(".sg-thumbs")!;
  const caption = root.querySelector<HTMLElement>("#sg-caption")!;
  const figureWrap = root.querySelector<HTMLElement>("#sg-figure-wrap")!;
  const scrub = root.querySelector<HTMLInputElement>("#sg-scrub")!;
  const scrubName = root.querySelector<HTMLElement>("#sg-scrub-name")!;
  const readoutValues = root.querySelector<HTMLElement>("#sg-readout-values")!;
  const rvX = root.querySelector<HTMLElement>("#sg-rv-x")!;
  const rvY = root.querySelector<HTMLElement>("#sg-rv-y")!;
  const rvSlope = root.querySelector<HTMLElement>("#sg-rv-slope")!;
  const signChip = root.querySelector<HTMLElement>("#sg-sign-chip")!;

  figureWrap.appendChild(stage.svg);
  attachHoverGuide(figureWrap, "drag");
  renderMathIn(readoutValues);

  for (const shape of SHAPES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sg-thumb";
    btn.dataset.shapeId = shape.id;
    btn.setAttribute("aria-pressed", shape.id === activeId ? "true" : "false");
    btn.setAttribute("aria-label", `${shape.figLabel}: select this curve shape`);
    const label = document.createElement("span");
    label.className = "sg-thumb-label";
    label.textContent = shape.figLabel;
    btn.append(createThumbnail(shape), label);
    btn.addEventListener("click", () => selectShape(shape.id));
    thumbs.appendChild(btn);
  }

  function syncScrubInput(shape: ShapeDef) {
    scrub.min = String(shape.domain.min);
    scrub.max = String(shape.domain.max);
    scrub.step = "any";
    scrub.value = String(t);
    scrubName.textContent = shape.xOf
      ? "Arc position (top → nose → bottom)"
      : "Position along curve (x)";
  }

  function updateReadout(shape: ShapeDef) {
    const x = plotX(shape, t);
    const y = shape.f(t);
    const fp = shape.fp(t);
    const sign = signState(shape, fp);

    rvX.textContent = formatNumber(shape.xOf ? x : t);
    rvY.textContent = formatNumber(y);
    rvSlope.textContent = sign.sign === "inf" ? "∞" : formatNumber(fp);

    signChip.dataset.sign = sign.sign;
    signChip.textContent = sign.label;
  }

  function refresh() {
    const shape = getShape(activeId);
    t = clampToDomain(shape, t);
    stage.update(shape, t);
    scrub.value = String(t);
    updateReadout(shape);
  }

  function selectShape(id: ShapeId) {
    const prev = getShape(activeId);
    const prevSpan = prev.domain.max - prev.domain.min || 1;
    const frac = (t - prev.domain.min) / prevSpan;
    activeId = id;
    const shape = getShape(id);
    t = clampToDomain(
      shape,
      shape.domain.min + frac * (shape.domain.max - shape.domain.min),
    );

    thumbs.querySelectorAll<HTMLButtonElement>(".sg-thumb").forEach((btn) => {
      btn.setAttribute("aria-pressed", btn.dataset.shapeId === id ? "true" : "false");
    });

    caption.innerHTML = `<p>${shape.captionHtml}</p>`;
    renderMathIn(caption);
    syncScrubInput(shape);
    refresh();
  }

  scrub.addEventListener("input", () => {
    t = clampToDomain(getShape(activeId), Number(scrub.value));
    refresh();
  });

  let dragging = false;

  function onPointer(clientX: number) {
    const shape = getShape(activeId);
    t = clampToDomain(shape, stage.clientXToT(shape, clientX));
    refresh();
  }

  figureWrap.addEventListener("pointerdown", (e) => {
    dragging = true;
    figureWrap.setPointerCapture(e.pointerId);
    onPointer(e.clientX);
  });
  figureWrap.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    onPointer(e.clientX);
  });
  figureWrap.addEventListener("pointerup", () => {
    dragging = false;
  });
  figureWrap.addEventListener("pointercancel", () => {
    dragging = false;
  });

  renderMathIn(root.querySelector(".sg-intro")!);
  selectShape(activeId);
}

const mount = document.querySelector<HTMLElement>("#shape-gallery-app");
if (mount) buildApp(mount);
