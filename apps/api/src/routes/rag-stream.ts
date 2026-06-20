import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { streamRagAnswer } from "@repo/ai-core";
import { getCurrentRagConfig } from "@repo/mutation-engine";

export async function queryRagStream(c: Context) {
  const { query } = await c.req.json<{ query: string }>();
  if (!query) return c.json({ error: "query required" }, 400);

  const config = await getCurrentRagConfig();

  return streamSSE(c, async (stream) => {
    try {
      for await (const event of streamRagAnswer(query, config)) {
        await stream.writeSSE({ data: JSON.stringify(event) });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Stream failed";
      await stream.writeSSE({ data: JSON.stringify({ type: "error", data: message }) });
    }
  });
}
