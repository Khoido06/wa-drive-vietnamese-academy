import type { Context } from "hono";
import { queryRag as ragQuery, ingestPdf as doIngest, getChunkCount, getProviderStatus } from "@repo/ai-core";
import { getCurrentRagConfig } from "@repo/mutation-engine";

export async function queryRag(c: Context) {
  const { query, mode } = await c.req.json<{ query: string; mode?: "fast" | "strict" }>();
  if (!query) return c.json({ error: "query required" }, 400);

  const config = await getCurrentRagConfig();
  const result = await ragQuery(query, config, mode ?? "fast");
  return c.json(result);
}

export async function ingestPdf(c: Context) {
  const pdfPath =
    process.env.WA_DRIVER_GUIDE_PDF_PATH ?? "./docs/driver-guide-vi.pdf";

  try {
    const config = await getCurrentRagConfig();
    const result = await doIngest(pdfPath, config);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return c.json({ error: message }, 400);
  }
}

export async function ragStatus(c: Context): Promise<Response> {
  try {
    const count = await getChunkCount();
    const config = await getCurrentRagConfig();
    const ai = await getProviderStatus();
    return c.json({ chunksIndexed: count, config, ai });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status unavailable";
    return c.json({ chunksIndexed: 0, config: {}, ai: {}, error: message });
  }
}
