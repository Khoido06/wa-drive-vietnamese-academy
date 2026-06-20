#!/usr/bin/env node
/**
 * Seed 150 curated WA DMV questions (3 sets × 50) into Postgres.
 * Run: pnpm seed:wa-exams
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { seedWaExamQuestions, getCuratedQuestionCount } from "@repo/learning-engine";

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

  console.log("📋 Seeding WA curated exam questions (3 × 50)...");
  const { inserted, updated } = await seedWaExamQuestions();
  const total = await getCuratedQuestionCount("WA");
  console.log(`✅ Done — inserted: ${inserted}, updated: ${updated}, total WA curated: ${total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
