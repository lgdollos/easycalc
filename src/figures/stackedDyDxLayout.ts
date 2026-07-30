/** Layout for stacked dy / dx labels along a QT chord. */
export function stackedDyDxLayout(
  Qx: number,
  Qy: number,
  Tx: number,
  Ty: number,
): {
  cx: number;
  cy: number;
  dyY: number;
  dxY: number;
  barY: number;
  barHalf: number;
} {
  const mx = (Qx + Tx) / 2;
  const my = (Qy + Ty) / 2;
  const vx = Tx - Qx;
  const vy = Ty - Qy;
  const len = Math.hypot(vx, vy) || 1;
  const ux = vx / len;
  const uy = vy / len;
  let nx = -vy / len;
  let ny = vx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  const offN = 26;
  const offT = 1;
  const cx0 = mx + nx * offN - ux * offT;
  const cy0 = my + ny * offN - uy * offT;
  const cx = cx0 - 5;
  const cy = cy0 - 5;
  const dyY = cy - 15;
  const dxY = cy + 16;
  const barY = (dyY + dxY) / 2 - 5.5;
  const barHalf = 15;
  return { cx, cy, dyY, dxY, barY, barHalf };
}
