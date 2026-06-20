import { eq, and } from "drizzle-orm";
import { getDb, questions, systemMutations, systemConfig } from "@repo/db";
import {
  retrieve,
  generateQuestionFromChunks,
  DEFAULT_RAG_CONFIG,
} from "@repo/ai-core";
import {
  collectAnalytics,
  generateInsights,
  getCurrentRagConfig,
  saveRagConfig,
} from "./analytics.js";
import { applyFeedbackTuning } from "./feedback-tuning.js";
import type { MutationProposal, MutationResult } from "./types.js";

function buildProposals(
  insights: ReturnType<typeof generateInsights>,
  currentConfig: Awaited<ReturnType<typeof getCurrentRagConfig>>,
): MutationProposal[] {
  return insights.map((insight) => {
    switch (insight.mutationType) {
      case "adjust_retrieval":
        return {
          mutationType: insight.mutationType,
          triggerMetric: insight.metric,
          triggerValue: insight.value,
          beforeState: { topK: currentConfig.topK },
          afterState: { topK: Math.min(currentConfig.topK + 2, 10) },
        };
      case "update_chunking":
        return {
          mutationType: insight.mutationType,
          triggerMetric: insight.metric,
          triggerValue: insight.value,
          beforeState: {
            chunkSize: currentConfig.chunkSize,
            chunkOverlap: currentConfig.chunkOverlap,
          },
          afterState: {
            chunkSize: currentConfig.chunkSize + 128,
            chunkOverlap: currentConfig.chunkOverlap + 16,
          },
        };
      case "improve_prompt":
        return {
          mutationType: insight.mutationType,
          triggerMetric: insight.metric,
          triggerValue: insight.value,
          beforeState: { minConfidence: currentConfig.minConfidence },
          afterState: {
            minConfidence: Math.min(currentConfig.minConfidence + 0.05, 0.9),
          },
        };
      case "adjust_ui":
        return {
          mutationType: insight.mutationType,
          triggerMetric: insight.metric,
          triggerValue: insight.value,
          beforeState: { fontScale: 1 },
          afterState: { fontScale: 1.15, buttonSize: "xl" },
        };
      case "reorder_curriculum":
        return {
          mutationType: insight.mutationType,
          triggerMetric: insight.metric,
          triggerValue: insight.value,
          beforeState: { strategy: "default" },
          afterState: { strategy: "failure_cluster_priority" },
        };
      default:
        return {
          mutationType: insight.mutationType,
          triggerMetric: insight.metric,
          triggerValue: insight.value,
          beforeState: {},
          afterState: { action: "regenerate" },
        };
    }
  });
}

async function applyMutation(proposal: MutationProposal): Promise<boolean> {
  const db = getDb();
  const config = await getCurrentRagConfig();

  switch (proposal.mutationType) {
    case "adjust_retrieval":
    case "update_chunking":
    case "improve_prompt": {
      const newConfig = { ...config, ...proposal.afterState };
      await saveRagConfig(newConfig);
      break;
    }
    case "rewrite_question": {
      const allActive = await db
        .select()
        .from(questions)
        .where(eq(questions.isActive, true));

      const toRewrite = allActive.filter(
        (q) => q.timesAsked >= 5 && q.timesCorrect / Math.max(q.timesAsked, 1) < 0.3,
      );

      for (const q of toRewrite.slice(0, 3)) {
        await db.update(questions).set({ isActive: false }).where(eq(questions.id, q.id));

        const trace = await retrieve(q.topic.replace(/_/g, " "), config);
        const generated = await generateQuestionFromChunks(q.topic, trace, config);
        await db.insert(questions).values({
          topic: generated.topic,
          questionTextVi: generated.questionTextVi,
          questionTextEn: generated.questionTextEn,
          options: generated.options,
          correctOptionId: generated.correctOptionId,
          explanationVi: generated.explanationVi,
          sourceChunkIds: generated.sourceChunkIds,
        });
      }
      break;
    }
    case "adjust_ui":
    case "reorder_curriculum":
      await db
        .insert(systemConfig)
        .values({
          key: `ui_${proposal.mutationType}`,
          value: proposal.afterState,
        })
        .onConflictDoUpdate({
          target: systemConfig.key,
          set: { value: proposal.afterState, updatedAt: new Date() },
        });
      break;
  }

  await db.insert(systemMutations).values({
    mutationType: proposal.mutationType,
    triggerMetric: proposal.triggerMetric,
    triggerValue: proposal.triggerValue,
    beforeState: proposal.beforeState,
    afterState: proposal.afterState,
    applied: true,
    appliedAt: new Date(),
  });

  return true;
}

export async function runMutationCycle(): Promise<MutationResult> {
  const snapshot = await collectAnalytics();
  const insights = generateInsights(snapshot);
  const currentConfig = await getCurrentRagConfig();
  const proposals = buildProposals(insights, currentConfig);

  let applied = 0;
  for (const proposal of proposals) {
    try {
      const success = await applyMutation(proposal);
      if (success) applied++;
    } catch {
      await getDb().insert(systemMutations).values({
        mutationType: proposal.mutationType,
        triggerMetric: proposal.triggerMetric,
        triggerValue: proposal.triggerValue,
        beforeState: proposal.beforeState,
        afterState: proposal.afterState,
        applied: false,
      });
    }
  }

  const feedback = await applyFeedbackTuning();
  if (feedback.applied) applied++;

  return { insights, proposals, applied, feedbackTuning: feedback };
}

export async function getSystemHealth() {
  const snapshot = await collectAnalytics();
  const insights = generateInsights(snapshot);
  const config = await getCurrentRagConfig();
  const history = await getDb()
    .select()
    .from(systemMutations)
    .orderBy(systemMutations.createdAt)
    .limit(10);

  return {
    snapshot,
    insights,
    activeConfig: config,
    recentMutations: history,
    status: insights.length === 0 ? "healthy" : "mutating",
  };
}

export { collectAnalytics, generateInsights, getCurrentRagConfig } from "./analytics.js";
