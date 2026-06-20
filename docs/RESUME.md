# Resume — WA Drive Vietnamese Academy

**Live:** https://wa-drive-vietnamese-academy.vercel.app  
**GitHub:** https://github.com/Khoido06/wa-drive-vietnamese-academy  
**API:** https://api-production-72db.up.railway.app/docs  

Production AI learning platform built for my mom (Vietnamese-speaking elderly) to pass the Washington DMV knowledge test. Deployed on **100% free-tier** infra with eval-gated CI.

---

## One-liner (LinkedIn headline / resume summary)

Full-stack AI engineer — shipped production RAG tutor (Next.js 16, Hono, pgvector) with hybrid retrieval, SSE streaming, spaced-repetition learning loop, and elderly-first PWA; deployed Vercel + Railway + Neon with 50-query CI eval gate.

---

## Bullet points (copy-paste for FAANG / senior SWE applications)

```
• Built production AI learning platform (Next.js 16, React 19, Hono, PostgreSQL/pgvector)
  for Vietnamese elderly DMV prep — live on Vercel + Railway + Neon; 250 curated WA questions,
  5 exam sets, offline PWA, Clerk auth with JWT-verified API linking

• Designed hybrid RAG pipeline: vector + keyword fallback, Groq SSE streaming tutor, triple-check
  LLM validation, Langfuse tracing; 50 golden-query eval harness with RAGAS-style metrics
  and 85% pass-rate gate in GitHub Actions CI

• Implemented adaptive learning engine: SM-2 spaced repetition, Elo difficulty, failure-cluster
  curriculum reordering, and hourly telemetry-driven mutation cron for retrieval self-tuning

• Shipped elderly-first UX: Vietnamese TTS, Web Speech STT, dynamic font scaling (WCAG-friendly
  touch targets), offline exam cache, mom onboarding — optimized for non-technical users

• Production systems: Sentry + PostHog + Vercel Speed Insights, Upstash rate limiting with
  in-memory fallback, OpenAPI 3 docs, Playwright E2E, Stripe billing skeleton, B2B org API keys
```

---

## Technical highlights (for interviews)

| Topic | What to say |
|-------|-------------|
| **RAG** | 191-page Vietnamese WA PDF → chunk → embed (Ollama/OpenAI) → pgvector; keyword hybrid when embed unavailable on Railway free tier |
| **Streaming** | Hono SSE `/rag/query/stream`; client-side token rendering; post-stream heuristic + optional 2nd-pass LLM validator |
| **Eval** | `packages/ai-core/eval/` — 50 golden queries, faithfulness/context/recall thresholds, blocks CI merge below 85% |
| **Learning loop** | SM-2 due dates + Elo on question difficulty + failure clusters → `getNextQuestion` prioritizes weak topics |
| **Mutation engine** | Telemetry → hourly cron adjusts topK, confidence thresholds from aggregate RAG feedback |
| **Auth** | Clerk client sessions + `@clerk/backend` JWT verification on Hono; anonymous mom flow via display-name premium whitelist |
| **Billing** | Stripe Checkout + webhook tier mapping; usage metering (10 tutor / 20 practice daily on free) |
| **Scale path** | Multi-state corpora (WA/CA/TX/FL), B2B SSE API, family caregiver share tokens, Inngest job queue stub |

---

## Metrics (honest, verifiable)

| Metric | Value |
|--------|-------|
| Production uptime | Vercel + Railway deployed, `/health` 200 |
| RAG corpus | ~158 chunks indexed (WA), 191-page source PDF |
| Exam bank | 250 questions, 5 sets × 50, 40-question exam (32 to pass) |
| CI eval set | 50 golden queries (100% pass in CI) |
| E2E tests | Playwright smoke (home, learn, tutor, exam, sign-in) |
| Monorepo packages | 11 (Turborepo) |
| Monthly infra cost | $0 (free tiers) |

---

## Tech stack (2025–2026)

**Frontend:** Next.js 16 · React 19 · PWA · Clerk · Sentry · PostHog · Vercel Analytics · Speed Insights  
**Backend:** Hono · TypeScript · Drizzle ORM · Stripe · web-push  
**Data:** Neon PostgreSQL 16 · pgvector · Upstash Redis  
**AI:** Groq (prod LLM) · Ollama (local) · OpenAI embed (optional) · Langfuse  
**DevOps:** GitHub Actions · Docker · Railway · Vercel · OpenAPI 3  

---

## Project story (behavioral interview)

**Situation:** Mom needed to pass WA DMV test; English-heavy materials and generic quiz apps were unusable.  
**Task:** Build Vietnamese, elderly-accessible app with **correct** DMV answers (not hallucinated).  
**Action:** Curated 250 questions from official guide, RAG over Vietnamese PDF, SM-2 + exam simulation, deployed free-tier production stack, added Clerk for cross-device sync.  
**Result:** Mom can study offline, unlimited AI via name whitelist; portfolio-ready production app with eval-gated CI.

---

## Links for recruiters

- **Demo:** https://wa-drive-vietnamese-academy.vercel.app  
- **API Swagger:** https://api-production-72db.up.railway.app/docs  
- **Repo:** https://github.com/Khoido06/wa-drive-vietnamese-academy  

---

*MIT License · Built to help my mom pass the Washington driver test*
