import { computeConfidence } from "./generator.js";
import { streamText } from "../llm/client.js";
import { startRagTrace } from "../observability/langfuse.js";
import { isAnswerGrounded } from "./keyword-search.js";
import { retrieve } from "./retriever.js";
import { DEFAULT_RAG_CONFIG, type RagConfig } from "../types.js";

export async function* streamRagAnswer(
  query: string,
  config: RagConfig = DEFAULT_RAG_CONFIG,
): AsyncGenerator<{ type: string; data: unknown }> {
  const traceHandle = await startRagTrace("rag-stream", { query });

  try {
    const trace = await retrieve(query, config);
    const confidence = computeConfidence(trace);

    yield {
      type: "trace",
      data: {
        chunkCount: trace.chunks.length,
        confidence,
        retrievalMode: trace.retrievalMode ?? "vector",
        stateCode: trace.stateCode ?? config.stateCode,
        abVariant: config.abVariant,
      },
    };

    if (trace.chunks.length === 0) {
      const done = {
        answerVi: "Không tìm thấy thông tin trong sách hướng dẫn.",
        rejected: true,
        confidence: 0,
      };
      await traceHandle.end(done);
      yield { type: "done", data: done };
      return;
    }

    const context = trace.chunks.map((c, i) => `[${i + 1}] ${c.content}`).join("\n\n");
    const systemPrompt = `Bạn là giáo viên dạy lái xe Washington cho người Việt lớn tuổi.
Trả lời CHỈ từ nguồn được cung cấp. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.`;

    let fullText = "";
    for await (const token of streamText(
      systemPrompt,
      `Nguồn:\n${context}\n\nCâu hỏi: ${query}`,
      config,
    )) {
      fullText += token;
      yield { type: "token", data: token };
    }

    const answerVi = fullText.trim();
    const grounded = isAnswerGrounded(answerVi, trace.chunks);
    const rejected = !grounded || answerVi.length === 0;

    const done = {
      answerVi: rejected
        ? "Xin lỗi, hệ thống không thể trả lời câu hỏi này một cách chính xác. Vui lòng thử lại."
        : answerVi,
      rejected,
      confidence,
      grounded,
      trace,
    };

    await traceHandle.end(done);
    yield { type: "done", data: done };
  } catch (err) {
    await traceHandle.fail(err);
    throw err;
  }
}
