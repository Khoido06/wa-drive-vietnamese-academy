import { sql, eq, gte, desc, and } from "drizzle-orm";
import {
  getDb,
  telemetryEvents,
  userAttempts,
  questions,
  ragTraces,
  systemConfig,
  systemMutations,
} from "@repo/db";
import { DEFAULT_RAG_CONFIG, type RagConfig } from "@repo/ai-core";
import type { AnalyticsSnapshot, SystemInsight } from "./types.js";

const LOOKBACK_DAYS = 7;

export async function collectAnalytics(): Promise<AnalyticsSnapshot> {
  const db = getDb();
  const since = new Date();
  since.setDate(since.getDate() - LOOKBACK_DAYS);

  const attempts = await db
    .select()
    .from(userAttempts)
    .where(gte(userAttempts.createdAt, since));

  const totalAttempts = attempts.length;
  const correctAttempts = attempts.filter((a) => a.isCorrect).length;
  const examAttempts = attempts.filter((a) => a.context === "exam");
  const examCorrect = examAttempts.filter((a) => a.isCorrect).length;

  const traces = await db
    .select()
    .from(ragTraces)
    .where(gte(ragTraces.createdAt, since));

  const avgConfidence =
    traces.length > 0
      ? traces.reduce((s, t) => s + (t.confidence ?? 0), 0) / traces.length
      : 0;

  const weakRag = traces.filter((t) => t.rejected || (t.confidence ?? 0) < 0.5).length;

  const frustrationEvents = await db
    .select()
    .from(telemetryEvents)
    .where(
      and(
        gte(telemetryEvents.createdAt, since),
        sql`${telemetryEvents.eventType} IN ('rapid_click', 'back_navigation', 'session_abandon')`,
      ),
    );

  const dropOffRaw = await db.execute(sql`
    SELECT screen, COUNT(*) as count
    FROM telemetry_events
    WHERE event_type = 'screen_exit'
      AND created_at >= ${since.toISOString()}
      AND screen IS NOT NULL
    GROUP BY screen
    ORDER BY count DESC
    LIMIT 5
  `);

  const allQuestions = await db.select().from(questions).where(eq(questions.isActive, true));
  const ambiguous = allQuestions.filter(
    (q) => q.timesAsked >= 5 && q.timesCorrect / q.timesAsked < 0.3,
  ).length;

  return {
    learningSuccessRate: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
    examPassRate: examAttempts.length > 0 ? examCorrect / examAttempts.length : 0,
    avgQuestionAccuracy: totalAttempts > 0 ? correctAttempts / totalAttempts : 0,
    avgRetrievalConfidence: avgConfidence,
    frustrationSignals: frustrationEvents.length,
    dropOffPoints: (dropOffRaw as unknown as Array<{ screen: string; count: string }>).map(
      (r) => ({ screen: r.screen, count: Number(r.count) }),
    ),
    ambiguousQuestions: ambiguous,
    weakRagAnswers: weakRag,
  };
}

export function generateInsights(snapshot: AnalyticsSnapshot): SystemInsight[] {
  const insights: SystemInsight[] = [];

  if (snapshot.avgRetrievalConfidence < 0.6) {
    insights.push({
      metric: "avgRetrievalConfidence",
      value: snapshot.avgRetrievalConfidence,
      threshold: 0.6,
      mutationType: "adjust_retrieval",
      description: "Retrieval confidence below threshold — increase topK or adjust chunking",
    });
  }

  if (snapshot.ambiguousQuestions > 3) {
    insights.push({
      metric: "ambiguousQuestions",
      value: snapshot.ambiguousQuestions,
      threshold: 3,
      mutationType: "rewrite_question",
      description: "Multiple ambiguous questions detected — regenerate from RAG",
    });
  }

  if (snapshot.weakRagAnswers > 5) {
    insights.push({
      metric: "weakRagAnswers",
      value: snapshot.weakRagAnswers,
      threshold: 5,
      mutationType: "improve_prompt",
      description: "High RAG rejection rate — mutate validator/generator prompts",
    });
  }

  if (snapshot.frustrationSignals > 10) {
    insights.push({
      metric: "frustrationSignals",
      value: snapshot.frustrationSignals,
      threshold: 10,
      mutationType: "adjust_ui",
      description: "User frustration detected — simplify UI layouts",
    });
  }

  if (snapshot.learningSuccessRate < 0.5) {
    insights.push({
      metric: "learningSuccessRate",
      value: snapshot.learningSuccessRate,
      threshold: 0.5,
      mutationType: "reorder_curriculum",
      description: "Low learning success — reorder curriculum to prioritize failure clusters",
    });
  }

  if (snapshot.avgRetrievalConfidence < 0.5) {
    insights.push({
      metric: "chunkingEffectiveness",
      value: snapshot.avgRetrievalConfidence,
      threshold: 0.5,
      mutationType: "update_chunking",
      description: "Poor chunk matches — adjust chunk size and overlap",
    });
  }

  return insights;
}

export async function getCurrentRagConfig(): Promise<RagConfig> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(systemConfig)
    .where(eq(systemConfig.key, "rag_config"))
    .limit(1);

  if (row?.value) return { ...DEFAULT_RAG_CONFIG, ...row.value } as RagConfig;
  return DEFAULT_RAG_CONFIG;
}

export async function saveRagConfig(config: RagConfig) {
  const db = getDb();
  await db
    .insert(systemConfig)
    .values({ key: "rag_config", value: config as unknown as Record<string, unknown> })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: { value: config as unknown as Record<string, unknown>, updatedAt: new Date() },
    });
}

export async function getMutationHistory(limit = 20) {
  const db = getDb();
  return db
    .select()
    .from(systemMutations)
    .orderBy(desc(systemMutations.createdAt))
    .limit(limit);
}
