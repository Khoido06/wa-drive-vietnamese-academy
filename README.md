# WA Drive Vietnamese Academy

> Self-improving AI learning platform for Vietnamese elderly learners preparing for the Washington Driver Test.

**Live demo:** _Deploy with [docs/DEPLOY.md](docs/DEPLOY.md)_

## Highlights (Resume)

- **RAG-powered AI tutor** — grounded exclusively on WA Driver Guide PDF, triple-check anti-hallucination pipeline
- **Elderly-first PWA** — 64px touch targets, Vietnamese-first, one task per screen (Duolingo + Apple HIG inspired)
- **Adaptive learning engine** — SM-2 spaced repetition, Elo difficulty, failure-cluster curriculum reordering
- **Self-improvement loop** — telemetry → analytics → automatic system mutations
- **Stack:** Next.js 16 · Hono · PostgreSQL/pgvector · Drizzle · Ollama/Groq · Turborepo

## Screenshots

| Home | Learn | AI Tutor |
|------|-------|----------|
| One-task navigation cards | Question + A/B/C/D options | Fast RAG with quick-ask chips |

## AI Setup (Free — Ollama)

```bash
brew install ollama
pnpm setup:ollama   # qwen2.5:7b + nomic-embed-text
```

| Provider | Cost | Best for |
|----------|------|----------|
| **Ollama** (default) | Free | Local dev, Vietnamese |
| **Groq** | Free tier | Production deploy |
| OpenAI | Paid | Optional |

## Quick Start

```bash
pnpm install
pnpm infra:up          # Postgres + Redis
pnpm db:push
pnpm dev               # :3000 web + :4000 api

curl -X POST http://localhost:4000/rag/ingest
```

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) · Deploy: [docs/DEPLOY.md](docs/DEPLOY.md)

```
apps/web (PWA) → apps/api (Hono) → packages/ai-core (RAG)
                                  → packages/learning-engine
                                  → packages/mutation-engine
                                  → packages/db (Postgres/pgvector)
```

## Monorepo

```
apps/web      Next.js PWA — elderly Vietnamese UI
apps/api      Hono REST API
packages/ai-core           Triple-check RAG pipeline
packages/learning-engine   Adaptive spaced repetition
packages/mutation-engine   Self-improvement from telemetry
packages/db                Drizzle + pgvector schema
packages/ui                Elderly-first design system
infra/                     Docker Compose (Postgres, Redis)
```

## License

MIT
