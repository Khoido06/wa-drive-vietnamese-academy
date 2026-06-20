import { eq, and, lte, desc, sql } from "drizzle-orm";
import {
  getDb,
  users,
  questions,
  userAttempts,
  masteryStates,
  telemetryEvents,
} from "@repo/db";
import {
  retrieve,
  generateQuestionFromChunks,
  DEFAULT_RAG_CONFIG,
} from "@repo/ai-core";
import {
  updateSpacedRepetition,
  updateDifficulty,
  qualityFromAttempt,
  detectFailureClusters,
  reorderCurriculum,
  WA_DRIVER_TOPICS,
  type FailureCluster,
} from "./spaced-repetition.js";
import { getNextCuratedQuestion } from "./curated-exam.js";

export interface NextQuestionResult {
  question: {
    id: string;
    topic: string;
    questionTextVi: string;
    questionTextEn: string | null;
    options: Array<{ id: string; textVi: string; textEn?: string }>;
    difficultyScore: number;
  };
  dueTopics: string[];
}

export async function getOrCreateUser(displayName: string) {
  const db = getDb();
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.displayName, displayName))
    .limit(1);

  if (existing[0]) return existing[0];

  const [created] = await db
    .insert(users)
    .values({ displayName, locale: "vi" })
    .returning();
  if (!created) throw new Error("Failed to create user");
  return created;
}

/** Link Clerk account to existing local user — keeps progress when mom signs in on new device */
export async function linkClerkUser(
  clerkId: string,
  displayName: string,
  localUserId?: string,
) {
  const db = getDb();

  const [byClerk] = await db.select().from(users).where(eq(users.clerkId, clerkId)).limit(1);
  if (byClerk) return byClerk;

  if (localUserId) {
    const [local] = await db.select().from(users).where(eq(users.id, localUserId)).limit(1);
    if (local && !local.clerkId) {
      const [updated] = await db
        .update(users)
        .set({ clerkId, displayName, updatedAt: new Date() })
        .where(eq(users.id, localUserId))
        .returning();
      if (updated) return updated;
    }
  }

  const [created] = await db
    .insert(users)
    .values({ displayName, clerkId, locale: "vi" })
    .returning();
  if (!created) throw new Error("Failed to link user");
  return created;
}

export async function getNextQuestion(userId: string): Promise<NextQuestionResult> {
  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const stateCode = user?.selectedState ?? "WA";

  // WA curated DMV bank — fixed answers, no AI generation
  if (stateCode === "WA") {
    const curated = await getNextCuratedQuestion(userId, "WA");
    if (curated) {
      return {
        question: {
          id: curated.id,
          topic: curated.topic,
          questionTextVi: curated.questionTextVi,
          questionTextEn: curated.questionTextEn,
          options: curated.options,
          difficultyScore: curated.difficultyScore,
        },
        dueTopics: [],
      };
    }
  }

  const dueMastery = await db
    .select()
    .from(masteryStates)
    .where(
      and(
        eq(masteryStates.userId, userId),
        lte(masteryStates.nextReviewAt, new Date()),
      ),
    )
    .orderBy(masteryStates.masteryLevel)
    .limit(1);

  const topic = dueMastery[0]?.topic ?? (await pickWeakestTopic(userId));

  const existing = await db
    .select()
    .from(questions)
    .where(and(eq(questions.topic, topic), eq(questions.isActive, true)))
    .orderBy(desc(questions.generatedAt))
    .limit(5);

  let question = existing[Math.floor(Math.random() * existing.length)];

  if (!question) {
    question = await generateDynamicQuestion(topic);
  }

  const dueTopics = dueMastery.map((m) => m.topic);

  return {
    question: {
      id: question.id,
      topic: question.topic,
      questionTextVi: question.questionTextVi,
      questionTextEn: question.questionTextEn,
      options: question.options,
      difficultyScore: question.difficultyScore,
    },
    dueTopics,
  };
}

async function pickWeakestTopic(userId: string): Promise<string> {
  const db = getDb();
  const states = await db
    .select()
    .from(masteryStates)
    .where(eq(masteryStates.userId, userId))
    .orderBy(masteryStates.masteryLevel)
    .limit(1);

  if (states[0]) return states[0].topic;

  const idx = Math.floor(Math.random() * WA_DRIVER_TOPICS.length);
  return WA_DRIVER_TOPICS[idx] ?? "traffic_signs";
}

async function generateDynamicQuestion(topic: string) {
  const db = getDb();
  const trace = await retrieve(`Washington driver test ${topic.replace(/_/g, " ")}`, DEFAULT_RAG_CONFIG);
  const generated = await generateQuestionFromChunks(topic, trace, DEFAULT_RAG_CONFIG);

  const [question] = await db
    .insert(questions)
    .values({
      topic: generated.topic,
      questionTextVi: generated.questionTextVi,
      questionTextEn: generated.questionTextEn,
      options: generated.options,
      correctOptionId: generated.correctOptionId,
      explanationVi: generated.explanationVi,
      sourceChunkIds: generated.sourceChunkIds,
    })
    .returning();

  if (!question) throw new Error("Failed to generate question");
  return question;
}

