#!/usr/bin/env node
/**
 * Tier 2 production setup: self-hosted Inngest on Railway + OTLP via Langfuse.
 * Generates hex keys, creates inngest service if missing, wires API env vars.
 */
import { randomBytes } from "crypto";
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = "https://api-production-72db.up.railway.app";
const APP_SERVE_URL = `${API_URL}/api/inngest`;

function run(cmd, opts = {}) {
  return spawnSync(cmd, { shell: true, encoding: "utf8", cwd: root, ...opts });
}

function hexKey() {
  return randomBytes(32).toString("hex");
}

function railway(args, service) {
  const svc = service ? `--service ${service}` : "";
  return run(`npx @railway/cli ${args} ${svc}`.trim());
}

function getVar(name, service) {
  const r = railway(`variable list --json`, service);
  if (r.status !== 0) return null;
  try {
    const data = JSON.parse(r.stdout);
    return data[name] ?? null;
  } catch {
    return null;
  }
}

function setVar(key, value, service) {
  const escaped = value.replace(/'/g, "'\\''");
  const r = railway(`variable set '${key}=${escaped}'`, service);
  return r.status === 0;
}

function listServices() {
  const r = run("npx @railway/cli status --json 2>/dev/null");
  if (r.status !== 0) return [];
  try {
    const data = JSON.parse(r.stdout);
    return data.services?.map((s) => s.name) ?? [];
  } catch {
    return [];
  }
}

async function waitForHealth(url, label, max = 30) {
  for (let i = 1; i <= max; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`  ✓ ${label} ready (${url})`);
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

console.log("🚀 Tier 2 — Inngest self-host + OTLP (Langfuse auto)\n");

// --- Keys (reuse if already set on api) ---
let eventKey = getVar("INNGEST_EVENT_KEY", "api");
let signingKey = getVar("INNGEST_SIGNING_KEY", "api");
if (!eventKey || !signingKey) {
  eventKey = hexKey();
  signingKey = hexKey();
  console.log("Generated new Inngest hex keys");
} else {
  console.log("Reusing existing Inngest keys from api service");
}

// --- Ensure inngest service exists ---
let services = listServices();
if (!services.includes("inngest")) {
  console.log("\nCreating Railway service: inngest");
  const add = railway(
    `add --service inngest --image inngest/inngest:v1.12.1 --variables "INNGEST_EVENT_KEY=${eventKey}" --variables "INNGEST_SIGNING_KEY=${signingKey}"`,
  );
  if (add.status !== 0) {
    console.error("Failed to create inngest service:", add.stderr || add.stdout);
    process.exit(1);
  }
  services = listServices();
}

console.log("\nServices:", services.join(", ") || "(unknown)");

// --- Inngest service vars ---
console.log("\nConfiguring inngest service…");
setVar("INNGEST_EVENT_KEY", eventKey, "inngest");
setVar("INNGEST_SIGNING_KEY", signingKey, "inngest");

// --- API service vars ---
console.log("Configuring api service…");
setVar("INNGEST_EVENT_KEY", eventKey, "api");
setVar("INNGEST_SIGNING_KEY", signingKey, "api");
setVar("OTEL_SERVICE_NAME", "wa-drive-api", "api");

// INNGEST_BASE_URL — use public domain once available
let inngestUrl = getVar("RAILWAY_PUBLIC_DOMAIN", "inngest");
if (inngestUrl && !inngestUrl.startsWith("http")) {
  inngestUrl = `https://${inngestUrl}`;
}
if (!inngestUrl || inngestUrl.includes("undefined")) {
  console.log("\nGenerating public domain for inngest…");
  railway("domain --service inngest", "inngest");
  await new Promise((r) => setTimeout(r, 3000));
  const domain = getVar("RAILWAY_PUBLIC_DOMAIN", "inngest");
  inngestUrl = domain ? `https://${domain}` : null;
}

if (inngestUrl) {
  setVar("INNGEST_BASE_URL", inngestUrl, "api");
  console.log(`  INNGEST_BASE_URL → ${inngestUrl}`);
} else {
  console.warn("  ⚠ Could not resolve inngest public URL — set INNGEST_BASE_URL manually");
}

// --- Trigger redeploy ---
console.log("\nRedeploying services…");
railway("up --detach", "api");
railway("up --detach", "inngest");

console.log("\nWaiting for deploys…");
await waitForHealth(`${API_URL}/health`, "API");
if (inngestUrl) {
  await waitForHealth(`${inngestUrl}/`, "Inngest");
}

// --- Sync app with Inngest ---
console.log("\nSyncing Inngest app…");
try {
  const sync = await fetch(`${inngestUrl}/v1/apps/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: APP_SERVE_URL }),
  });
  console.log(`  sync-app → ${sync.status}`);
} catch (e) {
  console.log("  sync via dashboard if needed:", APP_SERVE_URL);
}

// --- Verify observability ---
try {
  const obs = await fetch(`${API_URL}/health/observability`);
  const data = await obs.json();
  console.log("\nObservability:");
  console.log(`  opentelemetry: enabled=${data.opentelemetry?.enabled} backend=${data.opentelemetry?.backend}`);
  console.log(`  inngest: enabled=${data.inngest?.enabled} mode=${data.inngest?.mode}`);
} catch {
  console.log("\nRun: curl", `${API_URL}/health/observability`);
}

console.log("\n✅ Tier 2 setup complete");
console.log(`   Inngest dashboard: ${inngestUrl ?? "(pending domain)"}`);
console.log(`   App serve URL: ${APP_SERVE_URL}`);
