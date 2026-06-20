# Scale Roadmap — Balanced A + B + C

> **Goal:** Grow from mom-friendly MVP → portfolio-grade platform → commercial product  
> **Priority weight:** B (engineering) 40% · C (commercial) 40% · A (family UX) 20%  
> **Constraint:** Core learning stays free; premium unlocks scale features, not basic access

---

## North Star

```
Mom uses it free today          →  Retention (A)
Engineering story for resume    →  Credibility (B)
Driving schools / communities   →  Revenue (C)
```

One codebase, three audiences — không fork product.

---

## Three Pillars (Balanced)

| Pillar | Audience | What "done" looks like |
|--------|----------|------------------------|
| **A — Family** | Người già + con cái | Auth, sync progress, voice input, caregiver view |
| **B — Engineering** | Recruiters / tech leads | RAG eval CI, admin ops, A/B mutations, observability |
| **C — Commercial** | Trường lái xe, cộng đồng Việt | Multi-state, Stripe tiers, B2B API keys, white-label |

**Nguyên tắc trung hoà:** Mỗi phase ship **ít nhất 1 item từ B và 1 item từ C**, kèm **1 item A nhẹ** (không block B/C).

---

## Monetization Model (C-first, mom-safe)

| Tier | Price | Includes |
|------|-------|----------|
| **Free** | $0 | 10 tutor questions/day, 20 practice/day, WA only, TTS |
| **Pro** | $4.99/mo | Unlimited, mock exam, progress history, 1 extra state |
| **Family** | $9.99/mo | Pro + caregiver dashboard (2 linked accounts) |
| **School** | $49/mo | B2B API key, admin panel, 50 seats, custom branding |

> Mom tier Free **không bao giờ** bị paywall học cơ bản — premium = convenience + scale, not access.

---

## Phase Plan (~12 weeks)

### Phase 1 — Foundation for B + C (Week 1–2)

**Theme:** Identity + billing skeleton + first eval gate

| Track | Deliverable | Package / area |
|-------|-------------|----------------|
| **B** | RAGAS eval suite (50 golden Q&A) in CI | `packages/ai-core/eval/` |
| **B** | Admin read-only dashboard: traces, mutations, chunk count | `apps/web/app/admin/` |
| **C** | Stripe Checkout + webhook (`subscription_tier` on `users`) | `apps/api/src/routes/billing/` |
| **C** | `state_code` column on `rag_chunks` + filter in retriever | `packages/db`, `ai-core` |
| **A** | Clerk auth (optional login) — merge localStorage user → account | `apps/web`, `apps/api` |

**Exit criteria:**
- CI fails if RAG faithfulness < 0.85 on golden set
- `/admin` shows last 50 `rag_traces` (auth-protected)
- Stripe test mode: Free → Pro upgrade works
- Query scoped to `state_code=WA` (default)

**Resume line:**
> *Implemented RAG regression eval in CI (RAGAS) and Stripe subscription tiers with admin observability dashboard.*

---

### Phase 2 — Quality at Scale (Week 3–4)

**Theme:** Cache + A/B + second state

| Track | Deliverable | Package / area |
|-------|-------------|----------------|
| **B** | A/B mutation testing (2 RAG configs, winner by telemetry) | `mutation-engine` |
| **B** | OpenAI embed prod + pgvector HNSW re-index script | `ai-core`, `scripts/` |
| **B** | RAG response cache (Upstash, normalized query hash, 24h TTL) | `apps/api` |
| **C** | California driver guide ingest (2nd corpus) | `docs/`, ingest pipeline |
| **C** | State picker in UI + Pro unlocks 2nd state | `apps/web` |
| **A** | Voice input (STT) on tutor page — Web Speech API | `apps/web/app/tutor/` |

**Exit criteria:**
- Cache hit rate visible in `/rag/status`
- CA + WA both searchable
- A/B test runs 7 days, auto-applies winning `topK`

**Resume line:**
> *Built A/B-tested RAG config mutations with Redis caching and multi-corpus retrieval across 2 states.*

---

### Phase 3 — Platform & B2B (Week 5–7)

**Theme:** Sell to schools, not just individuals

| Track | Deliverable | Package / area |
|-------|-------------|----------------|
| **B** | Full validator AI (2nd LLM pass on stream answers) | `ai-core/rag/validator.ts` |
| **B** | Human feedback loop (👍/👎) → retrieval weight tuning | `apps/web`, `mutation-engine` |
| **C** | B2B API keys (`organizations` table, rate limit per key) | `apps/api/middleware/` |
| **C** | School admin: seat management, usage report | `apps/web/app/admin/` |
| **C** | Public pricing page + Stripe Customer Portal | `apps/web/app/pricing/` |
| **A** | Caregiver link (Family tier): read-only progress share | `apps/web/app/family/` |

**Exit criteria:**
- Driving school can sign up, get API key, embed tutor widget
- Caregiver sees mom's mastery % without edit access

