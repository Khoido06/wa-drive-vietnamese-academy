import type { Context, Next } from "hono";
import { desc, sql } from "drizzle-orm";
import { getDb, ragTraces, systemMutations } from "@repo/db";
import { getProviderStatus, getChunkCount } from "@repo/ai-core";
import { getSystemHealth } from "@repo/mutation-engine";

export function adminAuth() {
  return async (c: Context, next: Next) => {
    const secret = process.env.ADMIN_SECRET;
    if (!secret) {
      return c.json({ error: "Admin not configured" }, 503);
    }
    const key = c.req.header("X-Admin-Key");
    if (key !== secret) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
  };
}

export async function adminOverview(c: Context): Promise<Response> {
  try {
    const db = getDb();
    const [chunkCount, ai, health] = await Promise.all([
      getChunkCount(),
      getProviderStatus(),
      getSystemHealth(),
    ]);

    const [traceCountRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(ragTraces);

    return c.json({
      chunksIndexed: chunkCount,
      ai,
      mutation: health,
      traceCount: traceCountRow?.count ?? 0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Overview failed";
    return c.json({ error: message }, 500);
  }
}

export async function adminTraces(c: Context): Promise<Response> {
  try {
    const db = getDb();
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
    const rows = await db
      .select()
      .from(ragTraces)
      .orderBy(desc(ragTraces.createdAt))
      .limit(limit);

    return c.json({ traces: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load traces";
    return c.json({ error: message }, 500);
  }
}

export async function adminMutations(c: Context): Promise<Response> {
  try {
    const db = getDb();
    const limit = Math.min(Number(c.req.query("limit") ?? 50), 100);
    const rows = await db
      .select()
      .from(systemMutations)
      .orderBy(desc(systemMutations.createdAt))
      .limit(limit);

    return c.json({ mutations: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load mutations";
    return c.json({ error: message }, 500);
  }
}
