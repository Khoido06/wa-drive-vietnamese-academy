import type { Context } from "hono";
import {
  getOrCreateUser,
  linkClerkUser,
  getNextQuestion,
  recordAttempt,
  getProgress,
  trackTelemetry,
} from "@repo/learning-engine";

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
    const result = await getNextQuestion(userId);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get question";
    return c.json({ error: message }, 500);
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
