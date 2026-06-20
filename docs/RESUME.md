# Resume — WA Drive Vietnamese Academy

**Live:** https://wa-drive-vietnamese-academy.vercel.app  
**GitHub:** https://github.com/Khoido06/wa-drive-vietnamese-academy/blob/main/docs/RESUME.md  
**API:** https://api-production-72db.up.railway.app/docs  

Production AI learning platform built for my mom (**Hạnh**, Vietnamese-speaking elderly) to pass the Washington DMV knowledge test. Deployed on **free-tier** infra with eval-gated CI.

> **Mục đích file này:** Copy resume + **giải thích thật 100%** để phỏng vấn. Không phải “sợ lộ bí mật” — mà **không muốn phóng đại** thứ chưa ship. Recruiter FAANG hỏi sâu 5 phút là biết ngay nếu bạn nói quá.

---

## One-liner (LinkedIn / resume summary)

Full-stack AI engineer — production RAG tutor (Next.js 16, Hono, pgvector) with hybrid retrieval, SSE streaming, SM-2 learning loop, OpenTelemetry-ready tracing, Inngest-compatible jobs; deployed Vercel + Railway + Neon; 50-query CI eval gate (100% pass).

---

## Bullet points (copy-paste)

```
• Built production AI learning platform (Next.js 16, React 19, Hono, PostgreSQL/pgvector)
  for Vietnamese elderly DMV prep — live Vercel + Railway + Neon; 250 curated WA questions,
  5 exam sets, offline PWA, Clerk auth with JWT-verified API linking

• Hybrid RAG: vector + keyword fallback, Groq SSE streaming, triple-check LLM validation,
  Langfuse tracing; OpenTelemetry spans on RAG stream (OTLP export optional);
  50 golden-query eval (RAGAS-style) with 100% CI pass rate

• Adaptive learning: SM-2 spaced repetition, Elo difficulty, failure-cluster curriculum,
  telemetry-driven mutation cron; Inngest-compatible job queue (cloud + in-memory fallback,
  3-attempt retry)

• Elderly-first PWA: Vietnamese TTS/STT, WCAG-friendly touch targets, font scaling,
  offline exam cache, onboarding + Clerk sync for cross-device progress

• Production ops: Sentry, PostHog, Vercel Speed Insights, Upstash rate limiting,
  OpenAPI 3, Playwright E2E (7 tests), GitHub Actions CI, Stripe/B2B skeleton — $0/mo infra
```

---

## Tier 2 — Big-tech patterns (đã có trong code)

| Pattern | Big tech tương đương | Trong project | Production hiện tại |
|---------|---------------------|---------------|------------------------|
| **OpenTelemetry** | Google Dapper, Meta tracing | `apps/api/src/telemetry/tracing.ts` — spans on `rag.query.stream`; auto-export to **Langfuse OTLP** when keys set | ✅ Live — backend `langfuse` (Railway đã có LANGFUSE_*) |
| **Inngest / durable jobs** | Temporal, Cloud Tasks | Self-hosted Inngest on Railway + `/api/inngest` serve; cron daily review reminders | ✅ Server live — `inngest-production-56cc.up.railway.app` (deploy: `pnpm deploy:inngest`) |
| **JWT API auth** | Zero-trust microservices | `@clerk/backend` verify Bearer on `/users/link` | ✅ Live (Clerk pk_test on Vercel) |
| **Eval-gated ML** | Google TFX, Meta FBLearner eval | 50 golden queries, RAGAS metrics, CI blocks <85% | ✅ 50/50 pass |
| **SSE streaming LLM** | ChatGPT-style products | Hono `streamSSE` + Groq | ✅ Live |
| **Rate limiting** | API gateway | Upstash Redis → in-memory fallback | ✅ Live |

---

## Phỏng vấn — Nói thật, không sợ “lộ”

### Câu hỏi: “Scale bao nhiêu user?”

**Trả lời thật:** “Family-scale production — mẹ tôi + portfolio demo. Architecture **designed** for multi-tenant (B2B org keys, tiered billing, rate limits) nhưng chưa load-test 1M users. Tôi có k6 script và health/smoke tests.”

### Câu hỏi: “OpenTelemetry production chưa?”

**Trả lời thật:** “Instrumentation wire sẵn — auto-export OTLP sang Langfuse (đã có trên Railway). Mỗi RAG stream là span với cache_hit, state_code. Xem trace trên Langfuse dashboard.”

### Câu hỏi: “Inngest hay queue tự viết?”

**Trả lời thật:** “Self-hosted Inngest trên Railway (free tier) — không phải Inngest Cloud paid. SDK serve tại `/api/inngest`, 4 functions (ingest, reembed, review-reminders, daily cron). Fallback in-memory queue với 3 retries nếu Inngest down.”

### Câu hỏi: “RAG có hallucinate không?”

**Trả lời thật:** “Thi thử 250 câu = **curated bank**, đáp án cố định — không qua LLM. AI tutor = RAG over 191-page Vietnamese PDF + grounding heuristic + optional 2nd-pass LLM validator. Eval CI 50/50 retrieval trên golden corpus.”

