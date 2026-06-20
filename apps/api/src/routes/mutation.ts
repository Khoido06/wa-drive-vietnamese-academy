import type { Context } from "hono";
import { getSystemHealth, runMutationCycle } from "@repo/mutation-engine";

export async function mutationStatus(c: Context) {
  try {
    const health = await getSystemHealth();
    return c.json(health);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get status";
    return c.json({ error: message, status: "unknown" }, 500);
  }
}

export async function runMutations(c: Context) {
  if (process.env.MUTATION_ENABLED === "false") {
    return c.json({ error: "Mutation engine disabled" }, 403);
  }

  try {
    const result = await runMutationCycle();
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mutation cycle failed";
    return c.json({ error: message }, 500);
  }
}
