import type { Context } from "hono";
import { savePushSubscription } from "../jobs/review-reminders.js";
import { enqueueJob, listJobs, handleInngestEvent, scheduleJob } from "../jobs/queue.js";
import { isInngestConfigured, isInngestCloudEmitEnabled, isInngestServeEnabled } from "../jobs/inngest-client.js";
import { isOtelEnabled, getOtelBackend } from "../telemetry/tracing.js";

export async function subscribePush(c: Context) {
  const body = await c.req.json<{ userId?: string; subscription: PushSubscriptionJSON }>();
  if (!body.subscription?.endpoint) {
    return c.json({ error: "Invalid subscription" }, 400);
  }
  savePushSubscription(body.userId ?? null, {
    endpoint: body.subscription.endpoint,
    keys: {
      p256dh: body.subscription.keys?.p256dh ?? "",
      auth: body.subscription.keys?.auth ?? "",
    },
  });
  return c.json({ ok: true });
}

export async function triggerJob(c: Context) {
  const body = await c.req.json<{ name: "ingest" | "reembed" | "review-reminders"; data?: Record<string, unknown> }>();
  if (!body.name) return c.json({ error: "name required" }, 400);
  const result = await scheduleJob(body.name, body.data ?? {});
  return c.json({ ok: true, ...result });
}

export async function jobStatus(c: Context) {
  return c.json({ jobs: listJobs() });
}

/** Inngest-compatible event receiver (POST /jobs/inngest) */
export async function inngestWebhook(c: Context) {
  const body = await c.req.json<{ name?: string; data?: Record<string, unknown> }>();
  const result = await handleInngestEvent(body);
  if (!result.ok) return c.json({ error: "invalid event" }, 400);
  return c.json(result);
}

interface PushSubscriptionJSON {
  endpoint: string;
  keys?: { p256dh?: string; auth?: string };
}

export async function observabilityStatus(c: Context) {
  return c.json({
    sentry: { enabled: !!process.env.SENTRY_DSN, dsn: process.env.SENTRY_DSN ? "set" : "missing" },
    posthog: {
      enabled: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
      key: process.env.NEXT_PUBLIC_POSTHOG_KEY ? "set" : "missing",
    },
    langfuse: {
      enabled: !!(process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY),
    },
    vapid: { enabled: !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) },
    inngest: {
      enabled: isInngestConfigured(),
      serve: isInngestServeEnabled(),
      emit: isInngestCloudEmitEnabled(),
      endpoint: "/api/inngest",
      legacyEndpoint: "/jobs/inngest",
      mode: isInngestConfigured()
        ? "cloud"
        : isInngestServeEnabled() || isInngestCloudEmitEnabled()
          ? "partial"
          : "in-memory-queue",
    },
    opentelemetry: {
      enabled: isOtelEnabled(),
      backend: getOtelBackend(),
      exporter: isOtelEnabled() ? "otlp" : "off",
    },
    tripleCheck: { streamLlmValidator: process.env.STREAM_LLM_VALIDATOR !== "false" },
    jobs: listJobs(5),
  });
}
