#!/usr/bin/env node
/** Recreate Inngest service cleanly — no GitHub, Dockerfile-only deploy. */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const inngestDir = join(dirname(fileURLToPath(import.meta.url)), "..", "inngest");
const API_SERVE = "https://api-production-72db.up.railway.app/api/inngest";

function run(cmd, cwd = join(inngestDir, "..")) {
  return spawnSync(cmd, { shell: true, encoding: "utf8", cwd });
}

function railway(args, service) {
  const s = service ? `--service ${service}` : "";
  return run(`npx @railway/cli ${args} ${s}`.trim());
}

function getJson(service) {
  const r = railway("variable list --json", service);
  if (r.status !== 0) return {};
  try {
    return JSON.parse(r.stdout);
  } catch {
    return {};
  }
}

console.log("Recreating Inngest service…\n");

const apiVars = getJson("api");
const eventKey = apiVars.INNGEST_EVENT_KEY;
const signingKey = apiVars.INNGEST_SIGNING_KEY;
const baseUrl = apiVars.INNGEST_BASE_URL ?? "https://inngest-production-3645.up.railway.app";

if (!eventKey || !signingKey) {
  console.error("Missing INNGEST keys on api service");
  process.exit(1);
}

console.log("Deleting old inngest service…");
railway("service link inngest");
railway("service delete -y");

console.log("Creating fresh inngest service…");
const add = railway('add --service inngest');
if (add.status !== 0) {
  console.error(add.stderr || add.stdout);
  process.exit(1);
}

railway("service link inngest");
railway(`variable set 'INNGEST_EVENT_KEY=${eventKey}'`, "inngest");
railway(`variable set 'INNGEST_SIGNING_KEY=${signingKey}'`, "inngest");

console.log("Deploying from inngest/Dockerfile via CLI (no GitHub)…");
railway("service source disconnect", "inngest");
const up = run("npx @railway/cli up -d -y", inngestDir);
if (up.status !== 0) console.error(up.stderr || up.stdout);

console.log("Creating domain (port 8288)…");
railway("domain --port 8288", "inngest");
await new Promise((r) => setTimeout(r, 5000));

const inngestVars = getJson("inngest");
const domain = inngestVars.RAILWAY_PUBLIC_DOMAIN;
const inngestUrl = domain ? `https://${domain}` : baseUrl;
railway(`variable set 'INNGEST_BASE_URL=${inngestUrl}'`, "api");
console.log("INNGEST_BASE_URL →", inngestUrl);

console.log("\nWaiting for Inngest server…");
for (let i = 1; i <= 18; i++) {
  const logs = run("npx @railway/cli logs --service inngest 2>&1 | tail -8").stdout ?? "";
  if (logs.includes("inngest start") || logs.includes("service listening")) {
    console.log("✓ Inngest process detected in logs");
    break;
  }
  if (logs.includes("api@0.0.0")) {
    console.warn("⚠ Wrong image (API) — redeploying again…");
    railway("service source disconnect", "inngest");
    run("npx @railway/cli up -d -y", inngestDir);
  }
  try {
    const res = await fetch(inngestUrl);
    if (res.status < 500) {
      console.log(`✓ Inngest HTTP ${res.status}`);
      break;
    }
  } catch {
    /* retry */
  }
  if (i === 18) console.warn("⚠ Check: railway logs --service inngest");
  else await new Promise((r) => setTimeout(r, 10_000));
}

try {
  const sync = await fetch(`${inngestUrl}/v1/apps/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: API_SERVE }),
  });
  console.log("App sync:", sync.status);
} catch {
  console.log("Sync manually:", API_SERVE);
}

console.log("\nDone.");
