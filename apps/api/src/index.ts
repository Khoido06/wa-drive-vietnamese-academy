import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { queryRag, ingestPdf, ragStatus } from "./routes/rag.js";
import {
  createUser,
  nextQuestion,
  submitAttempt,
  userProgress,
  postTelemetry,
} from "./routes/learning.js";
import { mutationStatus, runMutations } from "./routes/mutation.js";
import { queryRagStream } from "./routes/rag-stream.js";
import { openApiDocs, openApiJson } from "./routes/docs.js";
import { rateLimit } from "./middleware/rate-limit.js";
import { logger, requestLogger } from "./middleware/logger.js";
import { startMutationCron } from "./jobs/mutation-cron.js";

const app = new Hono();

app.use("*", cors());
app.use("*", requestLogger());

const ragRateLimit = rateLimit({ windowMs: 60_000, max: 20, keyPrefix: "rag" });

app.get("/health", (c) =>
  c.json({ status: "ok", system: "wa-drive-vietnamese-academy", version: "0.2.0" }),
);

app.get("/openapi.json", openApiJson);
app.get("/docs", openApiDocs);

app.post("/rag/query", ragRateLimit, queryRag);
app.post("/rag/query/stream", ragRateLimit, queryRagStream);
app.post("/rag/ingest", queryRag);
app.get("/rag/status", ragStatus);

app.post("/users", createUser);
app.get("/learning/:userId/next", nextQuestion);
app.post("/learning/attempt", submitAttempt);
app.get("/learning/:userId/progress", userProgress);
app.post("/telemetry", postTelemetry);

app.get("/mutation/status", mutationStatus);
app.post("/mutation/run", runMutations);

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

logger.info("server starting", { port, mutation: process.env.MUTATION_ENABLED ?? "false" });
startMutationCron();

serve({ fetch: app.fetch, port });

export default app;
