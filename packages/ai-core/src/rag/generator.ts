import { generateCompletion, generateJSON } from "../llm/client.js";
import type { RagConfig, RetrievalTrace } from "../types.js";

const GENERATOR_SYSTEM = `You are a Washington State driving instructor for Vietnamese elderly learners.
Answer ONLY using the provided source chunks from the Washington Driver Guide.
If the chunks do not contain enough information, say "Không đủ thông tin trong tài liệu."
Never invent facts, numbers, or rules not present in the chunks.
Respond in Vietnamese first, then English translation on a new line prefixed with "EN:".`;

const VALIDATOR_SYSTEM = `You are a strict fact-checker for Washington Driver Guide answers.
Given source chunks and a generated answer, verify EVERY claim in the answer is supported by the chunks.
Respond with JSON: { "passed": boolean, "reason": string, "unsupportedClaims": string[] }`;

const RECHECKER_SYSTEM = `You are an independent second validator. Re-check if the answer is fully grounded in the source chunks.
Look for hallucinations, invented numbers, or rules not in the source.
Respond with JSON: { "passed": boolean, "reason": string }`;

function buildContext(trace: RetrievalTrace): string {
  return trace.chunks
    .map(
      (c, i) =>
        `[Chunk ${i + 1}] (score: ${c.score.toFixed(3)}, section: ${c.sectionTitle ?? "N/A"})\n${c.content}`,
    )
    .join("\n\n---\n\n");
}

export async function generateGroundedAnswer(
  query: string,
  trace: RetrievalTrace,
  config: RagConfig,
): Promise<{ answer: string; answerVi: string }> {
  if (trace.chunks.length === 0) {
    return {
      answer: "No relevant information found in Washington Driver Guide.",
      answerVi: "Không tìm thấy thông tin liên quan trong Sách Hướng Dẫn Lái Xe Washington.",
    };
  }

  const context = buildContext(trace);
  const raw = await generateCompletion(
    GENERATOR_SYSTEM,
    `Source chunks:\n${context}\n\nQuestion: ${query}`,
    config,
  );

  const parts = raw.split("\nEN:");
  const answerVi = parts[0]?.trim() ?? raw;
  const answer = parts[1]?.trim() ?? raw;

  return { answer, answerVi };
}

export async function validateAnswer(
  trace: RetrievalTrace,
  answer: string,
  config: RagConfig,
): Promise<{ passed: boolean; reason: string }> {
  if (trace.chunks.length === 0) {
    return { passed: false, reason: "No chunks retrieved" };
  }

  const context = buildContext(trace);

  try {
    const result = await generateJSON<{
      passed: boolean;
      reason: string;
      unsupportedClaims: string[];
    }>(
      VALIDATOR_SYSTEM,
      `Source chunks:\n${context}\n\nAnswer to validate:\n${answer}`,
      config,
    );
    return { passed: result.passed, reason: result.reason };
  } catch {
    const answerWords = answer.toLowerCase().split(/\s+/);
    const contextText = trace.chunks.map((c) => c.content.toLowerCase()).join(" ");
    const matchRatio =
      answerWords.filter((w) => w.length > 4 && contextText.includes(w)).length /
      Math.max(answerWords.filter((w) => w.length > 4).length, 1);
    return {
      passed: matchRatio > 0.5,
      reason: matchRatio > 0.5 ? "Heuristic validation passed" : "Heuristic validation failed",
    };
  }
}

export async function recheckAnswer(
  trace: RetrievalTrace,
  answer: string,
  config: RagConfig,
): Promise<{ passed: boolean; reason: string }> {
  const context = buildContext(trace);

  try {
    const result = await generateJSON<{ passed: boolean; reason: string }>(
      RECHECKER_SYSTEM,
      `Source chunks:\n${context}\n\nAnswer to re-check:\n${answer}`,
      config,
    );
    return result;
  } catch {
    return validateAnswer(trace, answer, config);
  }
}

export function computeConfidence(trace: RetrievalTrace): number {
  if (trace.chunks.length === 0) return 0;
  const avgScore =
    trace.chunks.reduce((s, c) => s + c.score, 0) / trace.chunks.length;
  return Math.min(avgScore, 1);
}
