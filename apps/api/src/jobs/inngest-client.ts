import { Inngest } from "inngest";
import { logger } from "../middleware/logger.js";

export type InngestJobEvent = "wa/ingest" | "wa/reembed" | "wa/review-reminders";

const EVENT_MAP: Record<InngestJobEvent, "ingest" | "reembed" | "review-reminders"> = {
  "wa/ingest": "ingest",
  "wa/reembed": "reembed",
  "wa/review-reminders": "review-reminders",
};

/** Shared client — used by serve() and optional cloud event emit. */
export const inngest = new Inngest({
  id: "wa-drive-vietnamese-academy",
  eventKey: process.env.INNGEST_EVENT_KEY,
});

export function isInngestCloudEmitEnabled(): boolean {
  return Boolean(process.env.INNGEST_EVENT_KEY?.trim());
}

export function isInngestServeEnabled(): boolean {
  return Boolean(process.env.INNGEST_SIGNING_KEY?.trim());
}

export function isInngestConfigured(): boolean {
  return isInngestCloudEmitEnabled() && isInngestServeEnabled();
}

/** Push job to Inngest Cloud when configured; returns true if sent. */
export async function emitInngestJob(
  name: "ingest" | "reembed" | "review-reminders",
  data: Record<string, unknown> = {},
): Promise<boolean> {
  if (!isInngestCloudEmitEnabled()) return false;

  const eventName = `wa/${name}` as InngestJobEvent;
  await inngest.send({ name: eventName, data });
  logger.info("inngest event sent", { name: eventName });
  return true;
}

export function inngestEventToJobName(event: string): "ingest" | "reembed" | "review-reminders" | null {
  return EVENT_MAP[event as InngestJobEvent] ?? null;
}
