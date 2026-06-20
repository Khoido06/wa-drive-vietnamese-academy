import { logger } from "../middleware/logger.js";

export type JobName = "ingest" | "reembed" | "review-reminders";

export interface JobPayload {
  id: string;
  name: JobName;
  data: Record<string, unknown>;
  createdAt: number;
  status: "pending" | "running" | "done" | "failed";
  error?: string;
}

const queue: JobPayload[] = [];
let processing = false;

export function enqueueJob(name: JobName, data: Record<string, unknown> = {}): JobPayload {
  const job: JobPayload = {
    id: crypto.randomUUID(),
    name,
    data,
    createdAt: Date.now(),
    status: "pending",
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
      try {
        const { runJob } = await import("./handlers.js");
        await runJob(job.name, job.data);
        job.status = "done";
        logger.info("job completed", { id: job.id, name: job.name });
      } catch (err) {
        job.status = "failed";
        job.error = err instanceof Error ? err.message : String(err);
        logger.error("job failed", { id: job.id, name: job.name, error: job.error });
      }
    }
  } finally {
    processing = false;
  }
}

/** Inngest-compatible webhook — accepts { name, data } events */
export async function handleInngestEvent(body: {
  name?: string;
  data?: Record<string, unknown>;
}): Promise<{ ok: boolean; jobId?: string }> {
  const name = body.name as JobName | undefined;
  if (!name || !["ingest", "reembed", "review-reminders"].includes(name)) {
    return { ok: false };
  }
  const job = enqueueJob(name, body.data ?? {});
  return { ok: true, jobId: job.id };
}