### Câu hỏi: “Tại sao free tier?”

**Trả lời thật:** “Mục tiêu ban đầu: mẹ thi bằng, $0 chi phí. Groq free LLM, Neon/Vercel/Railway free tiers. Keyword hybrid search khi không có embed GPU trên Railway.”

### Đừng nói (sẽ lộ khi hỏi sâu)

- ❌ “Millions of users” / “FAANG-scale traffic”
- ❌ “Full Inngest Cloud SaaS” — đang **self-hosted** trên Railway
- ❌ “Separate Honeycomb/Jaeger” — OTLP đi qua Langfuse
- ❌ “Stripe live payments” — skeleton test mode
- ❌ “Clerk Production pk_live” — đang pk_test trên vercel.app (đủ cho mẹ + demo)

### Nên nói (impressive + honest)

- ✅ “Shipped end-to-end production with CI eval gate”
- ✅ “Designed for elderly accessibility — real user (mom)”
- ✅ “Hybrid RAG with fallback when embeddings unavailable”
- ✅ “JWT-verified account linking, optional anonymous onboarding”
- ✅ “Monorepo 11 packages, OpenAPI, E2E, observability hooks”

---

## Technical deep-dive (interview crib sheet)

| Topic | File / endpoint | One sentence |
|-------|-----------------|--------------|
| RAG stream + OTEL | `apps/api/src/routes/rag-stream.ts` | Span wraps full SSE; attributes for cache, state, rejection |
| Inngest | `apps/api/src/jobs/inngest-client.ts`, `queue.ts` | Cloud emit or local queue with retry |
| Clerk JWT | `apps/api/src/middleware/clerk-auth.ts` | Optional Bearer verify; mom skips login |
| Mom unlimited | Railway `PREMIUM_DISPLAY_NAMES=Mẹ,Hạnh,Mom` | Name whitelist, not Stripe |
| Eval | `packages/ai-core/eval/` | 50 queries, keyword retrieval on golden corpus |
| SM-2 / Elo | `packages/learning-engine/` | Spaced repetition + difficulty |
| Mutation | `packages/mutation-engine/` | Hourly cron tunes RAG topK from telemetry |

---

## Metrics (verifiable — đưa số này khi phỏng vấn)

| Metric | Value | Verify |
|--------|-------|--------|
| Live URLs | Web + API | `pnpm smoke:prod` |
| RAG eval | 50/50 (100%) | `pnpm eval:rag` |
| E2E | 7/7 Playwright | `pnpm test:e2e` |
| Exam bank | 250 Q, 5 sets | `/learning/exam-sets?stateCode=WA` |
| API version | 0.7.1 | `/health` |
| Infra cost | $0/mo | Free tiers |
| Real users | Family (mom Hạnh) | Honest — portfolio + production |

---

## Tech stack (2025–2026)

**Frontend:** Next.js 16 · React 19 · PWA · Clerk · Sentry · PostHog · Vercel Analytics · Speed Insights  
**Backend:** Hono · TypeScript · Drizzle · **OpenTelemetry** · **Inngest SDK** · Stripe · web-push  
**Data:** Neon PostgreSQL 16 · pgvector · Upstash Redis  
**AI:** Groq · Ollama (local) · OpenAI embed (optional) · Langfuse  
**DevOps:** GitHub Actions · Docker · Railway · Vercel · OpenAPI 3 · k6 load script  

---

## Env vars Tier 2 (optional — bật khi muốn demo sâu hơn)

```env
# OpenTelemetry → Honeycomb/Jaeger/GR Cloud free tier
OTEL_EXPORTER_OTLP_ENDPOINT=https://...
OTEL_SERVICE_NAME=wa-drive-api

# Inngest Cloud → inngest.com free tier
INNGEST_EVENT_KEY=...
```

Railway (mom unlimited — **đã set**):
```env
PREMIUM_DISPLAY_NAMES=Mẹ,Hạnh,Mom
FAMILY_UNLIMITED=false
```

---

## STAR story (behavioral)

**Situation:** Mom (Hạnh) cần thi bằng WA; app quiz generic hallucinate; UI tiếng Anh nhỏ.  
**Task:** App tiếng Việt, đáp án đúng DMV, dễ dùng cho người lớn tuổi, deploy thật.  
**Action:** Curated 250 câu, RAG PDF 191 trang, SM-2 + exam 40 câu, PWA offline, Clerk sync, CI eval 50 queries, OTEL + job queue patterns.  
**Result:** Mom học unlimited; app live production; portfolio senior-level với honest scale story.

---

## Links

- **Demo:** https://wa-drive-vietnamese-academy.vercel.app  
- **API Swagger:** https://api-production-72db.up.railway.app/docs  
- **Repo:** https://github.com/Khoido06/wa-drive-vietnamese-academy  

---

*MIT · Built to help my mom (Hạnh) pass the Washington driver test*
