import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { streamRagAnswer } from "@repo/ai-core";
import { resolveRagConfig } from "@repo/mutation-engine";
import { getUserTier, isUserPremium } from "@repo/learning-engine";
import { checkAndIncrementUsage } from "../services/usage.js";
import { getCachedRagAnswer, setCachedRagAnswer } from "../cache/rag-cache.js";

export async function queryRagStream(c: Context) {
  const { query, userId, stateCode } = await c.req.json<{
    query: string;
    userId?: string;
    stateCode?: string;
  }>();
  if (!query) return c.json({ error: "query required" }, 400);

  if (userId) {
    const premium = await isUserPremium(userId);
    const usage = await checkAndIncrementUsage(userId, "tutor", premium);
    if (!usage.allowed) {
      return c.json(
        {
          error: "Đã hết lượt hỏi hôm nay. Nâng cấp Pro để hỏi không giới hạn.",
          code: "USAGE_LIMIT",
          limit: usage.limit,
        },
        429,
      );
    }
  }

  const { selectedState } = userId
    ? await getUserTier(userId)
    : { selectedState: "WA" };
  const premium = userId ? await isUserPremium(userId) : false;

  const effectiveState = stateCode ?? selectedState ?? "WA";
  if (effectiveState !== "WA" && !premium) {
    return c.json(
      { error: "Bang khác chỉ dành cho gói Pro. Mặc định Washington (WA) vẫn miễn phí.", code: "STATE_LOCKED" },
      403,
    );
  }

  const config = await resolveRagConfig({
    stateCode: effectiveState,
    userId,
    query,
  });

  const cached = await getCachedRagAnswer(query, effectiveState);
  if (cached) {
    return streamSSE(c, async (stream) => {
      await stream.writeSSE({
        data: JSON.stringify({
          type: "trace",
          data: { chunkCount: 0, confidence: 1, retrievalMode: "cache", cached: true },
        }),
      });
      await stream.writeSSE({ data: JSON.stringify({ type: "token", data: cached }) });
      await stream.writeSSE({
        data: JSON.stringify({
          type: "done",
          data: { answerVi: cached, rejected: false, confidence: 1, cached: true },
        }),
      });
    });
  }

  return streamSSE(c, async (stream) => {
    let fullAnswer = "";
    let rejected = false;

    try {
      for await (const event of streamRagAnswer(query, config)) {
        if (event.type === "token") fullAnswer += String(event.data);
        if (event.type === "done") {
          const d = event.data as { rejected?: boolean; answerVi?: string };
          rejected = !!d.rejected;
          fullAnswer = d.answerVi ?? fullAnswer;
        }
        await stream.writeSSE({ data: JSON.stringify(event) });
      }

      if (!rejected && fullAnswer.trim()) {
        await setCachedRagAnswer(query, effectiveState, fullAnswer.trim());
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stream failed";
      await stream.writeSSE({ data: JSON.stringify({ type: "error", data: message }) });
    }
  });
}
