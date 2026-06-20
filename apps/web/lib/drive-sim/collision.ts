import { CAR_LENGTH, CAR_WIDTH, distanceToCurb, type CarState } from "./engine";
import type { AiVehicle } from "./traffic";

export type CollisionKind = "vehicle" | "curb" | "none";

export interface CollisionHit {
  kind: CollisionKind;
  message: string;
}

const HIT_COOLDOWN_MS = 1200;

export function detectCollision(
  player: CarState,
  traffic: AiVehicle[],
  curbX: number | undefined,
  lastHitAt: number,
): CollisionHit | null {
  const now = Date.now();
  if (now - lastHitAt < HIT_COOLDOWN_MS) return null;

  if (curbX !== undefined && Math.abs(player.speed) > 0.35) {
    const curbDist = distanceToCurb(player, curbX);
    if (curbDist < 6) {
      return { kind: "curb", message: "💥 Cọ lề! Giảm tốc và giữ cách lề." };
    }
  }

  for (const v of traffic) {
    const dx = player.x - v.x;
    const dy = player.y - v.y;
    const dist = Math.hypot(dx, dy);
    if (dist < CAR_LENGTH * 0.75 && Math.abs(player.speed) > 0.2) {
      const label = v.label ?? "xe khác";
      return { kind: "vehicle", message: `💥 Va chạm ${label}! Phanh và kiểm tra gương.` };
    }
  }

  if (player.x < 30 || player.x > 770 || player.y < 30 || player.y > 570) {
    return { kind: "curb", message: "💥 Ra khỏi đường! Quay lại làn an toàn." };
  }

  return null;
}

export function applyCollisionResponse(player: CarState, kind: CollisionKind): void {
  player.speed *= kind === "vehicle" ? 0.15 : 0.35;
  if (Math.abs(player.speed) < 0.25) player.speed = 0;
}
