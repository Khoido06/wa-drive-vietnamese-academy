import { sql } from "drizzle-orm";
import { getDb } from "@repo/db";
import { logger } from "../middleware/logger.js";

/** Ensures push_subscriptions exists (Neon-safe, idempotent). */
export async function ensurePushSubscriptionsTable(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  try {
    const db = getDb();
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid REFERENCES users(id),
        endpoint text NOT NULL UNIQUE,
        p256dh text NOT NULL,
        auth text NOT NULL,
        created_at timestamp NOT NULL DEFAULT now(),
        updated_at timestamp NOT NULL DEFAULT now()
      )
    `);
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS push_sub_user_idx ON push_subscriptions (user_id)
    `);
    logger.info("push_subscriptions table ready");
  } catch (err) {
    logger.warn("push_subscriptions bootstrap failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Repairs legacy SM-2 rows that overflow Postgres timestamptz (year > 9999). */
export async function ensureMasteryStatesSanitized(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  try {
    const db = getDb();
    const result = await db.execute(sql`
      UPDATE mastery_states
      SET
        interval_days = LEAST(GREATEST(COALESCE(interval_days, 1), 1), 365),
        ease_factor = LEAST(GREATEST(COALESCE(ease_factor, 2.5), 1.3), 2.5),
        next_review_at = LEAST(
          GREATEST(next_review_at, NOW()),
          NOW() + INTERVAL '365 days'
        ),
        updated_at = NOW()
      WHERE
        interval_days > 365
        OR interval_days < 1
        OR ease_factor > 2.5
        OR ease_factor < 1.3
        OR next_review_at > NOW() + INTERVAL '400 days'
        OR next_review_at < TIMESTAMPTZ '2000-01-01'
    `);
    const rows = Number((result as { rowCount?: number }).rowCount ?? 0);
    if (rows > 0) {
      logger.info("sanitized corrupted mastery_states rows", { rows });
    }
  } catch (err) {
    logger.warn("mastery_states sanitize bootstrap failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}

/** Ensures study gamification columns on users (Neon-safe). */
export async function ensureStudyStatsColumns(): Promise<void> {
  if (!process.env.DATABASE_URL) return;

  try {
    const db = getDb();
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS study_streak integer NOT NULL DEFAULT 0`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS study_best_streak integer NOT NULL DEFAULT 0`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS study_last_date text`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS study_daily_correct integer NOT NULL DEFAULT 0`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS study_daily_total integer NOT NULL DEFAULT 0`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS study_daily_date text`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal_minutes integer DEFAULT 15`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_target_date text`);
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS practical_progress jsonb`);
    logger.info("study stats columns ready");
  } catch (err) {
    logger.warn("study stats bootstrap failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
