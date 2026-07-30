/** Thompson Ch. X ex. (3): y = (1/4)x² + 3, dy/dx = (1/2)x */

import { f as yOf, fp as dOf } from "../figures/coords";

export { yOf, dOf };

export type TablePoint = {
  x: number;
  yLabel: string;
  dLabel: string;
};

export const POINTS: TablePoint[] = [
  { x: 0, yLabel: "3", dLabel: "0" },
  { x: 1, yLabel: "3\\tfrac{1}{4}", dLabel: "\\tfrac{1}{2}" },
  { x: 2, yLabel: "4", dLabel: "1" },
  { x: 3, yLabel: "5\\tfrac{1}{4}", dLabel: "1\\tfrac{1}{2}" },
  { x: 4, yLabel: "7", dLabel: "2" },
  { x: 5, yLabel: "9\\tfrac{1}{4}", dLabel: "2\\tfrac{1}{2}" },
];

export function dTipFor(p: TablePoint): string {
  return `= \\tfrac{1}{2}(${p.x}) = ${p.dLabel}`;
}
