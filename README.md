# WA Drive Vietnamese Academy

[![Live Demo](https://img.shields.io/badge/demo-live-0b5cad?style=for-the-badge)](https://wa-drive-vietnamese-academy.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/Khoido06/wa-drive-vietnamese-academy/ci.yml?branch=main&label=CI&style=for-the-badge)](https://github.com/Khoido06/wa-drive-vietnamese-academy/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

**AI learning platform for Vietnamese-speaking elderly learners preparing for the Washington State Driver Knowledge Test.**

| | |
|---|---|
| **Live App** | https://wa-drive-vietnamese-academy.vercel.app |
| **API** | https://api-production-72db.up.railway.app |
| **API Docs** | https://api-production-72db.up.railway.app/docs |
| **Repository** | https://github.com/Khoido06/wa-drive-vietnamese-academy |

Production RAG over the official **191-page Vietnamese WA Driver Guide** (100 indexed chunks). Built on **free-tier** infrastructure — no paid AI tokens required for core features.

---

## Problem → Solution

| Problem | Solution |
|---------|----------|
| 191-page English-heavy driver guide | Vietnamese PDF as sole RAG corpus |
| Static quiz apps hallucinate | Triple-check RAG + keyword hybrid fallback |
| Seniors struggle with small UI | Elderly-first PWA: 64px touch, TTS, A/A+/A++ fonts |
| One-size-fits-all learning | SM-2 spaced repetition + Elo difficulty + failure clusters |
| Systems don't improve | Telemetry → mutation engine auto-tunes retrieval |

---

## Architecture

```
┌─────────────────┐   SSE/REST    ┌─────────────────┐   pgvector/SQL   ┌──────────────┐
│  Next.js 16 PWA │ ────────────► │   Hono API      │ ───────────────► │ Neon Postgres │
│  Vercel (free)  │               │  Railway (free) │                  │  (free tier)  │
└─────────────────┘               └────────┬────────┘                  └──────────────┘
         │                                 │
         │ Analytics                       ▼
         ▼                          ┌─────────────┐
  Vercel · PostHog · Sentry         │ Groq (free)  │  LLM inference
                                    │ Ollama (dev) │  local embed + LLM
                                    └─────────────┘
```

### 4-Layer Monorepo (Turborepo)

| Layer | Package | Role |
|-------|---------|------|
| Product | `apps/web` | Elderly PWA, Vietnamese UI, SSE tutor |
| Intelligence | `packages/ai-core` | RAG: ingest → embed → retrieve → generate |
| Learning Loop | `packages/learning-engine` | SM-2, Elo, adaptive questions |
| Self-Improvement | `packages/mutation-engine` | Telemetry → analytics → config mutations |

---

## Tech Stack

| Category | Technology | Cost |
|----------|-----------|------|
| Frontend | Next.js 16, React 19, PWA, Web Speech API | Vercel free |
| Backend | Hono, TypeScript, Docker | Railway free |
| Database | PostgreSQL 16 + pgvector, Drizzle ORM | Neon free |
| AI (prod) | Groq `llama-3.1-8b-instant` | Free tier |
| AI (local) | Ollama `qwen2.5:7b` + `nomic-embed-text` | Free |
| Search | pgvector + **keyword hybrid fallback** | $0 |
| Observability | Sentry, PostHog, Vercel Analytics, Langfuse | Free tiers (optional) |
| Rate Limiting | Upstash Redis → in-memory fallback | Free tiers |
| Testing | Node.js test runner + Playwright E2E | $0 |
| API Docs | OpenAPI 3 + Swagger UI | $0 |
| CI/CD | GitHub Actions (typecheck, unit, E2E, build) | $0 |

> **No OpenAI key required.** Production uses keyword hybrid search when embeddings unavailable. Optional `EMBED_PROVIDER=openai` improves vector search (~$0.00002/query).

Observability setup: [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md)

Scale roadmap (A + B + C): [docs/SCALE_ROADMAP.md](docs/SCALE_ROADMAP.md)

---

## Key Features

- **AI Tutor** — Vietnamese Q&A with Groq SSE streaming (ChatGPT-style)
- **Hybrid RAG** — pgvector when Ollama available; keyword search on Railway (free)
- **Grounding check** — post-stream heuristic validates answer ⊆ retrieved chunks
- **Adaptive practice** — dynamic questions from RAG, never a static bank
- **SM-2 + Elo** — spaced repetition and difficulty adaptation
- **Mutation cron** — auto-tunes retrieval params from telemetry (hourly)
- **Rate limiting** — 20 req/min on RAG routes (Upstash or in-memory)
- **OpenAPI docs** — `/docs` + `/openapi.json`
- **Observability** — Sentry, PostHog, Vercel Analytics, Langfuse (all optional)
- **Playwright E2E** — smoke tests in CI
- **RAG eval (CI gate)** — 12 golden queries, 85% retrieval pass rate
- **Admin dashboard** — `/admin` (RAG traces, mutations, system health)
- **Clerk auth** — optional; **mom does not need login** (sync when changing phone)
- **Voice input (STT)** — 🎤 nói câu hỏi trên tutor page
- **Stripe tiers** — Free / Pro / Family (mom WA stays free)
- **Multi-state RAG** — `state_code` filter (WA default, Pro unlocks more)
- **RAG response cache** — Upstash or in-memory (24h TTL)
- **A/B RAG config** — optional topK variants (`RAG_AB_ENABLED`)
- **LLM validator** — 2nd-pass fact-check on streamed tutor answers
- **Human feedback** — 👍/👎 tunes retrieval via mutation cron
- **B2B API** — org-scoped keys for driving schools (`/b2b/v1/...`)
- **Caregiver sharing** — Family tier read-only progress links
- **Elderly UX** — TTS 🔊, font scaling, one task per screen

Billing: [docs/BILLING.md](docs/BILLING.md) · Clerk: [docs/CLERK.md](docs/CLERK.md) · B2B: [docs/B2B.md](docs/B2B.md)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| GET | `/rag/status` | Chunks + AI provider + observability flags |
| POST | `/rag/query/stream` | SSE streaming tutor |
| POST | `/rag/query` | RAG Q&A (strict/fast) |
| GET | `/learning/:userId/next` | Adaptive question |
| POST | `/telemetry` | UX event tracking |
| GET | `/mutation/status` | Self-improvement health |
| GET | `/rag/states` | Available state corpora |
| GET | `/billing/status/:userId` | Tier + daily usage |
| POST | `/billing/checkout` | Stripe Checkout (Pro/Family) |
| POST | `/rag/feedback` | Tutor answer feedback 👍/👎 |
| POST | `/b2b/v1/rag/query/stream` | B2B SSE tutor (API key) |
| POST | `/family/invite` | Caregiver share link (Family) |
| GET | `/family/shared/:token` | Read-only learner progress |

---

## Quick Start (Local — Free)

```bash
git clone https://github.com/Khoido06/wa-drive-vietnamese-academy.git
cd wa-drive-vietnamese-academy
pnpm install
pnpm infra:up          # Postgres + pgvector
pnpm db:push
pnpm setup:ollama      # qwen2.5:7b + nomic-embed-text
pnpm dev               # web :3000 · api :4000

curl -X POST http://localhost:4000/rag/ingest
```

### Testing

```bash
pnpm test              # unit tests (SM-2, keyword RAG, golden eval)
pnpm eval:rag          # RAG retrieval eval report
pnpm test:e2e          # Playwright smoke tests (4 tests)
pnpm check-types       # TypeScript across monorepo
```

Deploy: [docs/DEPLOY_NOW.md](docs/DEPLOY_NOW.md)

---

## For Mom (Hạnh) 👩

1. Mở https://wa-drive-vietnamese-academy.vercel.app → **Add to Home Screen**
2. Nhập tên **Hạnh** → bước **Lưu tiến độ** → **Đăng nhập** (email/Gmail 1 lần)
3. **Học** → **Thi thử** → **Hỏi thầy giáo AI**

Unlimited: `PREMIUM_DISPLAY_NAMES=Mẹ,Hạnh,Lan,Mom` on **Railway API**. Clerk setup: [docs/CLERK.md](docs/CLERK.md).

---

## Resume Bullets

```
• Built full-stack AI learning platform (Next.js 16, Hono, pgvector RAG) for Vietnamese
  elderly learners — deployed Vercel + Railway + Neon on 100% free tier

• Implemented hybrid RAG (vector + keyword fallback), Groq SSE streaming tutor, triple-check
  validation, and grounding heuristics over 191-page PDF corpus

• Designed elderly-first PWA with Vietnamese TTS, dynamic font scaling, SM-2 spaced
  repetition, Elo difficulty, and telemetry-driven mutation engine

• Production observability: Sentry error tracking, PostHog analytics, Langfuse RAG tracing,
  Upstash rate limiting — all optional free tiers with graceful fallbacks

• Monorepo (Turborepo, 11 packages): OpenAPI docs, Playwright E2E, GitHub Actions CI,
  Docker, unit tests — zero paid AI tokens required for core features
```

---

## Monorepo Structure

```
apps/web              Next.js PWA + Playwright E2E
apps/api              Hono REST API + OpenAPI + cron
packages/ai-core      RAG pipeline + hybrid retrieval + Langfuse
packages/learning-engine   SM-2, Elo, failure clusters
packages/mutation-engine   Self-improvement loop
packages/db           Drizzle + pgvector
packages/ui           Elderly-first design system
infra/                Docker Compose
docs/                 Deploy guide + observability setup
```

---

## License

MIT · Built to help my mom pass the Washington driver test 🇺🇸
