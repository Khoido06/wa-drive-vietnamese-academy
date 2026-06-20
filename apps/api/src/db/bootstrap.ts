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
