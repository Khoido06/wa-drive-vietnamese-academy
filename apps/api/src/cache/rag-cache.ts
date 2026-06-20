import { createHash } from "node:crypto";
import { logger } from "../middleware/logger.js";

const TTL_SEC = Number(process.env.RAG_CACHE_TTL_SEC ?? 86_400);
const memory = new Map<string, { value: string; expires: number }>();

function cacheKey(query: string, stateCode: string): string {
  const normalized = query.toLowerCase().trim().replace(/\s+/g, " ");
  return createHash("sha256").update(`${stateCode}:${normalized}`).digest("hex");
}

export async function getCachedRagAnswer(
  query: string,
  stateCode: string,
): Promise<string | null> {
  const key = cacheKey(query, stateCode);

  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      const hit = await redis.get<string>(`rag:${key}`);
      if (hit) return hit;
    } catch (err) {
      logger.warn("rag cache read failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const local = memory.get(key);
  if (local && local.expires > Date.now()) return local.value;
  return null;
}

export async function setCachedRagAnswer(
  query: string,
  stateCode: string,
  answer: string,
): Promise<void> {
  const key = cacheKey(query, stateCode);
  memory.set(key, { value: answer, expires: Date.now() + TTL_SEC * 1000 });

  if (process.env.UPSTASH_REDIS_REST_URL) {
    try {
      const { Redis } = await import("@upstash/redis");
      const redis = Redis.fromEnv();
      await redis.set(`rag:${key}`, answer, { ex: TTL_SEC });
    } catch (err) {
      logger.warn("rag cache write failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export function getRagCacheStats() {
  return {
    enabled: true,
    ttlSec: TTL_SEC,
    backend: process.env.UPSTASH_REDIS_REST_URL ? "upstash" : "memory",
    memoryEntries: memory.size,
  };
}
