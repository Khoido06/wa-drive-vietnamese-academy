import { logger } from "../middleware/logger.js";
import { emitInngestJob, inngestEventToJobName, isInngestCloudEmitEnabled } from "./inngest-client.js";

export type JobName = "ingest" | "reembed" | "review-reminders";

export interface JobPayload {
  id: string;
  name: JobName;
  data: Record<string, unknown>;
  createdAt: number;
  status: "pending" | "running" | "done" | "failed";
  error?: string;
  attempts?: number;
}

const MAX_ATTEMPTS = 3;

const queue: JobPayload[] = [];
let processing = false;

export function enqueueJob(name: JobName, data: Record<string, unknown> = {}): JobPayload {
  const job: JobPayload = {
    id: crypto.randomUUID(),
    name,
    data,
    createdAt: Date.now(),
    status: "pending",
    attempts: 0,
  };
  queue.push(job);
  logger.info("job enqueued", { id: job.id, name });
  void drainQueue();
  return job;
}

export function listJobs(limit = 20): JobPayload[] {
  return [...queue].reverse().slice(0, limit);
}

export async function drainQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    while (true) {
      const job = queue.find((j) => j.status === "pending");
      if (!job) break;
      job.status = "running";
      job.attempts = (job.attempts ?? 0) + 1;
      try {
        const { runJob } = await import("./handlers.js");
        await runJob(job.name, job.data);
        job.status = "done";
        logger.info("job completed", { id: job.id, name: job.name });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if ((job.attempts ?? 0) < MAX_ATTEMPTS) {
          job.status = "pending";
          job.error = `retry ${job.attempts}/${MAX_ATTEMPTS}: ${message}`;
          logger.warn("job retry scheduled", { id: job.id, name: job.name, attempts: job.attempts });
        } else {
          job.status = "failed";
          job.error = message;
          logger.error("job failed", { id: job.id, name: job.name, error: job.error });
        }
      }
    }
  } finally {
    processing = false;
  }
}

/** Inngest-compatible webhook — accepts { name, data } events (ingest or wa/ingest) */
export async function handleInngestEvent(body: {
  name?: string;
  data?: Record<string, unknown>;
}): Promise<{ ok: boolean; jobId?: string }> {
  const raw = body.name ?? "";
  const name = inngestEventToJobName(raw) ?? (raw as JobName);
  if (!name || !["ingest", "reembed", "review-reminders"].includes(name)) {
    return { ok: false };
  }
  const job = enqueueJob(name, body.data ?? {});
  return { ok: true, jobId: job.id };
}

/** Prefer Inngest when configured; fall back to in-process queue on send failure. */
export async function scheduleJob(
  name: JobName,
  data: Record<string, unknown> = {},
): Promise<{ mode: "inngest" | "local"; jobId?: string }> {
  if (isInngestCloudEmitEnabled()) {
    try {
      const sent = await emitInngestJob(name, data);
      if (sent) return { mode: "inngest" };
    } catch (err) {
      logger.warn("inngest emit failed — using local queue", {
        name,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
  const job = enqueueJob(name, data);
  return { mode: "local", jobId: job.id };
}
