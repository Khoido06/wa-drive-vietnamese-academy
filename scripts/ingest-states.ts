#!/usr/bin/env node
/**
 * Ingest WA/CA/TX/FL driver guides into rag_chunks.
 *
 * Usage:
 *   node --import tsx scripts/ingest-states.ts              # CA, TX, FL only
 *   node --import tsx scripts/ingest-states.ts --all          # include WA PDF
 *   node --import tsx scripts/ingest-states.ts --state CA   # single state
 *
 * Requires DATABASE_URL and embed provider (Ollama local or mock for keyword RAG).
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ingestDocument,
  getAvailableStates,
  STATE_CODES,
  resolveStateDocumentPath,
  type StateCode,
} from "@repo/ai-core";

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
process.env.PROJECT_ROOT ??= root;

const args = process.argv.slice(2);
const all = args.includes("--all");
const stateArg = args.find((a) => a.startsWith("--state="))?.split("=")[1]?.toUpperCase();

const targets: StateCode[] = stateArg
  ? [stateArg as StateCode]
  : all
    ? [...STATE_CODES]
    : (["CA", "TX", "FL"] as StateCode[]);

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL required");
    process.exit(1);
  }

  console.log("📚 Ingesting states:", targets.join(", "));
  console.log("   AI_PROVIDER:", process.env.AI_PROVIDER ?? "ollama (default)");

  for (const state of targets) {
    const path = resolveStateDocumentPath(state);
    const abs = resolve(root, path.replace(/^\.\//, ""));
    if (!existsSync(abs)) {
      console.error(`❌ ${state}: file not found — ${abs}`);
      continue;
    }

    console.log(`\n→ ${state}: ${path}`);
    const result = await ingestDocument(path, undefined, {
      stateCode: state,
      replace: true,
    });
    console.log(`  ✓ ${result.chunksCreated} chunks (${result.sourceDocument})`);
  }

  const states = await getAvailableStates();
  console.log("\n📊 RAG corpus by state:");
  for (const s of states) {
    console.log(`   ${s.code}: ${s.chunks} chunks`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
