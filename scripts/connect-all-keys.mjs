#!/usr/bin/env node
/**
 * Sync env vars from .env (+ optional .env.production.local) to Railway + Vercel.
 * Never prints secret values — only key names and status.
 *
 * Usage:
 *   node scripts/connect-all-keys.mjs           # dry-run (check only)
 *   node scripts/connect-all-keys.mjs --apply     # push missing vars
 *   node scripts/connect-all-keys.mjs --merge-local  # fill local .env gaps from .env.production.local
 */
import { readFileSync, writeFileSync, existsSync, appendFileSync } from "fs";
import { execSync, spawnSync } from "child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const apply = process.argv.includes("--apply");
const mergeLocal = process.argv.includes("--merge-local");

const RAILWAY_VARS = [
  "DATABASE_URL",
  "AI_PROVIDER",
  "GROQ_API_KEY",
  "LLM_MODEL",
  "EMBED_MODEL",
  "EMBEDDING_DIMENSIONS",
  "WA_DRIVER_GUIDE_PDF_PATH",
  "CA_DRIVER_GUIDE_PATH",
  "TX_DRIVER_GUIDE_PATH",
  "FL_DRIVER_GUIDE_PATH",
  "MUTATION_ENABLED",
  "MUTATION_INTERVAL_MS",
  "WEB_URL",
  "ADMIN_SECRET",
  "SENTRY_DSN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "LANGFUSE_PUBLIC_KEY",
  "LANGFUSE_SECRET_KEY",
  "LANGFUSE_BASE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_PRICE_PRO",
  "STRIPE_PRICE_FAMILY",
  "STREAM_LLM_VALIDATOR",
  "RAG_AB_ENABLED",
  "RAG_CACHE_TTL_SEC",
  "FREE_TUTOR_DAILY",
  "FREE_PRACTICE_DAILY",
  "DEFAULT_STATE_CODE",
  "EMBED_PROVIDER",
  "OPENAI_API_KEY",
];

const VERCEL_VARS = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_SENTRY_DSN",
  "NEXT_PUBLIC_POSTHOG_KEY",
  "NEXT_PUBLIC_POSTHOG_HOST",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_CLERK_SIGN_IN_URL",
  "NEXT_PUBLIC_CLERK_SIGN_UP_URL",
  "CLERK_SECRET_KEY",
  "ADMIN_SECRET",
];

const DEFAULTS = {
  AI_PROVIDER: "groq",
  LLM_MODEL: "llama-3.1-8b-instant",
  EMBEDDING_DIMENSIONS: "768",
  WA_DRIVER_GUIDE_PDF_PATH: "./docs/driver-guide-vi.pdf",
  CA_DRIVER_GUIDE_PATH: "./docs/states/ca-driver-guide-vi.md",
  TX_DRIVER_GUIDE_PATH: "./docs/states/tx-driver-guide-vi.md",
  FL_DRIVER_GUIDE_PATH: "./docs/states/fl-driver-guide-vi.md",
  MUTATION_ENABLED: "true",
  MUTATION_INTERVAL_MS: "3600000",
  WEB_URL: "https://wa-drive-vietnamese-academy.vercel.app",
  NEXT_PUBLIC_API_URL: "https://api-production-72db.up.railway.app",
  NEXT_PUBLIC_POSTHOG_HOST: "https://us.i.posthog.com",
  NEXT_PUBLIC_CLERK_SIGN_IN_URL: "/sign-in",
  NEXT_PUBLIC_CLERK_SIGN_UP_URL: "/sign-up",
  LANGFUSE_BASE_URL: "https://cloud.langfuse.com",
  STREAM_LLM_VALIDATOR: "true",
  RAG_AB_ENABLED: "false",
  RAG_CACHE_TTL_SEC: "86400",
  FREE_TUTOR_DAILY: "10",
  FREE_PRACTICE_DAILY: "20",
  DEFAULT_STATE_CODE: "WA",
};

function parseEnv(path) {
  if (!existsSync(path)) return {};
  const vars = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
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
    vars[key] = val;
  }
  return vars;
}

function mergeSources() {
  return {
    ...DEFAULTS,
    ...parseEnv(join(root, ".env.example")),
    ...parseEnv(join(root, ".env.production.local")),
    ...parseEnv(join(root, ".env")),
  };
}

function hasValue(v) {
  return v !== undefined && v !== null && String(v).trim() !== "";
}

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, encoding: "utf8", ...opts });
}

function railwayLoggedIn() {
  const r = run("npx @railway/cli whoami 2>/dev/null");
  return r.status === 0 && !r.stdout?.includes("Unauthorized");
}

function vercelLoggedIn() {
  const r = run("npx vercel whoami 2>/dev/null");
  return r.status === 0;
}

function listVercelEnv() {
  const r = run(
    "cd apps/web && npx vercel env ls production 2>/dev/null",
    { cwd: root },
  );
  const keys = new Set();
  for (const line of (r.stdout ?? "").split("\n")) {
    const m = line.match(/^\s+([A-Z0-9_]+)\s+/);
    if (m) keys.add(m[1]);
  }
  return keys;
}

