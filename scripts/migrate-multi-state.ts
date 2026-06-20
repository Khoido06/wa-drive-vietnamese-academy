#!/usr/bin/env node
/**
 * Apply multi-state schema to Neon (non-interactive SQL).
 * Run: node --import tsx scripts/migrate-multi-state.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

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
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadDotEnv();

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

const statements = [
  `ALTER TABLE rag_chunks ADD COLUMN IF NOT EXISTS state_code text DEFAULT 'WA'`,
  `UPDATE rag_chunks SET state_code = 'WA' WHERE state_code IS NULL OR state_code = ''`,
  `CREATE INDEX IF NOT EXISTS rag_chunks_state_idx ON rag_chunks (state_code)`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_state text DEFAULT 'WA'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free'`,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL required");
    process.exit(1);
  }
  for (const stmt of statements) {
    console.log("→", stmt.slice(0, 60) + "...");
    await sql.unsafe(stmt);
  }
  console.log("✅ Multi-state schema applied");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