**Resume line:**
> *Launched B2B API with org-scoped keys and caregiver progress sharing for elderly learners.*

---

### Phase 4 — Growth & Ops (Week 8–10)

**Theme:** Operate like a real SaaS

| Track | Deliverable | Package / area |
|-------|-------------|----------------|
| **B** | Inngest job queue: ingest, re-embed, batch question gen | `apps/api/jobs/` |
| **B** | PostHog funnels: Home → Learn → Exam → Upgrade | already wired, add events |
| **C** | Affiliate / referral code (Stripe promotion) | billing routes |
| **C** | White-label: custom logo + domain per org | `organizations.branding` |
| **A** | Push notifications (SM-2 review reminder) | Web Push + cron |
| **A** | Offline exam cache (50 questions in SW) | `apps/web/public/sw.js` |

---

### Phase 5 — Scale Infra (Week 11–12)

| Track | Deliverable |
|-------|-------------|
| **B** | Load test (k6): 100 concurrent RAG streams |
| **B** | RAGAS expanded to 200 questions, per-state suites |
| **C** | TX + FL corpora (4 states total) |
| **C** | Enterprise tier: SLA, dedicated support email |
| **A** | Onboarding wizard v2 (state + exam date + daily goal) |

---

## Architecture Additions

```
                    ┌─────────────────────────────────────┐
                    │           apps/web                   │
                    │  PWA · Admin · Pricing · Family      │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────────────┐
                    │           apps/api                   │
                    │  Auth · Billing · B2B keys · Cache   │
                    └──────────────┬──────────────────────┘
           ┌───────────────────────┼───────────────────────┐
           ▼                       ▼                       ▼
    packages/ai-core        packages/mutation-engine   Upstash
    eval/ · validator       A/B · feedback loop        cache + RL
           │                       │
           └─────────── Neon (multi-state chunks) ──────┘
```

### New DB tables (Phase 1–3)

```sql
-- Phase 1
ALTER TABLE users ADD COLUMN subscription_tier text DEFAULT 'free';
ALTER TABLE users ADD COLUMN clerk_id text UNIQUE;
ALTER TABLE rag_chunks ADD COLUMN state_code text DEFAULT 'WA';

-- Phase 3
CREATE TABLE organizations (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  api_key_hash text NOT NULL,
  seat_limit int DEFAULT 50,
  branding jsonb,
  stripe_customer_id text
);

CREATE TABLE caregiver_links (
  id uuid PRIMARY KEY,
  learner_user_id uuid REFERENCES users(id),
  caregiver_user_id uuid REFERENCES users(id),
  permission text DEFAULT 'read'
);
```

---

## Tech Choices (free-tier friendly → paid when revenue)

| Need | Phase 1 choice | Scale-up |
|------|----------------|----------|
| Auth | Clerk (free 10k MAU) | Clerk Pro |
| Payments | Stripe (test → live) | Stripe Connect for affiliates |
| Eval | RAGAS + golden JSON in repo | Langfuse datasets |
| Admin | Next.js `/admin` + Clerk role | Retool optional |
| B2B keys | Hono middleware + hashed keys | Kong / Cloudflare API gateway |
| Jobs | Inngest free tier | BullMQ on Railway |

---

## What NOT to Build Yet

- Native iOS/Android app (PWA đủ cho mom)
- Fine-tune custom LLM (RAG + prompt đủ)
- Multi-language beyond vi/en (focus Vietnamese elderly first)
- Real-time multiplayer exam ( không cần cho DMV prep)

---

## Immediate Next Steps (Start Phase 1)

Recommended order — **B và C song song**:

1. **`packages/ai-core/eval/`** — 50 golden Q&A từ driver guide, RAGAS in CI  
2. **Stripe test mode** — `users.subscription_tier`, webhook, `/pricing` page  
3. **`state_code` migration** — WA default, retriever filter  
4. **Clerk auth** — optional login, merge localStorage user  
5. **`/admin` dashboard** — rag traces + mutation log (Clerk admin role)

```bash
# After Phase 1
pnpm eval:rag          # local RAGAS run
pnpm db:migrate        # state_code + subscription_tier
```

---

## Success Metrics

| Metric | Phase 1 target | Phase 3 target |
|--------|----------------|----------------|
| RAG faithfulness (eval) | ≥ 0.85 | ≥ 0.90 |
| Paying users | 0 (test mode) | 10 Pro + 1 School |
| States live | 1 (WA) | 3 |
| CI eval runtime | < 3 min | < 5 min |
| Mom daily active (family) | 1 | 1 (unchanged 😊) |

---

## One-Liner Evolution

```
Today:   AI tutor for Vietnamese elderly — free tier, WA only
Phase 2: Multi-state RAG platform with eval-gated CI
Phase 3: B2B SaaS for Vietnamese driving schools in the US
```

---

*Linked from [ARCHITECTURE.md](./ARCHITECTURE.md) · Observability: [OBSERVABILITY.md](./OBSERVABILITY.md)*
