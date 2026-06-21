#!/usr/bin/env node
/** Fail CI/build if celebration code is missing from the production bundle. */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const chunksDir = join(repoRoot, "apps/web/.next/static/chunks");
let combined = "";

for (const name of readdirSync(chunksDir)) {
  const path = join(chunksDir, name);
  if (!statSync(path).isFile()) continue;
  combined += readFileSync(path, "utf8");
}

const markers = ["wa_sound_muted", "cheer-mascot"];
const missing = markers.filter((m) => !combined.includes(m));

if (missing.length > 0) {
  console.error("❌ Celebration bundle verification failed. Missing:", missing.join(", "));
  process.exit(1);
}

console.log("✅ Celebration bundle verified (sound + mascot)");
