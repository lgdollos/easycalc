import {
  mathToSvg,
  FIG_WIDTH,
  PADDING,
  PROJECTION_GUIDE_DASH,
  SECANT_DASH,
} from "../figures/coords";
import {
  INK,
  setAttrs,
  lineEl,
  textEl,
  drawAxes,
} from "../figures/svgHelpers";
import { DX_MATH, morphCurvePath, morphScales, X_Q, Y_Q, yOnMorphCurve } from "./curveParam";

/** Extra viewBox height beyond FIG_HEIGHT to fit the X axis label. */
const VIEWBOX_H = 300;

export type MorphFigureApi = {
  svg: SVGSVGElement;
  setT: (t: number) => void;
};

export function createMorphFigure(): MorphFigureApi {
  const scales = morphScales;
  const bottomAxis = PADDING.top + scales.innerH;

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  setAttrs(svg, {
    viewBox: `0 0 ${FIG_WIDTH} ${VIEWBOX_H}`,
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMidYMid meet",
    role: "img",
    "aria-label":
      "Graph with dx and dy right-triangle construction morphing from a steep parabola through a steeper straight segment, gentle curve, flat tangent, and downward slope",
  });
  svg.setAttribute("class", "sm-figure-svg");

  const root = document.createElementNS("http://www.w3.org/2000/svg", "g");
  root.setAttribute("class", "sm-fig-root");
  svg.append(root);

  drawAxes(root, scales, "sm", { showOrigin: true });

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("fill", "none");
  path.setAttribute("stroke", INK);
  path.setAttribute("stroke-width", "1.55");
  path.setAttribute("class", "sm-curve");
  root.append(path);

  const dropQh = lineEl(0, 0, 0, 0, INK, { strokeWidth: 1, class: "sm-dx" });
  const dropQv = lineEl(0, 0, 0, 0, INK, { strokeWidth: 1, class: "sm-dy" });
  const secant = lineEl(0, 0, 0, 0, INK, {
    strokeWidth: 1,
    dash: SECANT_DASH,
    class: "sm-secant",
  });
  const dropAxisL = lineEl(0, 0, 0, 0, INK, {
    strokeWidth: 1,
    dash: PROJECTION_GUIDE_DASH,
    class: "sm-drop-axis-l",
  });
  const dropAxisR = lineEl(0, 0, 0, 0, INK, {
    strokeWidth: 1,
    dash: PROJECTION_GUIDE_DASH,
    class: "sm-drop-axis-r",
  });
  root.append(dropQh, dropQv, secant, dropAxisL, dropAxisR);

  const dxLbl = textEl(0, 0, "dx", INK, 13);
  dxLbl.setAttribute("text-anchor", "middle");
  dxLbl.setAttribute("class", "sm-lbl-dx");
  const dyLbl = textEl(0, 0, "dy", INK, 13);
  dyLbl.setAttribute("text-anchor", "middle");
  dyLbl.setAttribute("class", "sm-lbl-dy");
  root.append(dxLbl, dyLbl);

  const [Qx, Qy] = mathToSvg(scales, X_Q, Y_Q);
  const xT = X_Q + DX_MATH;
  const Tx = scales.x(xT);

  let lastT = NaN;
  function setT(t: number) {
    if (t === lastT) return;
    lastT = t;

    path.setAttribute("d", morphCurvePath(t));

    const yT = yOnMorphCurve(xT, t);
    const Ty = scales.y(yT);

    setAttrs(dropQh, { x1: Qx, y1: Qy, x2: Tx, y2: Qy });
    setAttrs(dropQv, { x1: Tx, y1: Qy, x2: Tx, y2: Ty });
    setAttrs(secant, { x1: Qx, y1: Qy, x2: Tx, y2: Ty });
    setAttrs(dropAxisL, { x1: Qx, y1: Qy, x2: Qx, y2: bottomAxis });
    setAttrs(dropAxisR, { x1: Tx, y1: Qy, x2: Tx, y2: bottomAxis });

    const dxMidX = (Qx + Tx) / 2;
    const dxAbove = Ty > Qy;
    setAttrs(dxLbl, { x: dxMidX, y: dxAbove ? Qy - 8 : Qy + 21 });
    const dyMidY = (Qy + Ty) / 2;
    setAttrs(dyLbl, { x: Tx + 17, y: dyMidY + 4 });
  }

  setT(0);

  return { svg, setT };
}
