import { eq } from "drizzle-orm";
import { getDb, users } from "@repo/db";

export interface StudyStatsDto {
  streak: number;
  bestStreak: number;
  dailyCorrect: number;
  dailyTotal: number;
  dailyGoalMinutes: number;
  lastStudyDate: string | null;
  dailyActivityDate: string | null;
  examDate: string | null;
}

type UserRow = typeof users.$inferSelect;

function yesterdayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function resetDailyIfNeeded(row: UserRow, activityDate: string): UserRow {
  if (row.studyDailyDate === activityDate) return row;
  return {
    ...row,
    studyDailyDate: activityDate,
    studyDailyCorrect: 0,
    studyDailyTotal: 0,
  };
}

function computeStreak(lastDate: string | null, currentStreak: number, activityDate: string): number {
  if (lastDate === activityDate) return currentStreak;
  if (lastDate === yesterdayOf(activityDate)) return currentStreak + 1;
  if (!lastDate) return 1;
  return 1;
}

function toDto(row: UserRow): StudyStatsDto {
  return {
    streak: row.studyStreak ?? 0,
    bestStreak: row.studyBestStreak ?? 0,
    dailyCorrect: row.studyDailyCorrect ?? 0,
    dailyTotal: row.studyDailyTotal ?? 0,
    dailyGoalMinutes: row.dailyGoalMinutes ?? 15,
    lastStudyDate: row.studyLastDate ?? null,
    dailyActivityDate: row.studyDailyDate ?? null,
    examDate: row.examTargetDate ?? null,
  };
}

async function getUserRow(userId: string): Promise<UserRow | null> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}

export async function getStudyStats(userId: string): Promise<StudyStatsDto | null> {
  const user = await getUserRow(userId);
  if (!user) return null;
  return toDto(user);
}

export async function recordStudyActivity(
  userId: string,
  opts: {
    activityDate: string;
    isCorrect: boolean;
    incrementTotal?: number;
    incrementCorrect?: number;
  },
): Promise<StudyStatsDto | null> {
  const user = await getUserRow(userId);
  if (!user) return null;

  const db = getDb();
  let row = resetDailyIfNeeded(user, opts.activityDate);
  const streak = computeStreak(row.studyLastDate, row.studyStreak ?? 0, opts.activityDate);
  const bestStreak = Math.max(row.studyBestStreak ?? 0, streak);

  const dailyTotal = (row.studyDailyTotal ?? 0) + (opts.incrementTotal ?? 1);
  let dailyCorrect = row.studyDailyCorrect ?? 0;
  if (opts.isCorrect) {
    dailyCorrect += opts.incrementCorrect ?? 1;
  }

  await db
    .update(users)
    .set({
      studyStreak: streak,
      studyBestStreak: bestStreak,
      studyLastDate: opts.activityDate,
      studyDailyCorrect: dailyCorrect,
      studyDailyTotal: dailyTotal,
      studyDailyDate: opts.activityDate,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return {
    streak,
    bestStreak,
    dailyCorrect,
    dailyTotal,
    dailyGoalMinutes: row.dailyGoalMinutes ?? 15,
    lastStudyDate: opts.activityDate,
    dailyActivityDate: opts.activityDate,
    examDate: row.examTargetDate ?? null,
  };
}

export async function mergeStudyStats(
  userId: string,
  local: StudyStatsDto & { activityDate: string },
): Promise<StudyStatsDto | null> {
  const user = await getUserRow(userId);
  if (!user) return null;

  const server = toDto(user);
  const db = getDb();

  let merged = { ...server };

  const serverDay = server.dailyActivityDate;
  const localDay = local.activityDate;

  if (!serverDay || localDay > serverDay) {
    merged = {
      ...local,
      bestStreak: Math.max(local.bestStreak, server.bestStreak),
      streak: local.streak,
    };
  } else if (localDay === serverDay) {
    merged = {
      ...server,
      dailyCorrect: Math.max(server.dailyCorrect, local.dailyCorrect),
      dailyTotal: Math.max(server.dailyTotal, local.dailyTotal),
      streak: Math.max(server.streak, local.streak),
      bestStreak: Math.max(server.bestStreak, local.bestStreak, server.streak, local.streak),
    };
  } else {
    merged = {
      ...server,
      bestStreak: Math.max(server.bestStreak, local.bestStreak),
    };
  }

  const examDate = local.examDate ?? server.examDate;
  const dailyGoalMinutes = local.dailyGoalMinutes || server.dailyGoalMinutes || 15;

  await db
    .update(users)
    .set({
      studyStreak: merged.streak,
      studyBestStreak: merged.bestStreak,
      studyLastDate: merged.lastStudyDate,
      studyDailyCorrect: merged.dailyCorrect,
      studyDailyTotal: merged.dailyTotal,
      studyDailyDate: merged.dailyActivityDate ?? localDay,
      dailyGoalMinutes,
      examTargetDate: examDate,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  return { ...merged, examDate, dailyGoalMinutes };
}

export async function updateStudyPreferences(
  userId: string,
  prefs: { dailyGoalMinutes?: number; examDate?: string | null },
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({
      ...(prefs.dailyGoalMinutes !== undefined ? { dailyGoalMinutes: prefs.dailyGoalMinutes } : {}),
      ...(prefs.examDate !== undefined ? { examTargetDate: prefs.examDate } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));
}
