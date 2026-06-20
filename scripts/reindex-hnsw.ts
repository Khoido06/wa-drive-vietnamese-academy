#!/usr/bin/env node
/**
 * Re-embed rag_chunks with OpenAI and create pgvector HNSW index.
 * Requires: DATABASE_URL, OPENAI_API_KEY, EMBED_PROVIDER=openai
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { sql, eq } from "drizzle-orm";
import { getDb, ragChunks } from "@repo/db";
import { embedText, DEFAULT_RAG_CONFIG } from "@repo/ai-core";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function loadDotEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv();

async function ensureHnswIndex(db: ReturnType<typeof getDb>) {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS rag_chunks_embedding_hnsw_idx
    ON rag_chunks USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64)
  `);
  console.log("✅ HNSW index ensured on rag_chunks.embedding");
}

async function reembedAll() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL required");
    process.exit(1);
  }
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ OPENAI_API_KEY required for re-embed");
    process.exit(1);
  }
  process.env.EMBED_PROVIDER = process.env.EMBED_PROVIDER ?? "openai";

  const db = getDb();
  const rows = await db.select({ id: ragChunks.id, content: ragChunks.content }).from(ragChunks);

  console.log(`Re-embedding ${rows.length} chunks...`);
  let done = 0;
  for (const row of rows) {
    const embedding = await embedText(row.content, DEFAULT_RAG_CONFIG);
    await db.update(ragChunks).set({ embedding }).where(eq(ragChunks.id, row.id));
    done++;
    if (done % 20 === 0) console.log(`  ${done}/${rows.length}`);
  }
  console.log(`✅ Re-embedded ${done} chunks`);

  await ensureHnswIndex(db);
}

reembedAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
