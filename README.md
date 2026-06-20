# WA Drive Vietnamese Academy

[![Live Demo](https://img.shields.io/badge/demo-live-0b5cad?style=for-the-badge)](https://wa-drive-vietnamese-academy.vercel.app)
[![CI](https://img.shields.io/github/actions/workflow/status/Khoido06/wa-drive-vietnamese-academy/ci.yml?branch=main&label=CI&style=for-the-badge)](https://github.com/Khoido06/wa-drive-vietnamese-academy/actions)
[![License: MIT](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)

Production AI learning platform for Vietnamese-speaking learners preparing for U.S. driver knowledge tests. Grounded RAG over official state driver guides, adaptive practice with spaced repetition, and an elderly-first progressive web app.

| | |
|---|---|
| **Live App** | https://wa-drive-vietnamese-academy.vercel.app |
| **API** | https://api-production-72db.up.railway.app |
| **API Docs** | https://api-production-72db.up.railway.app/docs |
| **Repository** | https://github.com/Khoido06/wa-drive-vietnamese-academy |

---

## Overview

The platform indexes the official **191-page Vietnamese Washington Driver Guide** (100+ RAG chunks) and serves a full learning loop: AI tutor, adaptive practice, timed exams, progress tracking, and optional account sync. Core features run on **free-tier** infrastructure with graceful fallbacks when optional services are unavailable.

---

## Architecture

```
┌─────────────────┐   SSE/REST    ┌─────────────────┐   pgvector/SQL   ┌──────────────┐
│  Next.js 16 PWA │ ────────────► │   Hono API      │ ───────────────► │ Neon Postgres │
│  Vercel         │               │  Railway        │                  │               │
└─────────────────┘               └────────┬────────┘                  └──────────────┘
         │                                 │
         │ Analytics                       ▼
         ▼                          ┌─────────────┐
  Vercel · PostHog · Sentry         │ Groq / Ollama│  LLM + embeddings
                                    └─────────────┘
         ┌──────────────────────────────────────────┐
         │ Inngest (self-hosted) · OpenTelemetry    │
         │ Web Push · Langfuse · Upstash            │
         └──────────────────────────────────────────┘
```

### Monorepo (Turborepo — 11 packages)

| Layer | Package | Role |
|-------|---------|------|
| Product | `apps/web` | PWA, Vietnamese UI, SSE tutor, Playwright E2E |
| API | `apps/api` | Hono REST, OpenAPI, cron, Inngest serve |
| Intelligence | `packages/ai-core` | RAG ingest → embed → retrieve → generate |
| Learning | `packages/learning-engine` | SM-2, Elo, curated exams, billing |
| Self-improvement | `packages/mutation-engine` | Telemetry → analytics → config mutations |
| Data | `packages/db` | Drizzle ORM + pgvector schema |

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 16, React 19, PWA, Web Speech API, Web Push |
| Backend | Hono, TypeScript, Inngest SDK, OpenTelemetry |
| Database | PostgreSQL 16 + pgvector, Drizzle ORM |
| AI (prod) | Groq `llama-3.1-8b-instant` |
| AI (local) | Ollama `qwen2.5:7b` + `nomic-embed-text` |
| Search | pgvector HNSW + keyword hybrid fallback |
| Jobs | Self-hosted Inngest on Railway |
| Observability | Sentry, PostHog, Langfuse OTLP, Vercel Analytics |
| Auth | Clerk (optional JWT-verified API linking) |
| Billing | Stripe Checkout (Free / Pro / Family) |
| CI/CD | GitHub Actions — typecheck, unit, RAG eval, E2E, build |

> **No OpenAI key required** for core features. Optional `EMBED_PROVIDER=openai` improves vector search quality.

---

## Features

**Learning & content**
- AI tutor with Groq SSE streaming and Vietnamese UI
- 250+ curated WA DMV questions with offline PWA bundle
- Adaptive practice — SM-2 spaced repetition, Elo difficulty, failure-cluster routing
- Timed practice exams with Vietnamese explanations
- Multi-state RAG corpus support (`state_code` filter)

**AI & quality**
- Hybrid RAG: vector search with keyword fallback
- Triple-check validation on streamed tutor answers
- 50 golden-query eval with RAGAS-style metrics (85% CI gate)
- Human feedback loop (👍/👎) feeding mutation cron

**Platform**
- Clerk auth with JWT-verified account linking across devices
- Stripe subscription tiers with usage limits and family sharing
- B2B org API keys for driving schools
- Caregiver read-only progress links
- Daily Web Push review reminders (SM-2-aware, VAPID)
- Rate limiting via Upstash with in-memory fallback
- Admin dashboard — RAG traces, mutations, system health

**Accessibility**
- Elderly-first UX: large touch targets, font scaling (A/A+/A++), one task per screen
- Vietnamese TTS and voice input (STT) on tutor page

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/health/observability` | Sentry, Langfuse, VAPID, Inngest status |
| GET | `/docs` | Swagger UI |
| GET | `/rag/status` | Chunks indexed + AI provider flags |
| POST | `/rag/query/stream` | SSE streaming tutor |
| POST | `/rag/query` | RAG Q&A (strict/fast) |
| GET | `/learning/:userId/next` | Adaptive question |
| POST | `/telemetry` | UX event tracking |
| POST | `/notifications/subscribe` | Web Push subscription |
| POST | `/jobs/run` | Trigger background job (ingest, reembed, review-reminders) |
| GET | `/mutation/status` | Self-improvement health |
| GET | `/billing/status/:userId` | Tier + daily usage |
| POST | `/billing/checkout` | Stripe Checkout |
| POST | `/b2b/v1/rag/query/stream` | B2B SSE tutor (API key) |
| POST | `/family/invite` | Caregiver share link |
| GET | `/family/shared/:token` | Read-only learner progress |

Full OpenAPI spec: `/openapi.json`

---

## Quick Start

```bash
git clone https://github.com/Khoido06/wa-drive-vietnamese-academy.git
cd wa-drive-vietnamese-academy
pnpm install
pnpm infra:up          # Postgres + pgvector (Docker)
pnpm db:push
pnpm setup:ollama      # qwen2.5:7b + nomic-embed-text
pnpm dev               # web :3000 · api :4000

curl -X POST http://localhost:4000/rag/ingest
```

### Scripts

```bash
pnpm test              # unit tests
pnpm eval:rag          # RAG retrieval eval (CI gate)
pnpm test:e2e          # Playwright smoke tests
pnpm check-types       # TypeScript across monorepo
pnpm setup:push        # VAPID keys + Web Push production setup
pnpm setup:tier2       # Inngest self-host + OpenTelemetry on Railway
pnpm deploy:inngest    # Redeploy Inngest service (isolated Dockerfile)
pnpm smoke:prod        # Production smoke tests
```

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/DEPLOY.md](docs/DEPLOY.md) | Deployment guide |
| [docs/OBSERVABILITY.md](docs/OBSERVABILITY.md) | Sentry, Langfuse, Inngest, Web Push |
| [docs/BILLING.md](docs/BILLING.md) | Stripe tiers and usage limits |
| [docs/CLERK.md](docs/CLERK.md) | Auth setup and account linking |
| [docs/B2B.md](docs/B2B.md) | Org API keys for driving schools |
| [docs/SCALE_ROADMAP.md](docs/SCALE_ROADMAP.md) | Growth and scaling plan |

---

## Project Structure

```
apps/web              Next.js PWA + Playwright E2E
apps/api              Hono REST API + OpenAPI + Inngest
packages/ai-core      RAG pipeline + hybrid retrieval
packages/learning-engine   SM-2, Elo, exams, billing
packages/mutation-engine   Self-improvement loop
packages/db           Drizzle + pgvector
packages/ui           Elderly-first design system
inngest/              Self-hosted Inngest Dockerfile
infra/                Docker Compose
docs/                 Guides and state corpora
scripts/              Migrations, eval, deploy helpers
```

---

## License

MIT