export async function recordAttempt(input: {
  userId: string;
  questionId: string;
  selectedOptionId: string;
  responseTimeMs: number;
  context?: string;
}) {
  const db = getDb();

  const [question] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, input.questionId))
    .limit(1);

  if (!question) throw new Error("Question not found");

  const isCorrect = input.selectedOptionId === question.correctOptionId;
  const quality = qualityFromAttempt(isCorrect, input.responseTimeMs);

  await db.insert(userAttempts).values({
    userId: input.userId,
    questionId: input.questionId,
    selectedOptionId: input.selectedOptionId,
    isCorrect,
    responseTimeMs: input.responseTimeMs,
    context: input.context ?? "practice",
  });

  await db
    .update(questions)
    .set({
      timesAsked: sql`${questions.timesAsked} + 1`,
      timesCorrect: isCorrect
        ? sql`${questions.timesCorrect} + 1`
        : questions.timesCorrect,
      difficultyScore: updateDifficulty(
        question.difficultyScore,
        isCorrect,
        input.responseTimeMs,
      ),
    })
    .where(eq(questions.id, input.questionId));

  const [existingMastery] = await db
    .select()
    .from(masteryStates)
    .where(
      and(
        eq(masteryStates.userId, input.userId),
        eq(masteryStates.topic, question.topic),
      ),
    )
    .limit(1);

  const srInput = existingMastery ?? {
    easeFactor: 2.5,
    intervalDays: 1,
    repetitions: 0,
    totalAttempts: 0,
    correctAttempts: 0,
  };

  const updated = updateSpacedRepetition(srInput, quality);

  if (existingMastery) {
    await db
      .update(masteryStates)
      .set({
        easeFactor: updated.easeFactor,
        intervalDays: updated.intervalDays,
        repetitions: updated.repetitions,
        nextReviewAt: updated.nextReviewAt,
        masteryLevel: updated.masteryLevel,
        totalAttempts: existingMastery.totalAttempts + 1,
        correctAttempts: existingMastery.correctAttempts + (isCorrect ? 1 : 0),
        updatedAt: new Date(),
      })
      .where(eq(masteryStates.id, existingMastery.id));
  } else {
    await db.insert(masteryStates).values({
      userId: input.userId,
      topic: question.topic,
      easeFactor: updated.easeFactor,
      intervalDays: updated.intervalDays,
      repetitions: updated.repetitions,
      nextReviewAt: updated.nextReviewAt,
      masteryLevel: updated.masteryLevel,
      totalAttempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
    });
  }

  return {
    isCorrect,
    correctOptionId: question.correctOptionId,
    explanationVi: question.explanationVi,
    quality,
  };
}

export async function getProgress(userId: string) {
  const db = getDb();

  const mastery = await db
    .select()
    .from(masteryStates)
    .where(eq(masteryStates.userId, userId));

  const attempts = await db
    .select()
    .from(userAttempts)
    .where(eq(userAttempts.userId, userId));

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const overallMastery =
    mastery.length > 0
      ? mastery.reduce((s, m) => s + m.masteryLevel, 0) / mastery.length
      : 0;

  return {
    totalAttempts,
    correctAttempts,
    accuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
    overallMastery,
    topics: mastery.map((m) => ({
      topic: m.topic,
      masteryLevel: m.masteryLevel,
      nextReviewAt: m.nextReviewAt,
      totalAttempts: m.totalAttempts,
      correctAttempts: m.correctAttempts,
    })),
    curriculumOrder: WA_DRIVER_TOPICS,
  };
}

export async function analyzeFailureClusters(userId: string): Promise<FailureCluster[]> {
  const db = getDb();

  const attempts = await db
    .select({
      topic: questions.topic,
      isCorrect: userAttempts.isCorrect,
      responseTimeMs: userAttempts.responseTimeMs,
    })
    .from(userAttempts)
    .innerJoin(questions, eq(userAttempts.questionId, questions.id))
    .where(eq(userAttempts.userId, userId));

  return detectFailureClusters(attempts);
}

export async function getOptimizedCurriculum(userId: string): Promise<string[]> {
  const clusters = await analyzeFailureClusters(userId);
  return reorderCurriculum(WA_DRIVER_TOPICS, clusters);
}

export async function trackTelemetry(event: {
  userId?: string;
  sessionId: string;
  eventType: string;
  screen?: string;
  payload?: Record<string, unknown>;
}) {
  const db = getDb();
  await db.insert(telemetryEvents).values({
    userId: event.userId ?? null,
    sessionId: event.sessionId,
    eventType: event.eventType,
    screen: event.screen ?? null,
    payload: event.payload ?? null,
  });
}
