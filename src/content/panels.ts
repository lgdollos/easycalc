import { qXForChordCenteredInViewport } from "../figures/coords";

export type PanelFigureKind =
  | "pointQ"
  | "chord"
  | "manySlopes"
  | "shrinkChord"
  | "dyDxMerge"
  | "produced"
  | "limitShrink"
  | "tangent";

const DELTA_LARGE = 1.35;
const DELTA_MEDIUM = 0.24;
const DELTA_SMALL = 0.14;
const Q_TANGENT_X = 2.52;

export type PanelFigureSpec = {
  kind: PanelFigureKind;
  deltaX?: number;
  shrinkFromDeltaX?: number;
  qMathX?: number;
  secantLabel?: boolean;
  showQAxisProjectionGuides?: boolean;
  showQAxisProjectionLabels?: boolean;
};

export type PanelEntry = {
  id: number;
  title: string;
  /** HTML; use <span class="math">LaTeX</span> for KaTeX */
  bodyHtml: string;
  figure: PanelFigureSpec;
};

export const PANELS: PanelEntry[] = [
  {
    id: 1,
    title: "Point Q",
    bodyHtml: `<p>Let <span class="math">\\text{PQR}</span> be a portion of a curve plotted with respect to the axes of coordinates <span class="math">\\text{OX}</span> and <span class="math">\\text{OY}</span>. Consider any point <span class="math math-fig-q">Q</span> on this curve, where the abscissa of the point is <span class="math math-fig-proj-x">x</span> and its ordinate is <span class="math math-fig-proj-y">y</span>.</p>`,
    figure: { kind: "pointQ" },
  },
  {
    id: 2,
    title: "dx, dy",
    bodyHtml: `<p>If <span class="math">x</span> is made to increase by a small increment <span class="math math-fig-dx">dx</span>, to the right, it will be observed that <span class="math">y</span> also (in <em>this</em> particular curve) increases by a small increment <span class="math math-fig-dy">dy</span>—because this curve happens to be an <em>ascending</em> curve.</p>`,
    figure: {
      kind: "chord",
      deltaX: DELTA_LARGE,
      secantLabel: false,
      showQAxisProjectionGuides: true,
      showQAxisProjectionLabels: true,
    },
  },
  {
    id: 3,
    title: "Many slopes",
    bodyHtml: `<p>The curve between <span class="math">Q</span> and <span class="math">T</span> has many different <span class="panel-fig-kw panel-fig-kw-slopes" tabindex="0">slopes</span>, so that we cannot very well speak of <em>the</em> slope of the curve between <span class="math">Q</span> and <span class="math">T</span>.</p>`,
    figure: { kind: "manySlopes", deltaX: DELTA_LARGE },
  },
  {
    id: 4,
    title: "Shrink QT",
    bodyHtml: `<p>If, however, <span class="math">Q</span> and <span class="math">T</span> are so near each other that the <span class="panel-fig-kw panel-fig-kw-straight" tabindex="0">small portion <span class="math">QT</span></span> of the curve is <em>practically straight</em>, then it is true to say that the ratio <span class="math">\\dfrac{dy}{dx}</span> is the slope of the curve along <span class="math">QT</span>.</p>`,
    figure: { kind: "shrinkChord", deltaX: 0.48, shrinkFromDeltaX: DELTA_LARGE },
  },
  {
    id: 5,
    title: "dy/dx along QT",
    bodyHtml: `<p>For this tiny, nearly straight piece, <span class="panel-fig-kw panel-fig-kw-dydx" tabindex="0"><span class="math">\\dfrac{dy}{dx}</span></span> measures how steeply the curve rises along <span class="math">QT</span>.</p>`,
    figure: {
      kind: "dyDxMerge",
      deltaX: DELTA_MEDIUM,
      qMathX: qXForChordCenteredInViewport(DELTA_MEDIUM),
    },
  },
  {
    id: 6,
    title: "Produced",
    bodyHtml: `<p>The <span class="panel-fig-kw panel-fig-kw-line-qt" tabindex="0">straight line <span class="math">QT</span></span> <em>produced</em> on either side touches the curve along the portion <span class="math">QT</span> only.</p>`,
    figure: {
      kind: "produced",
      deltaX: DELTA_SMALL,
      qMathX: qXForChordCenteredInViewport(DELTA_SMALL),
    },
  },
  {
    id: 7,
    title: "dx → 0",
    bodyHtml: `<p>If this portion is indefinitely small, the straight line will <span class="panel-fig-kw panel-fig-kw-touch" tabindex="0">touch</span> the curve at practically <em>one point</em> only, and be therefore a <em>tangent</em> to the curve.</p>`,
    figure: {
      kind: "limitShrink",
      deltaX: 0.035,
      shrinkFromDeltaX: DELTA_SMALL,
      qMathX: qXForChordCenteredInViewport(DELTA_SMALL),
    },
  },
  {
    id: 8,
    title: "Tangent",
    bodyHtml: `<p>This tangent has evidently the same slope as <span class="math">QT</span>, so that <span class="math">\\dfrac{dy}{dx}</span> is the <span class="panel-fig-kw panel-fig-kw-slope-tangent" tabindex="0">slope of the tangent</span> to the curve at the point <span class="math">Q</span> for which the value of <span class="math">\\dfrac{dy}{dx}</span> is found.</p>`,
    figure: { kind: "tangent", qMathX: Q_TANGENT_X },
  },
];
