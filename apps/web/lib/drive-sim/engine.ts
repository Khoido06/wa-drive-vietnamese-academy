/** Realistic-ish arcade car physics (bicycle model). */

export interface CarState {
  x: number;
  y: number;
  angle: number;
  speed: number;
  steer: number;
  /** Smoothed steering wheel position -1..1 */
  steerAngle: number;
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
  return { x, y, angle, speed: 0, steer: 0, steerAngle: 0 };
}

export function updateCar(car: CarState, inputs: SimInputs, dt = 1): void {
  const { throttle, brake, steer, reverse } = inputs;

  car.steerAngle += (steer - car.steerAngle) * 0.14 * dt;
  car.steer = car.steerAngle;

  const dir = reverse ? -1 : 1;
  const speedAbs = Math.abs(car.speed);

  if (throttle > 0) {
    const accel = (0.09 + (1 - speedAbs / 5) * 0.06) * throttle * dir;
    car.speed += accel * dt;
  }

  if (brake > 0) {
    const decel = 0.22 * brake * dt;
    if (speedAbs <= decel) {
      car.speed = 0;
    } else {
      car.speed -= Math.sign(car.speed) * decel;
    }
  }

  car.speed *= 0.992;

  const maxFwd = 4.8;
  const maxRev = 2.6;
  car.speed = Math.max(-maxRev, Math.min(maxFwd, car.speed));

  if (Math.abs(car.speed) > 0.05) {
    const speedFactor = 1 / (1 + speedAbs * 0.22);
    const turnRate = car.steerAngle * 0.045 * speedFactor * dt;
    car.angle += turnRate * (car.speed > 0 ? 1 : -1);
  }

  car.x += Math.cos(car.angle) * car.speed * dt;
  car.y += Math.sin(car.angle) * car.speed * dt;
}

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

export function distanceToCurb(car: CarState, curbX: number): number {
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

/** World position of mirror anchor for 3D cameras. */
export function mirrorAnchor(
  car: CarState,
  side: "rear" | "left" | "right",
): { x: number; y: number; angle: number } {
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const lx = side === "rear" ? -1.2 : side === "left" ? 0.3 : 0.3;
  const ly = side === "rear" ? 0 : side === "left" ? 0.9 : -0.9;
  return {
    x: car.x + lx * cos - ly * sin,
    y: car.y + lx * sin + ly * cos,
    angle: car.angle + (side === "left" ? 0.55 : side === "right" ? -0.55 : Math.PI),
  };
}
