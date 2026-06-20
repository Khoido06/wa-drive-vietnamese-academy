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

const app = new Hono();

app.use("*", cors());

app.get("/health", (c) =>
  c.json({ status: "ok", system: "wa-drive-vietnamese-academy", version: "0.1.0" }),
);

app.post("/rag/query", queryRag);
app.post("/rag/query/stream", queryRagStream);
app.post("/rag/ingest", ingestPdf);
app.get("/rag/status", ragStatus);

app.post("/users", createUser);
app.get("/learning/:userId/next", nextQuestion);
app.post("/learning/attempt", submitAttempt);
app.get("/learning/:userId/progress", userProgress);
app.post("/telemetry", postTelemetry);

app.get("/mutation/status", mutationStatus);
app.post("/mutation/run", runMutations);

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 4000);

console.log(`🧬 WA Drive API running on http://localhost:${port}`);

serve({ fetch: app.fetch, port });

export default app;
