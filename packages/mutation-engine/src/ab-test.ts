import { eq } from "drizzle-orm";
import { getDb, systemConfig } from "@repo/db";
import { DEFAULT_RAG_CONFIG, type RagConfig } from "@repo/ai-core";
import { getCurrentRagConfig } from "./analytics.js";

export interface RagAbTestConfig {
  enabled: boolean;
  variantA: { topK: number; label: string };
  variantB: { topK: number; label: string };
  winner?: string | null;
}

const DEFAULT_AB: RagAbTestConfig = {
  enabled: process.env.RAG_AB_ENABLED === "true",
  variantA: { topK: 3, label: "A-tight" },
  variantB: { topK: 7, label: "B-wide" },
  winner: null,
};

export async function getAbTestConfig(): Promise<RagAbTestConfig> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(systemConfig)
    .where(eq(systemConfig.key, "rag_ab_test"))
    .limit(1);

  if (row?.value) return { ...DEFAULT_AB, ...row.value } as RagAbTestConfig;
  return DEFAULT_AB;
}

function pickVariant(seed: string, ab: RagAbTestConfig): "A" | "B" {
  if (ab.winner === "A" || ab.winner === ab.variantA.label) return "A";
  if (ab.winner === "B" || ab.winner === ab.variantB.label) return "B";
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash + seed.charCodeAt(i)) % 2;
  return hash === 0 ? "A" : "B";
}

/** Merge base RAG config with optional A/B topK variant */
export async function resolveRagConfig(opts?: {
  stateCode?: string;
  userId?: string;
  query?: string;
}): Promise<RagConfig> {
  const base = await getCurrentRagConfig();
  const config: RagConfig = {
    ...base,
    stateCode: opts?.stateCode ?? base.stateCode ?? "WA",
  };

  const ab = await getAbTestConfig();
  if (!ab.enabled) return config;

  const seed = opts?.userId ?? opts?.query ?? "anonymous";
  const variant = pickVariant(seed, ab);
  const picked = variant === "A" ? ab.variantA : ab.variantB;

  return {
    ...config,
    topK: picked.topK,
    abVariant: picked.label,
  };
}

export async function saveAbTestWinner(winnerLabel: string) {
  const ab = await getAbTestConfig();
  const db = getDb();
  await db
    .insert(systemConfig)
    .values({
      key: "rag_ab_test",
      value: { ...ab, winner: winnerLabel, enabled: false } as unknown as Record<string, unknown>,
    })
    .onConflictDoUpdate({
      target: systemConfig.key,
      set: {
        value: { ...ab, winner: winnerLabel, enabled: false } as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      },
    });
}
