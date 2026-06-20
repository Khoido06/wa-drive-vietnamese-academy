import { getDb, ragTraces } from "@repo/db";
import { retrieve } from "./retriever.js";
import {
  generateGroundedAnswer,
  validateAnswer,
  recheckAnswer,
  computeConfidence,
} from "./generator.js";
import { DEFAULT_RAG_CONFIG, type RagAnswer, type RagConfig } from "../types.js";

export async function queryRag(
  query: string,
  config: RagConfig = DEFAULT_RAG_CONFIG,
  mode: "fast" | "strict" = "strict",
): Promise<RagAnswer> {
  const start = Date.now();

  const trace = await retrieve(query, config);
  const { answer, answerVi } = await generateGroundedAnswer(query, trace, config);

  let validation = { passed: true, reason: "skipped" };
  let recheck = { passed: true, reason: "skipped" };

  if (mode === "strict") {
    validation = await validateAnswer(trace, answer, config);
    recheck = await recheckAnswer(trace, answer, config);
  } else {
    // Fast mode: heuristic validation only — 1 LLM call total
    const answerWords = answer.toLowerCase().split(/\s+/);
    const contextText = trace.chunks.map((c) => c.content.toLowerCase()).join(" ");
    const matchRatio =
      answerWords.filter((w) => w.length > 4 && contextText.includes(w)).length /
      Math.max(answerWords.filter((w) => w.length > 4).length, 1);
    validation = {
      passed: matchRatio > 0.3 || trace.chunks.length === 0,
      reason: "Fast heuristic",
    };
  }

  const confidence = computeConfidence(trace);
  const rejected =
    !validation.passed ||
    (mode === "strict" && !recheck.passed) ||
    confidence < config.minConfidence;

  const result: RagAnswer = {
    answer: rejected ? "" : answer,
    answerVi: rejected
      ? "Xin lỗi, hệ thống không thể trả lời câu hỏi này một cách chính xác. Vui lòng thử lại."
      : answerVi,
    trace,
    confidence,
    rejected,
    rejectionReason: rejected
      ? [
          !validation.passed ? `Validator: ${validation.reason}` : null,
          !recheck.passed ? `Re-checker: ${recheck.reason}` : null,
          confidence < config.minConfidence ? "Low retrieval confidence" : null,
        ]
          .filter(Boolean)
          .join("; ")
      : undefined,
    validatorPassed: validation.passed,
    recheckerPassed: recheck.passed,
  };

  // Audit log — every query traced
  try {
    const db = getDb();
    await db.insert(ragTraces).values({
      query,
      retrievedChunkIds: trace.chunks.map((c) => c.id),
      generatedAnswer: rejected ? null : answer,
      validatorPassed: validation.passed,
      recheckerPassed: recheck.passed,
      rejected,
      rejectionReason: result.rejectionReason ?? null,
      confidence,
      latencyMs: Date.now() - start,
    });
  } catch {
    // DB may not be available in dev — trace still returned
  }

  return result;
}

export { retrieve } from "./retriever.js";
export {
  generateGroundedAnswer,
  validateAnswer,
  recheckAnswer,
  computeConfidence,
} from "./generator.js";
export { generateQuestionFromChunks } from "./question-generator.js";
