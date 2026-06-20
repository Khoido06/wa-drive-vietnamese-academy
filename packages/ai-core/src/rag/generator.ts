import { generateCompletion } from "../llm/client.js";
import type { RagConfig, RetrievalTrace } from "../types.js";
import { validateAnswer, recheckAnswer } from "./validator.js";

export { validateAnswer, recheckAnswer } from "./validator.js";

const GENERATOR_SYSTEM = `You are a Washington State driving instructor for Vietnamese elderly learners.
Answer ONLY using the provided source chunks from the Washington Driver Guide.
If the chunks do not contain enough information, say "Không đủ thông tin trong tài liệu."
Never invent facts, numbers, or rules not present in the chunks.
Respond in Vietnamese first, then English translation on a new line prefixed with "EN:".`;

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

export function computeConfidence(trace: RetrievalTrace): number {
  if (trace.chunks.length === 0) return 0;
  const avgScore =
    trace.chunks.reduce((s, c) => s + c.score, 0) / trace.chunks.length;
  return Math.min(avgScore, 1);
}
