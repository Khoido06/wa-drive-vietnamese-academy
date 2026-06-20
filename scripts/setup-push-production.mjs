#!/usr/bin/env node
/**
 * Web Push production setup: VAPID keys → Railway API + Vercel Web + DB migration.
 *
 * Usage:
 *   node scripts/setup-push-production.mjs
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = "https://api-production-72db.up.railway.app";
const WEB_URL = "https://wa-drive-vietnamese-academy.vercel.app";

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, encoding: "utf8", cwd: root, ...opts });
}

function railway(args, service = "api") {
  return run(`npx @railway/cli ${args} --service ${service}`.trim());
}

function getVar(name, service = "api") {
  const r = railway(`variable list --json`, service);
  if (r.status !== 0) return null;
  try {
    return JSON.parse(r.stdout)[name] ?? null;
  } catch {
    return null;
  }
}

function setVar(key, value, service = "api") {
  const escaped = value.replace(/'/g, "'\\''");
  return railway(`variable set '${key}=${escaped}'`, service).status === 0;
}

function generateVapidKeys() {
  const r = run("cd apps/api && npx web-push generate-vapid-keys");
  if (r.status !== 0) throw new Error("Failed to generate VAPID keys");
  const pub = r.stdout.match(/Public Key:\n(.+)/)?.[1]?.trim();
  const priv = r.stdout.match(/Private Key:\n(.+)/)?.[1]?.trim();
  if (!pub || !priv) throw new Error("Could not parse VAPID keys");
  return { publicKey: pub, privateKey: priv };
}

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

function saveLocalEnv(publicKey, privateKey) {
  const envPath = join(root, ".env.production.local");
  const existing = parseEnv(envPath);
  const lines = existsSync(envPath) ? readFileSync(envPath, "utf8").split("\n") : [];
  const updates = {
    VAPID_PUBLIC_KEY: publicKey,
    VAPID_PRIVATE_KEY: privateKey,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: publicKey,
    REVIEW_REMINDER_ENABLED: "true",
  };
  for (const [key, val] of Object.entries(updates)) {
    if (existing[key]) continue;
    lines.push(`${key}=${val}`);
  }
  if (lines.length) {
    writeFileSync(envPath, lines.filter(Boolean).join("\n") + "\n");
    console.log("  Saved keys to .env.production.local (gitignored)");
  }
}

function setVercelEnv(key, value) {
  const escaped = value.replace(/'/g, "'\\''");
  return run(
    `cd apps/web && printf '%s' '${escaped}' | npx vercel env add ${key} production --force 2>&1`,
  );
}

async function waitForHealth(url, label, max = 24) {
  for (let i = 1; i <= max; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`  ✓ ${label}`);
        return true;
      }
    } catch {
      /* retry */
    }
    console.log(`  … waiting ${label} (${i}/${max})`);
    await new Promise((r) => setTimeout(r, 10_000));
  }
  return false;
}

console.log("🔔 Web Push — VAPID + production setup\n");

const whoami = run("npx @railway/cli whoami 2>&1");
if (whoami.status !== 0) {
  console.error("❌ Railway not logged in. Run: npx @railway/cli login");
  process.exit(1);
}

let publicKey = getVar("VAPID_PUBLIC_KEY") ?? parseEnv(join(root, ".env.production.local")).VAPID_PUBLIC_KEY;
let privateKey = getVar("VAPID_PRIVATE_KEY") ?? parseEnv(join(root, ".env.production.local")).VAPID_PRIVATE_KEY;

if (!publicKey || !privateKey) {
  console.log("Generating new VAPID keys…");
  ({ publicKey, privateKey } = generateVapidKeys());
} else {
  console.log("Reusing existing VAPID keys");
}

console.log("\nConfiguring Railway API…");
setVar("VAPID_PUBLIC_KEY", publicKey);
setVar("VAPID_PRIVATE_KEY", privateKey);
setVar("REVIEW_REMINDER_ENABLED", "true");

saveLocalEnv(publicKey, privateKey);

console.log("\nRunning DB migration (push_subscriptions)…");
const localEnv = {
  ...process.env,
  ...parseEnv(join(root, ".env")),
  ...parseEnv(join(root, ".env.production.local")),
};
let migrate = run("node --import tsx scripts/migrate-push-subscriptions.ts", { env: localEnv });
if (migrate.status !== 0) {
  console.log("  Local migration skipped — trying railway run…");
  migrate = run(
    "npx @railway/cli run --service api node --import tsx scripts/migrate-push-subscriptions.ts",
  );
}
if (migrate.status !== 0) {
  console.log("  Migration deferred — API auto-creates table on startup (bootstrap)");
} else {
  console.log("  ✓ push_subscriptions table ready");
}

console.log("\nRedeploying API…");
railway("up --detach");

const vercelWho = run("npx vercel whoami 2>&1");
if (vercelWho.status === 0) {
  console.log("\nConfiguring Vercel…");
  const r = setVercelEnv("NEXT_PUBLIC_VAPID_PUBLIC_KEY", publicKey);
  console.log(`  NEXT_PUBLIC_VAPID_PUBLIC_KEY: ${r.status === 0 ? "✓" : "✗"}`);
  console.log("\nDeploying Vercel production…");
  run("npx vercel --prod --yes");
} else {
  console.warn("\n⚠ Vercel not logged in — set manually:");
  console.warn(`  NEXT_PUBLIC_VAPID_PUBLIC_KEY=${publicKey}`);
  console.warn("  Then: cd apps/web && npx vercel --prod");
}

console.log("\nWaiting for API…");
await waitForHealth(`${API_URL}/health`, "API");

try {
  const obs = await fetch(`${API_URL}/health/observability`);
  const data = await obs.json();
  console.log(`\nObservability: vapid=${data.vapid?.enabled} inngest=${data.inngest?.enabled}`);
} catch {
  /* ignore */
}

console.log("\n✅ Web Push setup complete");
console.log(`   Web: ${WEB_URL}`);
console.log(`   Mom: mở app → bấm "Bật nhắc" → Allow notification`);
console.log(`   Test: curl -X POST ${API_URL}/jobs/run -H 'Content-Type: application/json' -d '{"name":"review-reminders"}'`);
