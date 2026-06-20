import "./instrument.js";

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { queryRag, ingestPdf, ragStatus } from "./routes/rag.js";
import {
  createUser,
  linkUser,
  nextQuestion,
  submitAttempt,
  userProgress,
  postTelemetry,
} from "./routes/learning.js";
import { mutationStatus, runMutations } from "./routes/mutation.js";
import { queryRagStream } from "./routes/rag-stream.js";
import { openApiDocs, openApiJson } from "./routes/docs.js";
import { adminAuth, adminOverview, adminTraces, adminMutations } from "./routes/admin.js";
import { createRateLimit } from "./middleware/rate-limit-upstash.js";
import { logger, requestLogger } from "./middleware/logger.js";
import { startMutationCron } from "./jobs/mutation-cron.js";

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

const ragRateLimit = createRateLimit({ windowMs: 60_000, max: 20, keyPrefix: "rag" });

app.get("/health", (c) =>
  c.json({ status: "ok", system: "wa-drive-vietnamese-academy", version: "0.3.0" }),
);

app.get("/openapi.json", openApiJson);
app.get("/docs", openApiDocs);

app.post("/rag/query", ragRateLimit, queryRag);
app.post("/rag/query/stream", ragRateLimit, queryRagStream);
app.post("/rag/ingest", queryRag);
app.get("/rag/status", ragStatus);

app.post("/users", createUser);
app.post("/users/link", linkUser);
app.get("/learning/:userId/next", nextQuestion);
app.post("/learning/attempt", submitAttempt);
app.get("/learning/:userId/progress", userProgress);
app.post("/telemetry", postTelemetry);

app.get("/mutation/status", mutationStatus);
app.post("/mutation/run", runMutations);

const admin = adminAuth();
app.get("/admin/overview", admin, adminOverview);
app.get("/admin/traces", admin, adminTraces);
app.get("/admin/mutations", admin, adminMutations);

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

logger.info("server starting", {
  port,
  mutation: process.env.MUTATION_ENABLED ?? "false",
  sentry: !!process.env.SENTRY_DSN,
  upstash: !!process.env.UPSTASH_REDIS_REST_URL,
  langfuse: !!process.env.LANGFUSE_PUBLIC_KEY,
});

startMutationCron();

serve({ fetch: app.fetch, port });

export default app;
