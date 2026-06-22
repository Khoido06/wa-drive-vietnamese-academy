/** SM-2 inspired spaced repetition */
export interface ReviewResult {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: Date;
  masteryLevel: number;
}

/** Postgres timestamptz safe horizon — SM-2 intervals must not explode. */
export const MAX_INTERVAL_DAYS = 365;
export const MAX_EASE_FACTOR = 2.5;
export const MIN_EASE_FACTOR = 1.3;

function clampIntervalDays(days: number): number {
  if (!Number.isFinite(days) || days < 1) return 1;
  return Math.min(MAX_INTERVAL_DAYS, Math.round(days));
}

function clampEaseFactor(factor: number): number {
  if (!Number.isFinite(factor)) return MAX_EASE_FACTOR;
  return Math.min(MAX_EASE_FACTOR, Math.max(MIN_EASE_FACTOR, factor));
}

export function computeNextReviewAt(intervalDays: number, from = new Date()): Date {
  const next = new Date(from);
  next.setUTCDate(next.getUTCDate() + clampIntervalDays(intervalDays));
  return next;
}

export function updateSpacedRepetition(
  current: {
    easeFactor: number;
    intervalDays: number;
    repetitions: number;
    totalAttempts: number;
    correctAttempts: number;
  },
  quality: number,
): ReviewResult {
  // quality: 0-5 (0=complete blackout, 5=perfect)
  let easeFactor = clampEaseFactor(current.easeFactor);
  let intervalDays = clampIntervalDays(current.intervalDays);
  let { repetitions } = current;

  if (quality < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    if (repetitions === 0) {
      intervalDays = 1;
    } else if (repetitions === 1) {
      intervalDays = 3;
    } else {
      intervalDays = clampIntervalDays(intervalDays * easeFactor);
    }
    repetitions++;
  }

  easeFactor = clampEaseFactor(
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)),
  );

  const nextReviewAt = computeNextReviewAt(intervalDays);

  const masteryLevel = Math.min(
    1,
    (current.correctAttempts + (quality >= 3 ? 1 : 0)) /
      Math.max(current.totalAttempts + 1, 1),
  );

  return { easeFactor, intervalDays, repetitions, nextReviewAt, masteryLevel };
}

/** Elo-style difficulty adjustment */
export function updateDifficulty(
  currentDifficulty: number,
  isCorrect: boolean,
  responseTimeMs: number,
): number {
  const expectedTime = 15000;
  const timeFactor = Math.min(responseTimeMs / expectedTime, 3);
  const delta = isCorrect ? -0.05 * timeFactor : 0.08;
  return Math.max(0.1, Math.min(0.95, currentDifficulty + delta));
}

export function qualityFromAttempt(
  isCorrect: boolean,
  responseTimeMs: number,
): number {
  if (!isCorrect) return 1;
  if (responseTimeMs < 5000) return 5;
  if (responseTimeMs < 10000) return 4;
  if (responseTimeMs < 20000) return 3;
  return 3;
}

export const WA_DRIVER_TOPICS = [
  "traffic_signs",
  "right_of_way",
  "speed_limits",
  "parking",
  "lane_changes",
  "intersections",
  "pedestrians",
  "school_zones",
  "highway_driving",
  "night_driving",
  "weather_conditions",
  "emergency_vehicles",
  "dui_laws",
  "seat_belts",
  "sharing_the_road",
] as const;

export type WaDriverTopic = (typeof WA_DRIVER_TOPICS)[number];

export interface FailureCluster {
  topic: string;
  failureRate: number;
  attemptCount: number;
  avgResponseTimeMs: number;
}

export function detectFailureClusters(
  attempts: Array<{
    topic: string;
    isCorrect: boolean;
    responseTimeMs: number;
  }>,
  threshold = 0.4,
): FailureCluster[] {
  const byTopic = new Map<
    string,
    { total: number; failures: number; totalTime: number }
  >();

  for (const a of attempts) {
    const entry = byTopic.get(a.topic) ?? { total: 0, failures: 0, totalTime: 0 };
    entry.total++;
    if (!a.isCorrect) entry.failures++;
    entry.totalTime += a.responseTimeMs;
    byTopic.set(a.topic, entry);
  }

  return [...byTopic.entries()]
    .map(([topic, stats]) => ({
      topic,
      failureRate: stats.failures / stats.total,
      attemptCount: stats.total,
      avgResponseTimeMs: stats.totalTime / stats.total,
    }))
    .filter((c) => c.failureRate >= threshold && c.attemptCount >= 3)
    .sort((a, b) => b.failureRate - a.failureRate);
}

export function reorderCurriculum(
  topics: readonly string[],
  failureClusters: FailureCluster[],
): string[] {
  const priorityTopics = new Set(failureClusters.map((c) => c.topic));
  const prioritized = topics.filter((t) => priorityTopics.has(t));
  const rest = topics.filter((t) => !priorityTopics.has(t));
  return [...prioritized, ...rest];
}
