import { gte, eq, sql } from "drizzle-orm";
import { getDb, ragFeedback, systemConfig, systemMutations } from "@repo/db";
import { getCurrentRagConfig, saveRagConfig } from "./analytics.js";

const LOOKBACK_DAYS = 7;
const NEGATIVE_RATIO_THRESHOLD = 0.35;

/** Tune retrieval when users report unhelpful RAG answers */
export async function applyFeedbackTuning(): Promise<{ applied: boolean; reason: string }> {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const rows = await db
    .select()
    .from(ragFeedback)
    .where(gte(ragFeedback.createdAt, since));

  if (rows.length < 10) {
    return { applied: false, reason: `Insufficient feedback (${rows.length}/10)` };
  }

  const negative = rows.filter((r) => !r.helpful).length;
  const ratio = negative / rows.length;

  if (ratio < NEGATIVE_RATIO_THRESHOLD) {
    return { applied: false, reason: `Negative ratio OK (${(ratio * 100).toFixed(0)}%)` };
  }

  const config = await getCurrentRagConfig();
  const before = { ...config };
  const after = {
    ...config,
    topK: Math.min(config.topK + 1, 10),
    minConfidence: Math.min(config.minConfidence + 0.03, 0.85),
  };

  await saveRagConfig(after);
  await db.insert(systemMutations).values({
    mutationType: "adjust_retrieval",
    triggerMetric: "rag_feedback_negative_ratio",
    triggerValue: ratio,
    beforeState: before as unknown as Record<string, unknown>,
    afterState: after as unknown as Record<string, unknown>,
    applied: true,
    appliedAt: new Date(),
  });

  await db
    .insert(systemConfig)
    .values({
      key: "feedback_tuning",
      value: { lastRatio: ratio, lastApplied: new Date().toISOString(), sampleSize: rows.length },
    })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: {
        value: { lastRatio: ratio, lastApplied: new Date().toISOString(), sampleSize: rows.length },
        updatedAt: new Date(),
      },
    });

  return {
    applied: true,
    reason: `Raised topK/minConfidence due to ${(ratio * 100).toFixed(0)}% negative feedback`,
  };
}

export async function getFeedbackStats() {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const [stats] = await db
    .select({
      total: sql<number>`count(*)::int`,
      helpful: sql<number>`count(*) filter (where ${ragFeedback.helpful})::int`,
    })
    .from(ragFeedback)
    .where(gte(ragFeedback.createdAt, since));

  const total = stats?.total ?? 0;
  const helpful = stats?.helpful ?? 0;

  return {
    total,
    helpful,
    negative: total - helpful,
    helpfulRate: total > 0 ? helpful / total : 1,
  };
}
