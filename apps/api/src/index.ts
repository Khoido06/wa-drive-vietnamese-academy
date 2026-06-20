import "./instrument.js";

import { serve as serveHttp } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { optionalClerkAuth } from "./middleware/clerk-auth.js";
import { queryRag, ingestPdf, ragStatus, ragStates } from "./routes/rag.js";
import {
  createUser,
  linkUser,
  nextQuestion,
  submitAttempt,
  userProgress,
  postTelemetry,
  setUserState,
  examSets,
  startExam,
  studyStatsGet,
  studyStatsActivity,
  studyStatsSync,
} from "./routes/learning.js";
import { mutationStatus, runMutations } from "./routes/mutation.js";
import { queryRagStream } from "./routes/rag-stream.js";
import { openApiDocs, openApiJson } from "./routes/docs.js";
import { adminAuth, adminOverview, adminTraces, adminMutations, adminOrganizations, adminCreateOrganization } from "./routes/admin.js";
import {
  billingStatus,
  createCheckout,
  createPortal,
  stripeWebhook,
} from "./routes/billing.js";
import { b2bRagStream, b2bHealth } from "./routes/b2b.js";
import { orgApiKeyAuth, orgRateLimit } from "./middleware/org-api-key.js";
import {
  postRagFeedback,
  createInvite,
  acceptInvite,
  sharedProgress,
  familyLinks,
} from "./routes/family.js";
import { createRateLimit } from "./middleware/rate-limit-upstash.js";
import { logger, requestLogger } from "./middleware/logger.js";
import { startMutationCron } from "./jobs/mutation-cron.js";
import { startReviewReminderCron } from "./jobs/review-reminders.js";
import {
  subscribePush,
  triggerJob,
  jobStatus,
  inngestWebhook,
  observabilityStatus,
} from "./routes/notifications.js";
import { serve as inngestServeHandler } from "inngest/hono";
import { inngest } from "./jobs/inngest-client.js";
import { inngestFunctions } from "./jobs/inngest-functions.js";
import { ensurePushSubscriptionsTable, ensureStudyStatsColumns } from "./db/bootstrap.js";

const inngestServe = inngestServeHandler({ client: inngest, functions: inngestFunctions });

const app = new Hono();

app.onError((err, c) => {
  logger.error("unhandled error", { error: err.message, path: c.req.path });
  if (process.env.SENTRY_DSN) {
    import("@sentry/node").then(({ captureException }) => captureException(err));
  }
  return c.json({ error: "Internal server error" }, 500);
});

app.use("*", cors());
app.use("*", requestLogger());
app.use("*", optionalClerkAuth);

const ragRateLimit = createRateLimit({ windowMs: 60_000, max: 20, keyPrefix: "rag" });

app.get("/health", (c) =>
  c.json({ status: "ok", system: "wa-drive-vietnamese-academy", version: "0.7.1" }),
);

app.get("/health/observability", observabilityStatus);

app.get("/openapi.json", openApiJson);
app.get("/docs", openApiDocs);

app.post("/rag/query", ragRateLimit, queryRag);
app.post("/rag/query/stream", ragRateLimit, queryRagStream);
app.post("/rag/ingest", ingestPdf);
app.get("/rag/status", ragStatus);
app.get("/rag/states", ragStates);

app.post("/users", createUser);
app.post("/users/link", linkUser);
app.post("/users/:userId/state", setUserState);
app.get("/billing/status/:userId", billingStatus);
app.post("/billing/checkout", createCheckout);
app.post("/billing/portal", createPortal);
app.post("/billing/webhook", stripeWebhook);
app.get("/learning/exam-sets", examSets);
app.get("/learning/:userId/exam/start", startExam);
app.get("/learning/:userId/next", nextQuestion);
app.post("/learning/attempt", submitAttempt);
app.get("/learning/:userId/progress", userProgress);
app.get("/learning/:userId/study-stats", studyStatsGet);
app.post("/learning/:userId/study-stats/activity", studyStatsActivity);
app.post("/learning/:userId/study-stats/sync", studyStatsSync);
app.post("/telemetry", postTelemetry);
app.post("/rag/feedback", postRagFeedback);

app.post("/family/invite", createInvite);
app.post("/family/accept", acceptInvite);
app.get("/family/shared/:token", sharedProgress);
app.get("/family/:userId/links", familyLinks);

const b2bAuth = orgApiKeyAuth();
app.get("/b2b/health", b2bAuth, b2bHealth);
app.post("/b2b/v1/rag/query/stream", b2bAuth, orgRateLimit, b2bRagStream);

app.get("/mutation/status", mutationStatus);
app.post("/mutation/run", runMutations);

const admin = adminAuth();
app.get("/admin/overview", admin, adminOverview);
app.get("/admin/traces", admin, adminTraces);
app.get("/admin/mutations", admin, adminMutations);
app.get("/admin/organizations", admin, adminOrganizations);
app.post("/admin/organizations", admin, adminCreateOrganization);

app.post("/notifications/subscribe", subscribePush);
app.post("/jobs/run", triggerJob);
app.get("/jobs/status", jobStatus);
app.post("/jobs/inngest", inngestWebhook);
app.on(["GET", "PUT", "POST"], "/api/inngest", (c) => inngestServe(c));

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

logger.info("server starting", {
  port,
  mutation: process.env.MUTATION_ENABLED ?? "false",
  reviewReminders: process.env.REVIEW_REMINDER_ENABLED ?? "false",
  sentry: !!process.env.SENTRY_DSN,
  posthog: !!process.env.NEXT_PUBLIC_POSTHOG_KEY,
  langfuse: !!process.env.LANGFUSE_PUBLIC_KEY,
  vapid: !!process.env.VAPID_PUBLIC_KEY,
  inngest: !!process.env.INNGEST_EVENT_KEY,
  inngestServe: !!process.env.INNGEST_SIGNING_KEY,
  tripleCheck: process.env.STREAM_LLM_VALIDATOR !== "false",
  upstash: !!process.env.UPSTASH_REDIS_REST_URL,
});

startMutationCron();
startReviewReminderCron();

void ensurePushSubscriptionsTable();
void ensureStudyStatsColumns();

serveHttp({ fetch: app.fetch, port });

export default app;
