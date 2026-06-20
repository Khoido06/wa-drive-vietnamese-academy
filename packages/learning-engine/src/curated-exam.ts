import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { and, eq, sql } from "drizzle-orm";
import { getDb, questions } from "@repo/db";

const __dir = dirname(fileURLToPath(import.meta.url));

export interface CuratedQuestionInput {
  externalId: string;
  topic: string;
  questionTextVi: string;
  questionTextEn?: string;
  options: Array<{ id: string; textVi: string; textEn?: string }>;
  correctOptionId: string;
  explanationVi: string;
  imageUrl?: string;
  sourceRef?: string;
}

export interface WaExamSetMeta {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  /** WA DMV knowledge test uses 40 questions */
  examLength: number;
  /** 80% pass = 32/40 */
  passCount: number;
}

export const WA_DMV_EXAM_LENGTH = 40;
export const WA_DMV_PASS_COUNT = 32;

export const WA_EXAM_SETS: WaExamSetMeta[] = [
  {
    id: "wa-set-01",
    name: "Bộ đề 1",
    description: "50 câu chuẩn DMV — luật WA, giải thích tiếng Việt",
    questionCount: 50,
    examLength: WA_DMV_EXAM_LENGTH,
    passCount: WA_DMV_PASS_COUNT,
  },
  {
    id: "wa-set-02",
    name: "Bộ đề 2",
    description: "50 câu mới — không trùng bộ 1",
    questionCount: 50,
    examLength: WA_DMV_EXAM_LENGTH,
    passCount: WA_DMV_PASS_COUNT,
  },
  {
    id: "wa-set-03",
    name: "Bộ đề 3",
    description: "50 câu nâng cao — ôn sát đề thi",
    questionCount: 50,
    examLength: WA_DMV_EXAM_LENGTH,
    passCount: WA_DMV_PASS_COUNT,
  },
  {
    id: "wa-set-04",
    name: "Bộ đề 4",
    description: "50 câu mới — nhiều biển báo có hình",
    questionCount: 50,
    examLength: WA_DMV_EXAM_LENGTH,
    passCount: WA_DMV_PASS_COUNT,
  },
  {
    id: "wa-set-05",
    name: "Bộ đề 5",
    description: "50 câu tổng hợp — sát đề thi DMV",
    questionCount: 50,
    examLength: WA_DMV_EXAM_LENGTH,
    passCount: WA_DMV_PASS_COUNT,
  },
];

const SET_FILES: Record<string, string> = {
  "wa-set-01": "set-01.json",
  "wa-set-02": "set-02.json",
  "wa-set-03": "set-03.json",
  "wa-set-04": "set-04.json",
  "wa-set-05": "set-05.json",
};

function loadSetFile(setId: string): CuratedQuestionInput[] {
  const file = SET_FILES[setId];
  if (!file) throw new Error(`Unknown exam set: ${setId}`);
  const path = join(__dir, "../data/wa", file);
  if (!existsSync(path)) throw new Error(`Exam set file not found: ${path}`);
  return JSON.parse(readFileSync(path, "utf8")) as CuratedQuestionInput[];
}

export function loadAllCuratedQuestions(): Array<
  CuratedQuestionInput & { examSetId: string; questionNumber: number }
> {
  const all: Array<CuratedQuestionInput & { examSetId: string; questionNumber: number }> = [];
  for (const set of WA_EXAM_SETS) {
    const items = loadSetFile(set.id);
    items.forEach((q, i) => {
      all.push({ ...q, examSetId: set.id, questionNumber: i + 1 });
    });
  }
  return all;
}

export async function seedWaExamQuestions(): Promise<{ inserted: number; updated: number }> {
  const db = getDb();
  let inserted = 0;
  let updated = 0;

  for (const item of loadAllCuratedQuestions()) {
    const [existing] = await db
      .select({ id: questions.id })
      .from(questions)
      .where(eq(questions.externalId, item.externalId))
      .limit(1);

    const values = {
      externalId: item.externalId,
      stateCode: "WA" as const,
      examSetId: item.examSetId,
      questionNumber: item.questionNumber,
      isCurated: true,
      topic: item.topic,
      questionTextVi: item.questionTextVi,
      questionTextEn: item.questionTextEn ?? null,
      options: item.options,
      correctOptionId: item.correctOptionId,
      explanationVi: item.explanationVi,
      imageUrl: item.imageUrl ?? null,
      sourceRef: item.sourceRef ?? null,
      sourceChunkIds: [] as string[],
      isActive: true,
    };

    if (existing) {
      await db.update(questions).set(values).where(eq(questions.id, existing.id));
      updated++;
    } else {
      await db.insert(questions).values(values);
      inserted++;
    }
  }

  return { inserted, updated };
}

