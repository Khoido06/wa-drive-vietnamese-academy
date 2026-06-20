import type { Context } from "hono";
import {
  queryRag as ragQuery,
  ingestPdf as doIngest,
  getChunkCount,
  getProviderStatus,
  getAvailableStates,
} from "@repo/ai-core";
import { resolveRagConfig } from "@repo/mutation-engine";
import { getRagCacheStats } from "../cache/rag-cache.js";

export async function queryRag(c: Context) {
  const { query, mode, stateCode, userId } = await c.req.json<{
    query: string;
    mode?: "fast" | "strict";
    stateCode?: string;
    userId?: string;
  }>();
  if (!query) return c.json({ error: "query required" }, 400);

  const config = await resolveRagConfig({ stateCode, userId, query });
  const result = await ragQuery(query, config, mode ?? "fast");
  return c.json(result);
}

export async function ingestPdf(c: Context) {
  let body: { stateCode?: string; pdfPath?: string } = {};
  try {
    body = await c.req.json<{ stateCode?: string; pdfPath?: string }>();
  } catch {
    // empty body — default WA ingest
  }
  const pdfPath =
    body.pdfPath ??
    (body.stateCode === "CA"
      ? process.env.CA_DRIVER_GUIDE_PDF_PATH
      : undefined) ??
    process.env.WA_DRIVER_GUIDE_PDF_PATH ??
    "./docs/driver-guide-vi.pdf";

  try {
    const config = await resolveRagConfig({ stateCode: body.stateCode ?? "WA" });
    const result = await doIngest(pdfPath, config, {
      stateCode: body.stateCode ?? "WA",
    });
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return c.json({ error: message }, 400);
  }
}

export async function ragStates(c: Context): Promise<Response> {
  try {
    const states = await getAvailableStates();
    return c.json({ states });
  } catch (err) {
    const message = err instanceof Error ? err.message : "States unavailable";
    return c.json({ states: [{ code: "WA", chunks: 0 }], error: message });
  }
}

export async function ragStatus(c: Context): Promise<Response> {
  try {
    const count = await getChunkCount();
    const config = await resolveRagConfig({});
    const ai = await getProviderStatus();
    return c.json({
      chunksIndexed: count,
      config,
      ai,
      cache: getRagCacheStats(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status unavailable";
    return c.json({ chunksIndexed: 0, config: {}, ai: {}, error: message });
  }
}
