# WA Drive Vietnamese Academy

**Live Demo:** https://wa-drive-vietnamese-academy.vercel.app  
**API Health:** https://api-production-72db.up.railway.app/health  
**API Docs:** https://api-production-72db.up.railway.app/docs  
**Repository:** https://github.com/Khoido06/wa-drive-vietnamese-academy

AI-powered learning platform for **Vietnamese-speaking elderly learners** preparing for the **Washington State Driver Knowledge Test**. Production RAG over the official 191-page Vietnamese WA Driver Guide — built entirely on **free-tier** infrastructure.

---

## Problem → Solution

| Problem | Solution |
|---------|----------|
| 191-page English-heavy driver guide | Vietnamese PDF as sole RAG corpus (100 chunks) |
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
                                           │
                                           ▼
                                    ┌─────────────┐
                                    │ Groq (free)  │  LLM inference
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

## Tech Stack (100% Free Tier Friendly)

| Category | Technology | Cost |
|----------|-----------|------|
| Frontend | Next.js 16, React 19, PWA, Web Speech API | Vercel free |
| Backend | Hono, TypeScript, Docker | Railway free |
| Database | PostgreSQL 16 + pgvector, Drizzle ORM | Neon free |
| AI (prod) | Groq `llama-3.1-8b-instant` | Free tier |
| AI (local) | Ollama `qwen2.5:7b` + `nomic-embed-text` | Free |
| Search | pgvector + **keyword hybrid fallback** | $0 |
| Observability | Structured JSON logging | $0 |
| API Docs | OpenAPI 3 + Swagger UI | $0 |
| Rate Limiting | In-memory (protects Groq quota) | $0 |
| CI | GitHub Actions + Node.js test runner | $0 |

> No OpenAI key required. Production uses **keyword hybrid search** when embedding API unavailable; Ollama provides full vector search locally.

---

## Key Features

- **AI Tutor** — Vietnamese Q&A with Groq SSE streaming (ChatGPT-style)
- **Hybrid RAG** — pgvector when Ollama available; keyword search on Railway (free)
- **Grounding check** — post-stream heuristic validates answer ⊆ retrieved chunks
- **Adaptive practice** — dynamic questions from RAG, never a static bank
- **SM-2 + Elo** — spaced repetition and difficulty adaptation
- **Mutation cron** — auto-tunes retrieval params from telemetry (hourly)
- **Rate limiting** — 20 req/min on RAG routes (protects free Groq quota)
- **OpenAPI docs** — `/docs` + `/openapi.json`
- **Elderly UX** — TTS 🔊, font scaling, one task per screen

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/docs` | Swagger UI |
| GET | `/rag/status` | Chunks + AI provider info |
| POST | `/rag/query/stream` | SSE streaming tutor |
| POST | `/rag/query` | RAG Q&A (strict/fast) |
| GET | `/learning/:userId/next` | Adaptive question |
| POST | `/telemetry` | UX event tracking |
| GET | `/mutation/status` | Self-improvement health |

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
pnpm test              # unit tests (SM-2, keyword RAG)
```

Deploy: [docs/DEPLOY_NOW.md](docs/DEPLOY_NOW.md)

---

## For Mom 👩

- **🔊 Đọc to** — Web Speech API tiếng Việt
- **A / A+ / A++** — chỉnh cỡ chữ góc màn hình
- **Một câu/lần** — không rối, không vội
- **Hỏi thầy giáo** — AI trả lời từ sách hướng dẫn chính thức

---

## Resume Bullets

```
• Built full-stack AI learning platform (Next.js 16, Hono, pgvector RAG) for Vietnamese
  elderly learners — deployed Vercel + Railway + Neon on 100% free tier

• Implemented hybrid RAG (vector + keyword fallback), Groq SSE streaming tutor, triple-check
  validation, and grounding heuristics over 191-page PDF corpus

• Designed elderly-first PWA with Vietnamese TTS, dynamic font scaling, SM-2 spaced
  repetition, Elo difficulty, and telemetry-driven mutation engine

• Monorepo (Turborepo, 11 packages): OpenAPI docs, structured logging, rate limiting,
  GitHub Actions CI, Docker, unit tests — zero paid AI tokens required
```

---

## Monorepo Structure

```
apps/web              Next.js PWA
apps/api              Hono REST API + OpenAPI + cron
packages/ai-core      RAG pipeline + hybrid retrieval
packages/learning-engine   SM-2, Elo, failure clusters
packages/mutation-engine   Self-improvement loop
packages/db           Drizzle + pgvector
packages/ui           Elderly-first design system
infra/                Docker Compose
```

## License

MIT · Built to help my mom pass the Washington driver test 🇺🇸
