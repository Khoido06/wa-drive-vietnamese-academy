#!/usr/bin/env node
/** Deploy Inngest from isolated temp dir — avoids monorepo picking up apps/api Dockerfile. */
import { copyFileSync, mkdtempSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const inngestDir = join(root, "inngest");
const API_SERVE = "https://api-production-72db.up.railway.app/api/inngest";

function run(cmd, cwd = root) {
  return spawnSync(cmd, { shell: true, encoding: "utf8", cwd });
}

function getDomain() {
  const r = run("npx @railway/cli variable list --json --service inngest", root);
  try {
    const v = JSON.parse(r.stdout);
    return v.RAILWAY_PUBLIC_DOMAIN ? `https://${v.RAILWAY_PUBLIC_DOMAIN}` : null;
  } catch {
    return null;
  }
}

console.log("Deploy Inngest (isolated temp dir, no GitHub)…\n");

const tmp = mkdtempSync(join(tmpdir(), "wa-inngest-"));
copyFileSync(join(inngestDir, "Dockerfile"), join(tmp, "Dockerfile"));
copyFileSync(join(inngestDir, "railway.toml"), join(tmp, "railway.toml"));

run("npx @railway/cli link -p remarkable-delight -e production -s inngest", tmp);
run("npx @railway/cli service source disconnect", tmp);
const up = run("npx @railway/cli up -d -y", tmp);
rmSync(tmp, { recursive: true, force: true });

if (up.status !== 0) {
  console.error(up.stderr || up.stdout);
  process.exit(1);
}

const inngestUrl = getDomain() ?? "https://inngest-production-56cc.up.railway.app";
run(`npx @railway/cli variable set 'INNGEST_BASE_URL=${inngestUrl}' --service api`, root);
console.log("INNGEST_BASE_URL →", inngestUrl);

console.log("\nWaiting for Inngest server…");
for (let i = 1; i <= 18; i++) {
  const logs = run("npx @railway/cli logs --service inngest 2>&1 | tail -6", root).stdout ?? "";
  if (logs.includes("0.0.0.0:8288") || logs.includes("starting server")) {
    console.log("✓ Inngest listening on 8288");
    break;
  }
  if (logs.includes("api@0.0.0")) console.warn("⚠ Wrong image (API) — run again");
  try {
    const res = await fetch(inngestUrl);
    if (res.status === 200) {
      console.log("✓ Dashboard HTTP 200");
      break;
    }
  } catch {
    /* retry */
  }
  if (i === 18) {
    console.error("Deploy may have failed — check Railway logs");
    process.exit(1);
  }
  await new Promise((r) => setTimeout(r, 10_000));
}

console.log("\nDashboard:", inngestUrl);
console.log("App sync URL:", API_SERVE);
console.log("Done.");
