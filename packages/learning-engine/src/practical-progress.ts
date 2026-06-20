import { eq } from "drizzle-orm";
import { getDb, users } from "@repo/db";

export interface PracticalProgressDto {
  maneuvers: Record<
    string,
    { stepsRead: number; quizPassed: boolean; practicedInCar: boolean }
  >;
  vehicleChecklist: Record<string, boolean>;
  dayOfTestChecklist: Record<string, boolean>;
  updatedAt: string;
}

const EMPTY: PracticalProgressDto = {
  maneuvers: {},
  vehicleChecklist: {},
  dayOfTestChecklist: {},
  updatedAt: new Date().toISOString(),
};

export async function getPracticalProgress(userId: string): Promise<PracticalProgressDto | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;
  const raw = user.practicalProgress as PracticalProgressDto | null;
  return raw ?? { ...EMPTY };
}

export async function mergePracticalProgress(
  userId: string,
  local: PracticalProgressDto,
): Promise<PracticalProgressDto | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const server = (user.practicalProgress as PracticalProgressDto | null) ?? { ...EMPTY };
  const merged: PracticalProgressDto = {
    maneuvers: { ...server.maneuvers },
    vehicleChecklist: { ...server.vehicleChecklist, ...local.vehicleChecklist },
    dayOfTestChecklist: { ...server.dayOfTestChecklist, ...local.dayOfTestChecklist },
    updatedAt: new Date().toISOString(),
  };

  for (const [id, localM] of Object.entries(local.maneuvers)) {
    const srv = server.maneuvers[id];
    merged.maneuvers[id] = {
      stepsRead: Math.max(srv?.stepsRead ?? 0, localM.stepsRead),
      quizPassed: (srv?.quizPassed ?? false) || localM.quizPassed,
      practicedInCar: (srv?.practicedInCar ?? false) || localM.practicedInCar,
    };
  }

  await db
    .update(users)
    .set({ practicalProgress: merged as unknown as Record<string, unknown>, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return merged;
}
