import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import { streamRagAnswer } from "@repo/ai-core";
import { resolveRagConfig } from "@repo/mutation-engine";

/** B2B tutor endpoint — org-scoped API key auth */
export async function b2bRagStream(c: Context) {
  const org = c.get("organization");
  const { query, stateCode } = await c.req.json<{ query: string; stateCode?: string }>();
  if (!query) return c.json({ error: "query required" }, 400);

  const config = await resolveRagConfig({
    stateCode: stateCode ?? "WA",
    query,
    userId: org.id,
  });

  return streamSSE(c, async (stream) => {
    await stream.writeSSE({
      data: JSON.stringify({ type: "meta", data: { org: org.name, stateCode: config.stateCode } }),
    });

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

export async function b2bHealth(c: Context) {
  const org = c.get("organization");
  return c.json({
    status: "ok",
    organization: org.name,
    seatLimit: org.seatLimit,
    seatsUsed: org.seatsUsed,
  });
}
