import { computeConfidence } from "./generator.js";
import { streamText } from "../llm/client.js";
import { retrieve } from "./retriever.js";
import { DEFAULT_RAG_CONFIG, type RagConfig } from "../types.js";

export async function* streamRagAnswer(
  query: string,
  config: RagConfig = DEFAULT_RAG_CONFIG,
): AsyncGenerator<{ type: string; data: unknown }> {
  const trace = await retrieve(query, config);
  yield { type: "trace", data: { chunkCount: trace.chunks.length, confidence: computeConfidence(trace) } };

  if (trace.chunks.length === 0) {
    yield {
      type: "done",
      data: {
        answerVi: "Không tìm thấy thông tin trong sách hướng dẫn.",
        rejected: true,
        confidence: 0,
      },
    };
    return;
  }

  const context = trace.chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
  const systemPrompt = `Bạn là giáo viên dạy lái xe Washington cho người Việt lớn tuổi.
Trả lời CHỈ từ nguồn được cung cấp. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.`;

  let fullText = "";
  for await (const token of streamText(systemPrompt, `Nguồn:\n${context}\n\nCâu hỏi: ${query}`, config)) {
    fullText += token;
    yield { type: "token", data: token };
  }

  yield {
    type: "done",
    data: {
      answerVi: fullText.trim(),
      rejected: false,
      confidence: computeConfidence(trace),
      trace,
    },
  };
}
