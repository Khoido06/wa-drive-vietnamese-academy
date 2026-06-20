/** Convert 2D sim coordinates (pixels) to Three.js world units. */

export const SIM_SCALE = 0.055;

export function simToWorldX(x: number): number {
  return (x - 400) * SIM_SCALE;
}

export function simToWorldZ(y: number): number {
  return (y - 300) * SIM_SCALE;
}

export function simToWorldAngle(angle: number): number {
  return -angle + Math.PI / 2;
}

export function worldToSimX(wx: number): number {
  return wx / SIM_SCALE + 400;
}

export function worldToSimZ(wz: number): number {
  return wz / SIM_SCALE + 300;
}
