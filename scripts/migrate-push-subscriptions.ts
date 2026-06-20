#!/usr/bin/env node
/** Create push_subscriptions table (Neon-safe SQL). */
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
  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id),
    endpoint text NOT NULL UNIQUE,
    p256dh text NOT NULL,
    auth text NOT NULL,
    created_at timestamp NOT NULL DEFAULT now(),
    updated_at timestamp NOT NULL DEFAULT now()
  )`,
  `CREATE INDEX IF NOT EXISTS push_sub_user_idx ON push_subscriptions (user_id)`,
];

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL required");
    process.exit(1);
  }
  const sql = postgres(process.env.DATABASE_URL, { max: 1 });
  for (const stmt of statements) {
    console.log("→", stmt.slice(0, 70) + "...");
    await sql.unsafe(stmt);
  }
  console.log("✅ push_subscriptions table ready");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