function setRailway(key, value) {
  const escaped = value.replace(/'/g, "'\\''");
  return run(`npx @railway/cli variables set '${key}=${escaped}'`, { cwd: root });
}

function setVercel(key, value, env = "production") {
  return run(
    `cd apps/web && printf '%s' '${value.replace(/'/g, "'\\''")}' | npx vercel env add ${key} ${env} --force 2>&1`,
    { cwd: root },
  );
}

function mergeIntoLocalEnv() {
  const envPath = join(root, ".env");
  const merged = mergeSources();
  const existing = parseEnv(envPath);
  const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split("\n") : [];
  const existingKeys = new Set(Object.keys(existing));
  const added = [];

  for (const [key, val] of Object.entries(merged)) {
    if (!hasValue(val) || existingKeys.has(key)) continue;
    if (
      key.startsWith("VERCEL_") ||
      key === "VERCEL" ||
      key.startsWith("NX_") ||
      key.startsWith("TURBO_")
    )
      continue;
    lines.push(`${key}=${val}`);
    added.push(key);
  }

  if (added.length) {
    writeFileSync(envPath, lines.filter((l, i, a) => !(i === a.length - 1 && l === "")).join("\n") + "\n");
  }
  return added;
}

async function checkProductionApi() {
  try {
    const res = await fetch("https://api-production-72db.up.railway.app/rag/status");
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

console.log("🔑 WA Drive — connect all keys\n");

const merged = mergeSources();
const apiStatus = await checkProductionApi();

if (apiStatus?.ai) {
  console.log("Production API (Railway) — detected services:");
  console.log(`  groq=${apiStatus.ai.groq} sentry=${apiStatus.ai.sentry} langfuse=${apiStatus.ai.langfuse} upstash=${apiStatus.ai.upstash}`);
  console.log(`  chunks=${apiStatus.chunksIndexed} model=${apiStatus.config?.generationModel}\n`);
}

console.log("Local / source files:");
for (const f of [".env", ".env.production.local"]) {
  const p = join(root, f);
  console.log(`  ${f}: ${existsSync(p) ? "✓" : "✗ missing"}`);
}

const missingLocal = [...RAILWAY_VARS, ...VERCEL_VARS].filter((k) => !hasValue(merged[k]));
console.log(`\nKeys without value in .env / .env.production.local: ${missingLocal.length}`);
if (missingLocal.length) {
  for (const k of missingLocal) console.log(`  - ${k}`);
}

console.log("\nRailway CLI:", railwayLoggedIn() ? "✓ logged in" : "✗ run: npx @railway/cli login");
console.log("Vercel CLI:", vercelLoggedIn() ? "✓ logged in" : "✗ run: npx vercel login");

const vercelKeys = listVercelEnv();
const missingVercel = VERCEL_VARS.filter((k) => !vercelKeys.has(k) && hasValue(merged[k]));
console.log(`\nVercel production — configured: ${VERCEL_VARS.filter((k) => vercelKeys.has(k)).length}/${VERCEL_VARS.length}`);
if (missingVercel.length) {
  console.log("  Missing on Vercel (have local value):");
  for (const k of missingVercel) console.log(`    - ${k}`);
}

if (mergeLocal) {
  const added = mergeIntoLocalEnv();
  console.log(`\nMerged into .env: ${added.length ? added.join(", ") : "(nothing new)"}`);
}

if (!apply) {
  console.log("\nDry run. To push vars:");
  console.log("  1. Copy secrets into .env.production.local (gitignored)");
  console.log("  2. npx @railway/cli login && cd repo && railway link");
  console.log("  3. node scripts/connect-all-keys.mjs --apply");
  console.log("\nOptional: --merge-local fills .env gaps from .env.production.local");
  process.exit(0);
}

if (!railwayLoggedIn()) {
  console.error("\n❌ Railway not logged in. Run: npx @railway/cli login");
  process.exit(1);
}

console.log("\nApplying Railway vars...");
for (const key of RAILWAY_VARS) {
  if (!hasValue(merged[key])) continue;
  const r = setRailway(key, merged[key]);
  console.log(`  Railway ${key}: ${r.status === 0 ? "✓" : "✗"}`);
}

if (vercelLoggedIn()) {
  console.log("\nApplying Vercel vars...");
  for (const key of VERCEL_VARS) {
    if (!hasValue(merged[key])) continue;
    if (vercelKeys.has(key)) {
      console.log(`  Vercel ${key}: skip (exists)`);
      continue;
    }
    const r = setVercel(key, merged[key]);
    console.log(`  Vercel ${key}: ${r.status === 0 ? "✓" : "✗"}`);
  }
}

console.log("\n✅ Done. Redeploy:");
console.log("  Railway: auto on variable change");
console.log("  Vercel:  cd apps/web && npx vercel --prod");
