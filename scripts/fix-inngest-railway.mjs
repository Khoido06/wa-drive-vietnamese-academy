#!/usr/bin/env node
/**
 * Fix Inngest Railway service — connect GitHub with inngest/railway.toml config.
 * Run from repo root after pushing inngest/railway.toml fix.
 */
import { spawnSync } from "child_process";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const INNGEST_URL = "https://inngest-production-3645.up.railway.app";
const APP_SERVE = "https://api-production-72db.up.railway.app/api/inngest";

function run(cmd) {
  return spawnSync(cmd, { shell: true, encoding: "utf8", cwd: root });
}

function railway(args, service = "inngest") {
  return run(`npx @railway/cli ${args} --service ${service}`.trim());
}

console.log("Fixing Inngest service deploy config…\n");

// Railway reads this env to pick config file (per monorepo docs / community)
railway('variable set "RAILWAY_CONFIG_FILE=inngest/railway.toml"');
railway("variable delete RAILWAY_START_COMMAND").status; // Dockerfile CMD is enough
railway("variable delete RAILWAY_DOCKERFILE_PATH").status;

console.log("Connecting GitHub repo with inngest/railway.toml…");
const connect = railway(
  'service source connect --repo Khoido06/wa-drive-vietnamese-academy --branch main',
);
if (connect.status !== 0) {
  console.warn("Connect output:", connect.stdout || connect.stderr);
}

console.log("Ensuring domain port 8288…");
railway("domain update d7790332-8c62-4103-a4ac-335c204d26ab --port 8288");

console.log("Redeploying from GitHub…");
railway("redeploy -y --from-source");

console.log("\nWaiting for Inngest…");
for (let i = 1; i <= 24; i++) {
  try {
    const res = await fetch(INNGEST_URL, { method: "GET" });
    if (res.status < 500) {
      console.log(`✓ Inngest responding (${res.status}) after ${i * 10}s`);
      break;
    }
  } catch {
    /* retry */
  }
  if (i === 24) console.warn("⚠ Inngest still not responding — check Railway logs");
  else await new Promise((r) => setTimeout(r, 10_000));
}

console.log("\nSync app URL:", APP_SERVE);
try {
  const sync = await fetch(`${INNGEST_URL}/v1/apps/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: APP_SERVE }),
  });
  console.log("Sync status:", sync.status);
} catch (e) {
  console.log("Sync manually in Inngest UI if needed");
}

console.log("\nDone. Dashboard:", INNGEST_URL);
