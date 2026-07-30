import type { PanelFigureKind } from "../content/panels";

export type PanelFigureGeom = {
  qx: number;
  qy: number;
  tx: number;
  ty: number;
};

export type PanelFigureGeomWithFrom = PanelFigureGeom & {
  txFrom: number;
  tyFrom: number;
};

type PointQEls = {
  pointQ: SVGCircleElement;
  labelQ: SVGTextElement;
  projX: SVGLineElement;
  projY: SVGLineElement;
  tickX: SVGTextElement;
  tickY: SVGTextElement;
};

type TangentEls = {
  tangent: SVGLineElement;
  pointQ: SVGCircleElement;
  labelQ: SVGTextElement;
};

type ManySlopesEls = {
  pointQ: SVGCircleElement;
  pointT: SVGCircleElement;
  labelQ: SVGTextElement;
  labelT: SVGTextElement;
  manyOverlays: [SVGLineElement, SVGLineElement, SVGLineElement];
  manyEndpoints: [SVGCircleElement, SVGCircleElement, SVGCircleElement];
  manyLabels: [SVGTextElement, SVGTextElement, SVGTextElement];
};

type LimitShrinkEls = {
  dx: SVGLineElement;
  dy: SVGLineElement;
  limit: SVGLineElement;
  produced: [SVGLineElement, SVGLineElement];
  pointQ: SVGCircleElement;
  pointT: SVGCircleElement;
  labelQ: SVGTextElement;
  labelT: SVGTextElement;
  labelDx0: SVGTextElement;
};

type ChordBaseEls = {
  dx: SVGLineElement;
  dy: SVGLineElement;
  labelDx: SVGTextElement;
  labelDy: SVGTextElement;
  pointQ: SVGCircleElement;
  pointT: SVGCircleElement;
  labelQ: SVGTextElement;
  labelT: SVGTextElement;
};

type ChordEls = ChordBaseEls & {
  secant: SVGLineElement;
  labelSecant: SVGTextElement | null;
  projX: SVGLineElement | null;
  projY: SVGLineElement | null;
  tickX: SVGTextElement | null;
  tickY: SVGTextElement | null;
};

type ShrinkChordEls = ChordBaseEls & {
  secant: SVGLineElement;
  highlightBox: SVGRectElement;
};

type DyDxMergeEls = ChordBaseEls & {
  secant: SVGLineElement;
  fractionBar: SVGLineElement;
};

type ProducedEls = ChordBaseEls & {
  produced: [SVGLineElement, SVGLineElement];
};

type MountBase<K extends PanelFigureKind, Els, Geom> = {
  kind: K;
  svg: SVGSVGElement;
  els: Els;
  geom: Geom;
};

export type MountFor = {
  pointQ: MountBase<"pointQ", PointQEls, PanelFigureGeom>;
  tangent: MountBase<"tangent", TangentEls, PanelFigureGeom>;
  manySlopes: MountBase<"manySlopes", ManySlopesEls, PanelFigureGeom>;
  limitShrink: MountBase<"limitShrink", LimitShrinkEls, PanelFigureGeomWithFrom>;
  chord: MountBase<"chord", ChordEls, PanelFigureGeom>;
  shrinkChord: MountBase<"shrinkChord", ShrinkChordEls, PanelFigureGeomWithFrom>;
  dyDxMerge: MountBase<"dyDxMerge", DyDxMergeEls, PanelFigureGeom>;
  produced: MountBase<"produced", ProducedEls, PanelFigureGeom>;
};

export type PanelFigureMount = MountFor[PanelFigureKind];
