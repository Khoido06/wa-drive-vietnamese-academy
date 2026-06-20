import { and, eq, gte, lte } from "drizzle-orm";
import { getDb, masteryStates, pushSubscriptions, userAttempts } from "@repo/db";
import { logger } from "../middleware/logger.js";

type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

function formatTopic(topic: string): string {
  return topic.replace(/_/g, " ");
}

export async function savePushSubscription(
  userId: string | null,
  sub: PushSubscription,
): Promise<void> {
  const db = getDb();
  const now = new Date();
  await db
    .insert(pushSubscriptions)
    .values({
      userId: userId && userId !== "anonymous" ? userId : null,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId: userId && userId !== "anonymous" ? userId : null,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        updatedAt: now,
      },
    });
}

async function getReminderPayload(
  userId: string | null,
): Promise<{ title: string; body: string } | null> {
  const defaultPayload = {
    title: "WA Drive — Nhắc ôn bài",
    body: "Hôm nay bạn chưa học — mở app ôn 15 phút trước khi thi nhé!",
  };

  if (!userId) return defaultPayload;

  const db = getDb();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const due = await db
    .select({ topic: masteryStates.topic })
    .from(masteryStates)
    .where(
      and(eq(masteryStates.userId, userId), lte(masteryStates.nextReviewAt, new Date())),
    );

  if (due.length > 0) {
    return {
      title: "WA Drive — Nhắc ôn bài",
      body:
        due.length === 1
          ? `Chủ đề "${formatTopic(due[0]!.topic)}" đến hạn ôn — mở app 15 phút nhé!`
          : `Bạn có ${due.length} chủ đề đến hạn ôn — mở app học 15 phút nhé!`,
    };
  }

  const [attemptToday] = await db
    .select({ id: userAttempts.id })
    .from(userAttempts)
    .where(and(eq(userAttempts.userId, userId), gte(userAttempts.createdAt, todayStart)))
    .limit(1);

  if (attemptToday) return null;

  return defaultPayload;
}

export async function sendReviewReminders(): Promise<{
  sent: number;
  failed: number;
  skipped: number;
}> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    logger.info("review-reminders skipped — VAPID keys not set");
    return { sent: 0, failed: 0, skipped: 0 };
  }

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    logger.warn("web-push not installed — run pnpm install in apps/api");
    return { sent: 0, failed: 0, skipped: 0 };
  }

  webpush.setVapidDetails("mailto:support@wa-drive.app", publicKey, privateKey);

  const db = getDb();
  const rows = await db.select().from(pushSubscriptions);

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const row of rows) {
    const userId = row.userId ?? null;
    const payload = await getReminderPayload(userId);
    if (!payload) {
      skipped++;
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: { p256dh: row.p256dh, auth: row.auth },
        },
        JSON.stringify(payload),
      );
      sent++;
      logger.info("push sent", { userId: userId ?? "anonymous" });
    } catch (err) {
      failed++;
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, row.id));
      logger.warn("push failed — subscription removed", {
        userId: userId ?? "anonymous",
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { sent, failed, skipped };
}

export function startReviewReminderCron(): void {
  if (process.env.REVIEW_REMINDER_ENABLED !== "true") return;
  const intervalMs = Number(process.env.REVIEW_REMINDER_INTERVAL_MS ?? 86_400_000);
  logger.info("review reminder cron started", { intervalMs });
  setInterval(() => {
    void sendReviewReminders();
  }, intervalMs).unref();
}
