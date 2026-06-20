import type { Context } from "hono";

const OPENAPI = {
  openapi: "3.0.3",
  info: {
    title: "WA Drive Vietnamese Academy API",
    version: "0.2.0",
    description: "RAG-powered learning API for Vietnamese elderly WA driver test prep",
  },
  servers: [{ url: "https://api-production-72db.up.railway.app" }],
  paths: {
    "/health": {
      get: { summary: "Health check", responses: { "200": { description: "OK" } } },
    },
    "/rag/status": {
      get: { summary: "RAG index + AI provider status", responses: { "200": { description: "Status" } } },
    },
    "/rag/query": {
      post: {
        summary: "RAG Q&A (strict or fast mode)",
        requestBody: { required: true },
        responses: { "200": { description: "Answer with trace" } },
      },
    },
    "/rag/query/stream": {
      post: {
        summary: "SSE streaming tutor",
        requestBody: { required: true },
        responses: { "200": { description: "text/event-stream" } },
      },
    },
    "/learning/{userId}/next": {
      get: { summary: "Next adaptive question", responses: { "200": { description: "Question" } } },
    },
    "/mutation/status": {
      get: { summary: "Self-improvement engine health", responses: { "200": { description: "Health" } } },
    },
  },
} as const;

export function openApiJson(c: Context) {
  return c.json(OPENAPI);
}

export function openApiDocs(c: Context) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>WA Drive API Docs</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({ url: '/openapi.json', dom_id: '#swagger-ui' });
  </script>
</body>
</html>`;
  return c.html(html);
}
