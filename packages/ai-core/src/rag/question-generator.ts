import type { GeneratedQuestion, RagConfig, RetrievalTrace } from "../types.js";
import { generateJSON } from "../llm/client.js";
import { resolveProviders } from "../llm/providers/resolver.js";

const QUESTION_SYSTEM = `Generate a multiple-choice question for Washington Driver Test prep.
Question must be answerable ONLY from the provided chunks.
Provide Vietnamese text with English translation. 4 options, exactly 1 correct.`;

function devFallbackQuestion(topic: string, trace: RetrievalTrace): GeneratedQuestion {
  const snippet = trace.chunks[0]?.content.slice(0, 120) ?? topic;
  return {
    topic,
    questionTextVi: `Theo sách hướng dẫn, điều nào sau đây đúng về ${topic.replace(/_/g, " ")}?`,
    questionTextEn: `According to the guide, which is correct about ${topic.replace(/_/g, " ")}?`,
    options: [
      { id: "a", textVi: "Luôn tuân thủ biển báo và luật giao thông", textEn: "Always obey signs and traffic laws" },
      { id: "b", textVi: "Không cần quan sát khi rẽ", textEn: "No need to look when turning" },
      { id: "c", textVi: "Được vượt đèn đỏ nếu vắng xe", textEn: "May run red lights if empty" },
      { id: "d", textVi: "Không cần thắt dây an toàn", textEn: "Seat belts optional" },
    ],
    correctOptionId: "a",
    explanationVi: `Dựa trên tài liệu: "${snippet}..."`,
    sourceChunkIds: trace.chunks.map((c) => c.id),
  };
}

export async function generateQuestionFromChunks(
  topic: string,
  trace: RetrievalTrace,
  config: RagConfig,
): Promise<GeneratedQuestion> {
  const { active } = await resolveProviders();
  if (active === "mock") {
    return devFallbackQuestion(topic, trace);
  }

  const context = trace.chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.content}`)
    .join("\n\n---\n\n");

  try {
    const result = await generateJSON<GeneratedQuestion>(
      QUESTION_SYSTEM,
      `Topic: ${topic}\n\nSource chunks:\n${context}\n\nRespond JSON with:
      { topic, questionTextVi, questionTextEn, options: [{id, textVi, textEn}], correctOptionId, explanationVi, sourceChunkIds }`,
      config,
    );
    return { ...result, sourceChunkIds: trace.chunks.map((c) => c.id) };
  } catch {
    return devFallbackQuestion(topic, trace);
  }
}
