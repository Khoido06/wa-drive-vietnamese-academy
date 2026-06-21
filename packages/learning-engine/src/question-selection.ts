export type PracticeMode = "new" | "review";

export const RECENT_EXCLUDE_COUNT = 10;

export interface CuratedQuestionRow {
  id: string;
  topic: string;
}

export interface AttemptRecord {
  questionId: string;
  isCorrect: boolean;
  topic: string;
}

export interface SelectQuestionOptions {
  mode: PracticeMode;
  priorityTopics?: string[];
  excludeQuestionIds?: string[];
  avoidTopics?: string[];
}

function pickFromPool<T>(pool: T[]): T | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function applyFilters<T extends CuratedQuestionRow>(
  pool: T[],
  excludeIds: Set<string>,
  avoidTopics: Set<string>,
): T[] {
  let filtered = pool.filter((q) => !excludeIds.has(q.id));
  if (filtered.length === 0) filtered = pool;

  const withoutAvoid = filtered.filter((q) => !avoidTopics.has(q.topic));
  return withoutAvoid.length > 0 ? withoutAvoid : filtered;
}

/** Pure selection logic — unit-testable without DB. */
export function selectNextCuratedQuestion<T extends CuratedQuestionRow>(
  rows: T[],
  attempts: AttemptRecord[],
  options: SelectQuestionOptions,
): T | null {
  if (rows.length === 0) return null;

  const priorityTopics = options.priorityTopics ?? [];
  const excludeIds = new Set(options.excludeQuestionIds ?? []);
  const avoidTopics = new Set(options.avoidTopics ?? []);

  const attemptedIds = new Set(attempts.map((a) => a.questionId));
  const wrongIds = new Set(attempts.filter((a) => !a.isCorrect).map((a) => a.questionId));

  const filterUnseen = (pool: T[]) => pool.filter((q) => !attemptedIds.has(q.id));
  const filterWrong = (pool: T[]) => pool.filter((q) => wrongIds.has(q.id));
  const filterTopics = (pool: T[], topics: string[]) =>
    topics.length > 0 ? pool.filter((q) => topics.includes(q.topic)) : pool;

  const pick = (pool: T[]) => pickFromPool(applyFilters(pool, excludeIds, avoidTopics));

  if (options.mode === "review") {
    if (priorityTopics.length > 0) {
      const topicPool = filterTopics(rows, priorityTopics);
      const wrongWeak = filterWrong(topicPool);
      if (wrongWeak.length > 0) return pick(wrongWeak);
    }

    const wrongPool = filterWrong(rows);
    if (wrongPool.length > 0) return pick(wrongPool);

    const unseen = filterUnseen(rows);
    if (unseen.length > 0) return pick(unseen);

    return pick(rows);
  }

  // mode === "new" — prefer unseen; never repeat correct-only weak-topic pool
  if (priorityTopics.length > 0) {
    const topicPool = filterTopics(rows, priorityTopics);
    const unseenWeak = filterUnseen(topicPool);
    if (unseenWeak.length > 0) return pick(unseenWeak);

    const wrongWeak = filterWrong(topicPool);
    if (wrongWeak.length > 0) return pick(wrongWeak);
    // No fallback to already-correct weak-topic questions — rotate away
  }

  const unseen = filterUnseen(rows);
  if (unseen.length > 0) return pick(unseen);

  const wrongPool = filterWrong(rows);
  if (wrongPool.length > 0) return pick(wrongPool);

  return pick(rows);
}

/** If last 2 practice attempts share a topic, avoid it on the next pick. */
export function computeAvoidTopics(recentAttempts: AttemptRecord[]): string[] {
  if (recentAttempts.length < 2) return [];
  const [a, b] = recentAttempts;
  if (a && b && a.topic === b.topic) return [a.topic];
  return [];
}

export function recentQuestionIds(attempts: AttemptRecord[], limit = RECENT_EXCLUDE_COUNT): string[] {
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const a of attempts) {
    if (seen.has(a.questionId)) continue;
    seen.add(a.questionId);
    ids.push(a.questionId);
    if (ids.length >= limit) break;
  }
  return ids;
}
