#!/usr/bin/env node
/**
 * Grant Pro/Family tier to a user (unlimited AI + practice).
 * Run: pnpm grant:premium -- "Cô Lan"
 *   or: pnpm grant:premium -- --id USER_UUID
 *   or: pnpm grant:premium -- --all-matching "Mẹ"
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ilike, eq } from "drizzle-orm";
import { getDb, users } from "@repo/db";
import { setUserSubscription } from "@repo/learning-engine";

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

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL required");
    process.exit(1);
  }

  const args = process.argv.slice(2).filter((a) => a !== "--");
  const tier = (process.env.GRANT_TIER ?? "family") as "pro" | "family";
  const db = getDb();

  if (args[0] === "--id" && args[1]) {
    await setUserSubscription(args[1], tier);
    console.log(`✅ Granted ${tier} to user ${args[1]}`);
    return;
  }

  if (args[0] === "--all-matching" && args[1]) {
    const pattern = `%${args[1]}%`;
    const rows = await db.select().from(users).where(ilike(users.displayName, pattern));
    if (rows.length === 0) {
      console.log(`No users matching "${args[1]}"`);
      return;
    }
    for (const u of rows) {
      await setUserSubscription(u.id, tier);
      console.log(`✅ ${u.displayName} (${u.id}) → ${tier}`);
    }
    return;
  }

  const name = args.join(" ").trim();
  if (!name) {
    console.log(`Usage:
  pnpm grant:premium -- "Cô Lan"
  pnpm grant:premium -- --id USER_UUID
  pnpm grant:premium -- --all-matching "Mẹ"`);
    process.exit(1);
  }

  const [exact] = await db.select().from(users).where(eq(users.displayName, name)).limit(1);
  if (exact) {
    await setUserSubscription(exact.id, tier);
    console.log(`✅ Granted ${tier} to "${exact.displayName}" (${exact.id})`);
    return;
  }

  const pattern = `%${name}%`;
  const fuzzy = await db.select().from(users).where(ilike(users.displayName, pattern)).limit(5);
  if (fuzzy.length === 1) {
    await setUserSubscription(fuzzy[0]!.id, tier);
    console.log(`✅ Granted ${tier} to "${fuzzy[0]!.displayName}" (${fuzzy[0]!.id})`);
    return;
  }

  if (fuzzy.length > 1) {
    console.log("Multiple matches — use --id:");
    fuzzy.forEach((u) => console.log(`  ${u.id}  ${u.displayName}`));
    process.exit(1);
  }

  console.log(`No user found for "${name}". Mom must open the app once first.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
