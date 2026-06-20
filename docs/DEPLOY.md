# Deploy Guide — WA Drive Vietnamese Academy

Production stack designed for portfolio/resume deployment.

## Architecture (Production)

```
Vercel (apps/web)  →  Railway (apps/api)  →  Neon Postgres (pgvector)
                              ↓
                         Groq API (free tier AI)
```

| Service | Provider | Free Tier | Purpose |
|---------|----------|-----------|---------|
| Frontend | [Vercel](https://vercel.com) | Yes | Next.js PWA |
| API | [Railway](https://railway.app) | $5 credit/mo | Hono REST API |
| Database | [Neon](https://neon.tech) | Yes | Postgres + pgvector |
| AI (prod) | [Groq](https://console.groq.com) | Yes | Fast LLM inference |

Local dev uses **Ollama** (free, offline). Production uses **Groq** (free cloud).

---

## Step 1 — Database (Neon)

1. Create project at [neon.tech](https://neon.tech)
2. Enable pgvector: `CREATE EXTENSION vector;`
3. Copy connection string → `DATABASE_URL`

```bash
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/wa_drive?sslmode=require
```

Push schema:
```bash
DATABASE_URL=... pnpm db:push
```

---

## Step 2 — API (Railway)

1. Create project at [railway.app](https://railway.app)
2. Connect GitHub repo, set root directory: `apps/api`
3. Add environment variables:

```env
DATABASE_URL=postgresql://...
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
LLM_MODEL=llama-3.1-8b-instant
EMBED_MODEL=nomic-embed-text
EMBEDDING_DIMENSIONS=768
WA_DRIVER_GUIDE_PDF_PATH=./docs/driver-guide-vi.pdf
MUTATION_ENABLED=true
PORT=4000
```

4. Deploy → copy URL (e.g. `https://wa-drive-api.up.railway.app`)

5. Ingest PDF (one-time):
```bash
curl -X POST https://wa-drive-api.up.railway.app/rag/ingest
```

> **Note:** For Groq-only deploy without Ollama embeddings, use Neon pgvector with pre-ingested chunks from local dev, or run ingest on Railway with Ollama replaced by OpenAI embeddings.

**Recommended:** Ingest locally with Ollama, then `pg_dump` / restore to Neon.

---

## Step 3 — Frontend (Vercel)

1. Import repo at [vercel.com](https://vercel.com)
2. Set root directory: `apps/web`
3. Environment variables:

```env
NEXT_PUBLIC_API_URL=https://wa-drive-api.up.railway.app
```

4. Deploy → live at `https://your-app.vercel.app`

---

## Resume Bullet Points

Use these on your resume/LinkedIn:

- Built a **self-improving AI learning platform** for Vietnamese elderly learners preparing for the Washington Driver Test
- Implemented **RAG pipeline** (pgvector + triple-check validation) grounded exclusively on official WA Driver Guide PDF
- Designed **elderly-first PWA** (64px touch targets, Vietnamese-first, one-task-per-screen) inspired by Duolingo + Apple HIG accessibility
- Built **adaptive learning engine** with SM-2 spaced repetition, Elo difficulty scoring, and failure-cluster curriculum reordering
- Created **closed-loop mutation engine** that auto-optimizes prompts, retrieval, and UI from telemetry analytics
- **Tech stack:** Next.js 16, Hono, PostgreSQL/pgvector, Drizzle ORM, Ollama/Groq, Turborepo monorepo

---

## Local Development

```bash
pnpm install
pnpm infra:up
pnpm setup:ollama
pnpm db:push
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:4000
```
