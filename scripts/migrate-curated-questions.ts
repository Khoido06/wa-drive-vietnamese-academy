#!/usr/bin/env node
/** Add curated question columns to questions table (Neon-safe SQL). */
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

const statements = [
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS external_id text UNIQUE`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS state_code text DEFAULT 'WA'`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_set_id text`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_number integer`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS is_curated boolean DEFAULT false`,
  `ALTER TABLE questions ADD COLUMN IF NOT EXISTS source_ref text`,
  `UPDATE questions SET state_code = 'WA' WHERE state_code IS NULL`,
  `UPDATE questions SET is_curated = false WHERE is_curated IS NULL`,
  `CREATE INDEX IF NOT EXISTS questions_state_set_idx ON questions (state_code, exam_set_id)`,
  `CREATE INDEX IF NOT EXISTS questions_curated_idx ON questions (is_curated)`,
];

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { max: 1 });
  for (const stmt of statements) {
    console.log("→", stmt.slice(0, 70) + "...");
    await sql.unsafe(stmt);
  }
  console.log("✅ Curated questions schema applied");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
