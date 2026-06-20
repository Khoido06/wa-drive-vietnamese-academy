# Observability & Analytics Setup (All Free Tiers)

Optional — app works without any of these keys.

---

## 1. OpenAI Embeddings (prod only, pay-per-use)

**When:** Better vector search on Railway (optional — keyword search works free)

```env
# Railway only — keep Groq for LLM
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
EMBED_PROVIDER=openai
OPENAI_API_KEY=sk-...
EMBED_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=768
```

> Uses `dimensions=768` to match existing Neon pgvector index. Small cost per query (~$0.00002).

---

## 2. Sentry (error tracking)

1. [sentry.io](https://sentry.io) → Create project → Node.js + Next.js
2. Copy DSN

```env
# Railway (API)
SENTRY_DSN=https://...@sentry.io/...

# Vercel (Web)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

Free: 5,000 errors/month

---

## 3. Vercel Analytics

**Auto-enabled** when deployed on Vercel — no key needed.

Local: `@vercel/analytics` included in `AppProviders`.

---

## 4. PostHog (product analytics)

1. [posthog.com](https://posthog.com) → Sign up free
2. Project Settings → copy Project API Key

```env
# Vercel
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

Free: 1M events/month

---

## 5. Upstash Redis (rate limiting)

1. [upstash.com](https://upstash.com) → Create Redis database (free)
2. Copy REST URL + token

```env
# Railway
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=...
```

Without keys: falls back to in-memory rate limit (works on single replica).

---

## 6. Langfuse (RAG tracing)

1. [cloud.langfuse.com](https://cloud.langfuse.com) → Sign up free
2. Create project → API Keys

```env
# Railway
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_BASE_URL=https://cloud.langfuse.com
```

Free: 50k observations/month

---

## 7. Playwright E2E (local + CI)

```bash
pnpm exec playwright install chromium   # first time
pnpm test:e2e                           # starts dev server automatically
```

CI runs smoke tests on every push to `main`.

---

## Verify integrations

```bash
curl https://YOUR-API/rag/status
```

Look for `ai` object:
```json
{
  "ai": {
    "embedProvider": "keyword",
    "langfuse": true,
    "sentry": true,
    "upstash": true
  }
}
```
