import { generateJSON } from "../llm/client.js";
import { isAnswerGrounded } from "./keyword-search.js";
import type { RagConfig, RagChunk, RetrievalTrace } from "../types.js";

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

function heuristicValidate(answer: string, chunks: RagChunk[]): { passed: boolean; reason: string } {
  if (chunks.length === 0) {
    return { passed: false, reason: "No chunks retrieved" };
  }
  const grounded = isAnswerGrounded(answer, chunks);
  if (!grounded) {
    return { passed: false, reason: "Answer not grounded in retrieved chunks" };
  }
  const answerWords = answer.toLowerCase().split(/\s+/);
  const contextText = chunks.map((c) => c.content.toLowerCase()).join(" ");
  const matchRatio =
    answerWords.filter((w) => w.length > 4 && contextText.includes(w)).length /
    Math.max(answerWords.filter((w) => w.length > 4).length, 1);
  return {
    passed: matchRatio > 0.3,
    reason: matchRatio > 0.3 ? "Heuristic validation passed" : "Heuristic validation failed",
  };
}

export async function validateAnswer(
  trace: RetrievalTrace,
  answer: string,
  config: RagConfig,
): Promise<{ passed: boolean; reason: string }> {
  if (trace.chunks.length === 0) {
    return { passed: false, reason: "No chunks retrieved" };
  }

  const useLlm = process.env.STREAM_LLM_VALIDATOR !== "false";
  if (!useLlm) {
    return heuristicValidate(answer, trace.chunks);
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
    return heuristicValidate(answer, trace.chunks);
  }
}

export async function recheckAnswer(
  trace: RetrievalTrace,
  answer: string,
  config: RagConfig,
): Promise<{ passed: boolean; reason: string }> {
  const useLlm = process.env.STREAM_LLM_VALIDATOR !== "false";
  if (!useLlm) {
    return heuristicValidate(answer, trace.chunks);
  }

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

/** Full triple-check for streamed answers (validator + rechecker) */
export async function validateStreamAnswer(
  trace: RetrievalTrace,
  answerVi: string,
  config: RagConfig,
): Promise<{ passed: boolean; validatorPassed: boolean; recheckerPassed: boolean; reason?: string }> {
  if (!answerVi.trim()) {
    return { passed: false, validatorPassed: false, recheckerPassed: false, reason: "Empty answer" };
  }

  const validation = await validateAnswer(trace, answerVi, config);
  const recheck = await recheckAnswer(trace, answerVi, config);
  const passed = validation.passed && recheck.passed;

  return {
    passed,
    validatorPassed: validation.passed,
    recheckerPassed: recheck.passed,
    reason: passed
      ? undefined
      : [!validation.passed ? validation.reason : null, !recheck.passed ? recheck.reason : null]
          .filter(Boolean)
          .join("; "),
  };
}
