import { sql, desc, eq } from "drizzle-orm";
import { getDb, ragChunks } from "@repo/db";
import { embedText } from "../llm/client.js";
import { resolveProviders } from "../llm/providers/resolver.js";
import type { RagChunk, RagConfig, RetrievalTrace } from "../types.js";
import { rankByKeywords } from "./keyword-search.js";

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += (a[i] ?? 0) * (b[i] ?? 0);
    magA += (a[i] ?? 0) ** 2;
    magB += (b[i] ?? 0) ** 2;
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB) || 1);
}

async function retrieveByKeywords(
  query: string,
  topK: number,
  stateCode: string,
): Promise<RagChunk[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: ragChunks.id,
      content: ragChunks.content,
      sectionTitle: ragChunks.sectionTitle,
      pageNumber: ragChunks.pageNumber,
    })
    .from(ragChunks)
    .where(eq(ragChunks.stateCode, stateCode))
    .orderBy(desc(ragChunks.createdAt))
    .limit(100);

  return rankByKeywords(query, rows, topK);
}

export async function getAvailableStates(): Promise<Array<{ code: string; chunks: number }>> {
  const db = getDb();
  const rows = await db.execute(sql`
    SELECT state_code AS code, COUNT(*)::int AS chunks
    FROM rag_chunks
    GROUP BY state_code
    ORDER BY state_code
  `);
  return (rows as unknown as Array<{ code: string; chunks: number }>).map((r) => ({
    code: r.code,
    chunks: Number(r.chunks),
  }));
}

export async function retrieve(
  query: string,
  config: RagConfig,
): Promise<RetrievalTrace> {
  const start = Date.now();
  const db = getDb();
  const stateCode = config.stateCode ?? "WA";
  const { embedProvider } = await resolveProviders();
  const canUseVectorSearch = embedProvider.name !== "mock" && !!process.env.DATABASE_URL;

  let chunks: RagChunk[];

  if (canUseVectorSearch) {
    const queryEmbedding = await embedText(query, config);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;
    const results = await db.execute(sql`
      SELECT id, content, section_title, page_number,
             1 - (embedding <=> ${embeddingStr}::vector) AS score
      FROM rag_chunks
      WHERE state_code = ${stateCode}
      ORDER BY embedding <=> ${embeddingStr}::vector
      LIMIT ${config.topK}
    `);

    chunks = (results as unknown as Array<Record<string, unknown>>).map((r) => ({
      id: String(r.id),
      content: String(r.content),
      sectionTitle: r.section_title ? String(r.section_title) : null,
      pageNumber: r.page_number ? Number(r.page_number) : null,
      score: Number(r.score),
    }));
  } else {
    chunks = await retrieveByKeywords(query, config.topK, stateCode);

    if (chunks.length === 0) {
      const queryEmbedding = await embedText(query, config);
      const allChunks = await db
        .select()
        .from(ragChunks)
        .where(eq(ragChunks.stateCode, stateCode))
        .orderBy(desc(ragChunks.createdAt))
        .limit(100);

      chunks = allChunks
        .map((c) => ({
          id: c.id,
          content: c.content,
          sectionTitle: c.sectionTitle,
          pageNumber: c.pageNumber,
          score: c.embedding
            ? cosineSimilarity(queryEmbedding, c.embedding as number[])
            : 0,
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, config.topK);
    }
  }

  return {
    query,
    chunks,
    topK: config.topK,
    latencyMs: Date.now() - start,
    retrievalMode: canUseVectorSearch ? "vector" : "keyword",
    stateCode,
  };
}
