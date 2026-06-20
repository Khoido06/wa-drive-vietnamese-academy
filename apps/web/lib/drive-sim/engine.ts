/** Lightweight 2D car physics for driving practice simulator. */

export interface CarState {
  x: number;
  y: number;
  angle: number;
  speed: number;
  steer: number;
}

export interface SimInputs {
  throttle: number;
  brake: number;
  steer: number;
  reverse: boolean;
}

export const CAR_LENGTH = 44;
export const CAR_WIDTH = 22;

export function createCar(x: number, y: number, angle = 0): CarState {
  return { x, y, angle, speed: 0, steer: 0 };
}

export function updateCar(car: CarState, inputs: SimInputs, dt = 1): void {
  const { throttle, brake, steer, reverse } = inputs;
  car.steer = steer;

  const dir = reverse ? -1 : 1;
  if (throttle > 0) {
    car.speed += 0.12 * throttle * dir * dt;
  }
  if (brake > 0) {
    car.speed *= 1 - 0.18 * brake * dt;
    if (Math.abs(car.speed) < 0.15) car.speed = 0;
  }
  car.speed *= 0.985;

  const maxFwd = 4.2;
  const maxRev = 2.4;
  car.speed = Math.max(-maxRev, Math.min(maxFwd, car.speed));

  if (Math.abs(car.speed) > 0.08) {
    const turnRate = 0.038 * steer * dt;
    car.angle += turnRate * (car.speed > 0 ? 1 : -1);
  }

  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
}

/** Car corner points in world space (for collision). */
export function carCorners(car: CarState): Array<{ x: number; y: number }> {
  const hw = CAR_LENGTH / 2;
  const hh = CAR_WIDTH / 2;
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const local = [
    { x: hw, y: hh },
    { x: hw, y: -hh },
    { x: -hw, y: -hh },
    { x: -hw, y: hh },
  ];
  return local.map((p) => ({
    x: car.x + p.x * cos - p.y * sin,
    y: car.y + p.x * sin + p.y * cos,
  }));
}

/** Distance from car's right side to vertical curb at curbX. */
export function distanceToCurb(car: CarState, curbX: number): number {
  const corners = carCorners(car);
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const rightMid = {
    x: car.x + sin * (CAR_WIDTH / 2),
    y: car.y - cos * (CAR_WIDTH / 2),
  };
  return Math.abs(curbX - rightMid.x);
}

export function carAngleDegrees(car: CarState): number {
  const deg = (car.angle * 180) / Math.PI;
  return ((deg % 360) + 360) % 360;
}

/** How parallel car is to horizontal road (0° = perfect). */
export function parallelErrorDeg(car: CarState): number {
  const deg = carAngleDegrees(car);
  const err = Math.min(Math.abs(deg), Math.abs(deg - 180), Math.abs(deg - 360));
  return err > 90 ? 180 - err : err;
}

export function clampCarToBounds(car: CarState, minX: number, minY: number, maxX: number, maxY: number): void {
  car.x = Math.max(minX + CAR_LENGTH, Math.min(maxX - CAR_LENGTH, car.x));
  car.y = Math.max(minY + CAR_WIDTH, Math.min(maxY - CAR_WIDTH, car.y));
}

export function pointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}
