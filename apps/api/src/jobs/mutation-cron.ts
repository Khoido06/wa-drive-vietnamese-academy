import { runMutationCycle } from "@repo/mutation-engine";
import { logger } from "../middleware/logger.js";

let running = false;

export function startMutationCron() {
  if (process.env.MUTATION_ENABLED !== "true") return;

  const intervalMs = Number(process.env.MUTATION_INTERVAL_MS ?? 3_600_000);
  logger.info("mutation cron started", { intervalMs });

  setInterval(async () => {
    if (running) return;
    running = true;
    try {
      const result = await runMutationCycle();
      logger.info("mutation cycle complete", {
        proposals: result.proposals.length,
        applied: result.applied,
      });
    } catch (err) {
      logger.error("mutation cycle failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      running = false;
    }
  }, intervalMs).unref();
}
