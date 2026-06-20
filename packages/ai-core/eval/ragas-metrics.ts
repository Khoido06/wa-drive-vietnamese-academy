/**
 * RAGAS-inspired metrics (pure TS, no Python dependency).
 * @see https://docs.ragas.io/
 */
import { normalize } from "./run-eval.js";

export interface RagasMetrics {
  contextPrecision: number;
  contextRecall: number;
  faithfulness: number;
  answerRelevancy: number;
}

export function contextPrecision(
  retrievedContent: string,
  expectedTerms: string[],
): number {
  if (expectedTerms.length === 0) return 1;
  const text = normalize(retrievedContent);
  const hits = expectedTerms.filter((t) => text.includes(normalize(t))).length;
  return hits / expectedTerms.length;
}

export function contextRecall(
  retrievedContent: string,
  referenceContent: string,
): number {
  const refWords = normalize(referenceContent)
    .split(/\s+/)
    .filter((w) => w.length > 4);
  if (refWords.length === 0) return 1;
  const text = normalize(retrievedContent);
  const hits = refWords.filter((w) => text.includes(w)).length;
  return Math.min(hits / refWords.length, 1);
}

export function faithfulness(answer: string, context: string): number {
  const answerWords = normalize(answer)
    .split(/\s+/)
    .filter((w) => w.length > 4);
  if (answerWords.length === 0) return 0;
  const ctx = normalize(context);
  const grounded = answerWords.filter((w) => ctx.includes(w)).length;
  return grounded / answerWords.length;
}

export function answerRelevancy(query: string, answer: string): number {
  const qTokens = new Set(
    normalize(query)
      .split(/\s+/)
      .filter((w) => w.length > 3),
  );
  if (qTokens.size === 0) return 1;
  const aTokens = normalize(answer).split(/\s+/);
  const overlap = aTokens.filter((w) => qTokens.has(w)).length;
  return Math.min(overlap / qTokens.size, 1);
}

export function aggregateRagas(metrics: RagasMetrics[]): RagasMetrics {
  if (metrics.length === 0) {
    return { contextPrecision: 0, contextRecall: 0, faithfulness: 0, answerRelevancy: 0 };
  }
  const sum = metrics.reduce(
    (acc, m) => ({
      contextPrecision: acc.contextPrecision + m.contextPrecision,
      contextRecall: acc.contextRecall + m.contextRecall,
      faithfulness: acc.faithfulness + m.faithfulness,
      answerRelevancy: acc.answerRelevancy + m.answerRelevancy,
    }),
    { contextPrecision: 0, contextRecall: 0, faithfulness: 0, answerRelevancy: 0 },
  );
  const n = metrics.length;
  return {
    contextPrecision: sum.contextPrecision / n,
    contextRecall: sum.contextRecall / n,
    faithfulness: sum.faithfulness / n,
    answerRelevancy: sum.answerRelevancy / n,
  };
}
