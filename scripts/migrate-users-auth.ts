#!/usr/bin/env node
/** Add Clerk/auth/billing columns to users table (Neon-safe SQL). */
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
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS clerk_id text`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_clerk_id_unique ON users (clerk_id) WHERE clerk_id IS NOT NULL`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier text DEFAULT 'free'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_state text DEFAULT 'WA'`,
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamp DEFAULT now()`,
  `UPDATE users SET subscription_tier = 'free' WHERE subscription_tier IS NULL`,
  `UPDATE users SET selected_state = 'WA' WHERE selected_state IS NULL`,
  `UPDATE users SET updated_at = created_at WHERE updated_at IS NULL`,
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
  console.log("✅ Users auth schema applied (clerk_id, stripe, subscription_tier)");
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
