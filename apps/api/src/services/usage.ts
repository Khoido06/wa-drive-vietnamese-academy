import { logger } from "../middleware/logger.js";

type DailyUsage = { tutor: number; practice: number; date: string };

const memory = new Map<string, DailyUsage>();

const FREE_TUTOR = Number(process.env.FREE_TUTOR_DAILY ?? 10);
const FREE_PRACTICE = Number(process.env.FREE_PRACTICE_DAILY ?? 20);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function usageKey(userId: string): string {
  return `${userId}:${todayKey()}`;
}

async function getUpstashUsage(userId: string): Promise<DailyUsage | null> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    const raw = await redis.get<DailyUsage>(`usage:${usageKey(userId)}`);
    return raw ?? null;
  } catch {
    return null;
  }
}

async function setUpstashUsage(userId: string, usage: DailyUsage): Promise<void> {
  if (!process.env.UPSTASH_REDIS_REST_URL) return;
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = Redis.fromEnv();
    await redis.set(`usage:${usageKey(userId)}`, usage, { ex: 86_400 });
  } catch (err) {
    logger.warn("usage cache write failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

async function getUsage(userId: string): Promise<DailyUsage> {
  const date = todayKey();
  const remote = await getUpstashUsage(userId);
  if (remote && remote.date === date) return remote;

  const local = memory.get(usageKey(userId));
  if (local && local.date === date) return local;

  const fresh = { tutor: 0, practice: 0, date };
  memory.set(usageKey(userId), fresh);
  return fresh;
}

async function saveUsage(userId: string, usage: DailyUsage): Promise<void> {
  memory.set(usageKey(userId), usage);
  await setUpstashUsage(userId, usage);
}

export async function checkAndIncrementUsage(
  userId: string,
  kind: "tutor" | "practice",
  isPremium: boolean,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  if (isPremium) {
    return { allowed: true, remaining: -1, limit: -1 };
  }

  const limit = kind === "tutor" ? FREE_TUTOR : FREE_PRACTICE;
  const usage = await getUsage(userId);
  const current = kind === "tutor" ? usage.tutor : usage.practice;

  if (current >= limit) {
    return { allowed: false, remaining: 0, limit };
  }

  if (kind === "tutor") usage.tutor += 1;
  else usage.practice += 1;

  await saveUsage(userId, usage);
  return { allowed: true, remaining: limit - current - 1, limit };
}

export async function getUsageStatus(userId: string, isPremium: boolean) {
  if (isPremium) {
    return {
      tutor: { used: 0, limit: -1, remaining: -1 },
      practice: { used: 0, limit: -1, remaining: -1 },
    };
  }
  const usage = await getUsage(userId);
  return {
    tutor: {
      used: usage.tutor,
      limit: FREE_TUTOR,
      remaining: Math.max(0, FREE_TUTOR - usage.tutor),
    },
    practice: {
      used: usage.practice,
      limit: FREE_PRACTICE,
      remaining: Math.max(0, FREE_PRACTICE - usage.practice),
    },
  };
}