export function getWaExamSets() {
  return WA_EXAM_SETS;
}

export async function getCuratedQuestionCount(stateCode = "WA"): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(questions)
    .where(and(eq(questions.stateCode, stateCode), eq(questions.isCurated, true)));
  return rows[0]?.count ?? 0;
}

function pickFromPool<T>(pool: T[]): T | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export async function getNextCuratedQuestion(
  userId: string,
  stateCode = "WA",
  priorityTopics: string[] = [],
): Promise<(typeof questions.$inferSelect) | null> {
  const db = getDb();

  const rows = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.stateCode, stateCode),
        eq(questions.isCurated, true),
        eq(questions.isActive, true),
      ),
    );

  if (rows.length === 0) return null;

  const attemptRows = await db.execute(sql`
    SELECT question_id, is_correct
    FROM user_attempts
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `);
  const attempts = attemptRows as unknown as Array<{ question_id: string; is_correct: boolean }>;
  const attemptedIds = new Set(attempts.map((r) => r.question_id));
  const wrongIds = new Set(attempts.filter((r) => !r.is_correct).map((r) => r.question_id));

  const filterUnseen = (pool: typeof rows) => pool.filter((q) => !attemptedIds.has(q.id));
  const filterWrong = (pool: typeof rows) => pool.filter((q) => wrongIds.has(q.id));
  const filterTopics = (pool: typeof rows, topics: string[]) =>
    topics.length > 0 ? pool.filter((q) => topics.includes(q.topic)) : pool;

  // 1. Weak topics — prefer unseen, then previously wrong
  if (priorityTopics.length > 0) {
    const topicPool = filterTopics(rows, priorityTopics);
    const unseenWeak = filterUnseen(topicPool);
    if (unseenWeak.length > 0) return pickFromPool(unseenWeak);
    const wrongWeak = filterWrong(topicPool);
    if (wrongWeak.length > 0) return pickFromPool(wrongWeak);
    if (topicPool.length > 0) return pickFromPool(topicPool);
  }

  // 2. Any previously wrong answers
  const wrongPool = filterWrong(rows);
  if (wrongPool.length > 0) return pickFromPool(wrongPool);

  // 3. Unseen questions
  const unseen = filterUnseen(rows);
  if (unseen.length > 0) return pickFromPool(unseen);

  return pickFromPool(rows);
}

export async function startWaExamSet(
  setId: string,
  examLength = WA_DMV_EXAM_LENGTH,
): Promise<
  Array<
    Omit<(typeof questions.$inferSelect), "correctOptionId" | "explanationVi"> & {
      options: Array<{ id: string; textVi: string; textEn?: string }>;
    }
  >
> {
  const db = getDb();
  const meta = WA_EXAM_SETS.find((s) => s.id === setId);
  if (!meta) throw new Error(`Unknown exam set: ${setId}`);

  const rows = await db
    .select()
    .from(questions)
    .where(
      and(
        eq(questions.examSetId, setId),
        eq(questions.isCurated, true),
        eq(questions.isActive, true),
      ),
    )
    .orderBy(questions.questionNumber);

  if (rows.length < examLength) {
    throw new Error(`Exam set ${setId} has only ${rows.length} questions, need ${examLength}`);
  }

  const shuffled = [...rows].sort(() => Math.random() - 0.5).slice(0, examLength);

  return shuffled.map(({ correctOptionId: _c, explanationVi: _e, ...q }) => q);
}

export function stripAnswer<T extends { correctOptionId?: string; explanationVi?: string | null }>(
  q: T,
): Omit<T, "correctOptionId" | "explanationVi"> {
  const { correctOptionId: _c, explanationVi: _e, ...rest } = q;
  return rest;
}
