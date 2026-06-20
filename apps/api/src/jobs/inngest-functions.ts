import { inngest } from "./inngest-client.js";
import { runJob } from "./handlers.js";

const jobFn = (
  id: string,
  name: string,
  event: "wa/ingest" | "wa/reembed" | "wa/review-reminders",
  jobName: "ingest" | "reembed" | "review-reminders",
) =>
  inngest.createFunction({ id, name }, { event }, async ({ event, step }) => {
    await step.run(jobName, () => runJob(jobName, (event.data ?? {}) as Record<string, unknown>));
    return { ok: true, job: jobName };
  });

export const waIngestJob = jobFn("wa-ingest", "WA PDF ingest", "wa/ingest", "ingest");
export const waReembedJob = jobFn("wa-reembed", "WA re-embed chunks", "wa/reembed", "reembed");
export const waReviewRemindersJob = jobFn(
  "wa-review-reminders",
  "SM-2 review push reminders",
  "wa/review-reminders",
  "review-reminders",
);

/** Daily review reminders at 7am PT (15:00 UTC) */
export const waReviewRemindersCron = inngest.createFunction(
  { id: "wa-review-reminders-cron", name: "Daily review reminders" },
  { cron: "0 15 * * *" },
  async ({ step }) => {
    await step.run("review-reminders", () => runJob("review-reminders", {}));
    return { ok: true };
  },
);

export const inngestFunctions = [
  waIngestJob,
  waReembedJob,
  waReviewRemindersJob,
  waReviewRemindersCron,
];
