import type { Context } from "hono";
import {
  getOrCreateUser,
  linkClerkUser,
  getNextQuestion,
  recordAttempt,
  getProgress,
  trackTelemetry,
  setUserState as updateUserState,
  getWaExamSets,
  startWaExamSet,
  getStudyStats,
  recordStudyActivity,
  mergeStudyStats,
  updateStudyPreferences,
  isUserPremium,
  type StudyStatsDto,
} from "@repo/learning-engine";
import { checkAndIncrementUsage } from "../services/usage.js";

export async function createUser(c: Context) {
  const { displayName } = await c.req.json<{ displayName: string }>();
  if (!displayName) return c.json({ error: "displayName required" }, 400);

  const user = await getOrCreateUser(displayName);
  return c.json(user);
}

export async function linkUser(c: Context) {
  const { clerkId, displayName, localUserId } = await c.req.json<{
    clerkId: string;
    displayName: string;
    localUserId?: string;
  }>();

  if (!clerkId || !displayName) {
    return c.json({ error: "clerkId and displayName required" }, 400);
  }

  const jwtClerkId = c.get("clerkUserId");
  if (jwtClerkId && jwtClerkId !== clerkId) {
    return c.json({ error: "clerkId does not match session" }, 403);
  }

  try {
    const user = await linkClerkUser(clerkId, displayName, localUserId);
    return c.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to link user";
    return c.json({ error: message }, 500);
  }
}

export async function nextQuestion(c: Context) {
  const userId = c.req.param("userId");
  if (!userId) return c.json({ error: "userId required" }, 400);
  try {
    const premium = await isUserPremium(userId);
    const usage = await checkAndIncrementUsage(userId, "practice", premium);
    if (!usage.allowed) {
      return c.json(
        {
          error: "Đã hết lượt luyện tập hôm nay. Nâng cấp Pro để luyện không giới hạn.",
          code: "USAGE_LIMIT",
        },
        429,
      );
    }
    const result = await getNextQuestion(userId);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get question";
    return c.json({ error: message }, 500);
  }
}

export async function setUserState(c: Context) {
  const userId = c.req.param("userId");
  const { stateCode } = await c.req.json<{ stateCode: string }>();
  if (!userId || !stateCode) return c.json({ error: "userId and stateCode required" }, 400);
  try {
    await updateUserState(userId, stateCode.toUpperCase());
    return c.json({ ok: true, stateCode: stateCode.toUpperCase() });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to set state";
    return c.json({ error: message }, 400);
  }
}

export async function submitAttempt(c: Context) {
  const body = await c.req.json<{
    userId: string;
    questionId: string;
    selectedOptionId: string;
    responseTimeMs: number;
    context?: string;
  }>();

  if (!body.userId || !body.questionId || !body.selectedOptionId) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  try {
    const result = await recordAttempt(body);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to record attempt";
    return c.json({ error: message }, 500);
  }
}

export async function userProgress(c: Context) {
  const userId = c.req.param("userId");
  if (!userId) return c.json({ error: "userId required" }, 400);
  try {
    const progress = await getProgress(userId);
    return c.json(progress);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get progress";
    return c.json({ error: message }, 500);
  }
}

export async function examSets(c: Context) {
  return c.json({
    sets: getWaExamSets(),
    dmv: { examLength: 40, passCount: 32, passRate: 0.8 },
  });
}

export async function startExam(c: Context) {
  const userId = c.req.param("userId");
  const setId = c.req.query("setId") ?? "wa-set-01";
  if (!userId) return c.json({ error: "userId required" }, 400);

  try {
    const premium = await isUserPremium(userId);
    const usage = await checkAndIncrementUsage(userId, "practice", premium);
    if (!usage.allowed) {
      return c.json(
        {
          error: "Đã hết lượt luyện tập hôm nay. Nâng cấp Pro để luyện không giới hạn.",
          code: "USAGE_LIMIT",
        },
        429,
      );
    }

    const meta = getWaExamSets().find((s) => s.id === setId);
    if (!meta) return c.json({ error: "Invalid exam set" }, 400);

    const questions = await startWaExamSet(setId, meta.examLength);
    return c.json({
      setId,
      setName: meta.name,
      examLength: meta.examLength,
      passCount: meta.passCount,
      questions: questions.map((q) => ({
        id: q.id,
        topic: q.topic,
        questionTextVi: q.questionTextVi,
        questionTextEn: q.questionTextEn,
        imageUrl: q.imageUrl,
        options: q.options,
        questionNumber: q.questionNumber,
      })),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start exam";
    return c.json({ error: message }, 500);
  }
}

export async function postTelemetry(c: Context) {
  const body = await c.req.json<{
    userId?: string;
    sessionId: string;
    eventType: string;
    screen?: string;
    payload?: Record<string, unknown>;
  }>();

  if (!body.sessionId || !body.eventType) {
    return c.json({ error: "sessionId and eventType required" }, 400);
  }

  try {
    await trackTelemetry(body);
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: true });
  }
}

export async function studyStatsGet(c: Context) {
  const userId = c.req.param("userId");
  if (!userId) return c.json({ error: "userId required" }, 400);
  const stats = await getStudyStats(userId);
  if (!stats) return c.json({ error: "User not found" }, 404);
  return c.json(stats);
}

export async function studyStatsActivity(c: Context) {
  const userId = c.req.param("userId");
  const body = await c.req.json<{
    activityDate: string;
    isCorrect: boolean;
    incrementTotal?: number;
    incrementCorrect?: number;
  }>();
  if (!userId || !body.activityDate) {
    return c.json({ error: "userId and activityDate required" }, 400);
  }
  const stats = await recordStudyActivity(userId, body);
  if (!stats) return c.json({ error: "User not found" }, 404);
  return c.json(stats);
}

export async function studyStatsSync(c: Context) {
  const userId = c.req.param("userId");
  const body = await c.req.json<
    StudyStatsDto & { activityDate: string; dailyGoalMinutes?: number; examDate?: string | null }
  >();
  if (!userId || !body.activityDate) {
    return c.json({ error: "userId and activityDate required" }, 400);
  }
  const stats = await mergeStudyStats(userId, body);
  if (!stats) return c.json({ error: "User not found" }, 404);
  if (body.dailyGoalMinutes || body.examDate !== undefined) {
    await updateStudyPreferences(userId, {
      dailyGoalMinutes: body.dailyGoalMinutes,
      examDate: body.examDate,
    });
  }
  return c.json(stats);
}
