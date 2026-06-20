import { logger } from "../middleware/logger.js";

type PushSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

const subscriptions = new Map<string, PushSubscription>();

export function savePushSubscription(userId: string | null, sub: PushSubscription): void {
  const key = userId ?? "anonymous";
  subscriptions.set(key, sub);
}

export function getPushSubscriptions(): Map<string, PushSubscription> {
  return subscriptions;
}

export async function sendReviewReminders(): Promise<{ sent: number; failed: number }> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    logger.info("review-reminders skipped — VAPID keys not set");
    return { sent: 0, failed: 0 };
  }

  let webpush: typeof import("web-push");
  try {
    webpush = await import("web-push");
  } catch {
    logger.warn("web-push not installed — run pnpm install in apps/api");
    return { sent: 0, failed: 0 };
  }

  webpush.setVapidDetails("mailto:support@wa-drive.app", publicKey, privateKey);

  const payload = JSON.stringify({
    title: "WA Drive — Nhắc ôn bài",
    body: "Hôm nay bạn chưa học — mở app ôn 15 phút trước khi thi nhé!",
  });

  let sent = 0;
  let failed = 0;
  for (const [userId, sub] of subscriptions) {
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
      logger.info("push sent", { userId });
    } catch (err) {
      failed++;
      subscriptions.delete(userId);
      logger.warn("push failed", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  return { sent, failed };
}

export function startReviewReminderCron(): void {
  if (process.env.REVIEW_REMINDER_ENABLED !== "true") return;
  const intervalMs = Number(process.env.REVIEW_REMINDER_INTERVAL_MS ?? 86_400_000);
  logger.info("review reminder cron started", { intervalMs });
  setInterval(() => {
    void sendReviewReminders();
  }, intervalMs).unref();
}
