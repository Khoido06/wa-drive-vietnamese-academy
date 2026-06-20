# WA Drive Vietnamese Academy — Singularity Architecture

> Self-improving AI learning organism for Vietnamese elderly learners preparing for the Washington Driver Test.

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLOSED-LOOP LEARNING CYCLE                       │
│                                                                          │
│  User Action → Telemetry → Analytics → Insight → Mutation → Deploy      │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   LAYER 1    │  │   LAYER 2    │  │   LAYER 3    │  │   LAYER 4    │
│   PRODUCT    │  │ INTELLIGENCE │  │   LEARNING   │  │    SELF-     │
│   (PWA UI)   │→ │  (RAG Brain) │→ │    LOOP      │→ │ IMPROVEMENT  │
│              │  │              │  │   ENGINE     │  │   (Mutation) │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
     apps/web       packages/         packages/         packages/
                     ai-core          learning-engine   mutation-engine
                          ↑                                    │
                          └──────── feedback loop ─────────────┘
```

## Monorepo Structure

```
wa-drive-vietnamese-academy/
├── apps/
│   ├── web/          # Next.js PWA — elderly-first Vietnamese UI
│   └── api/          # Hono API — core services
├── packages/
│   ├── ai-core/      # RAG: ingest → chunk → embed → retrieve → generate
│   ├── learning-engine/  # Adaptive curriculum, spaced repetition
│   ├── mutation-engine/  # Self-improvement from analytics
│   ├── db/           # Drizzle schema + Postgres/pgvector client
│   └── ui/           # Elderly-first design system
└── infra/
    ├── docker-compose.yml
    └── init.sql      # pgvector extension
```

## Layer 1 — Product (apps/web)

**Principles:** Vietnamese-first, one task per screen, large touch targets (min 56px), high contrast, zero clutter.

| Screen | Purpose |
|--------|---------|
| Home | Single CTA — continue learning |
| Learn | RAG-grounded lesson with voice tutor |
| Exam | Adaptive practice test |
| Progress | Mastery visualization |
| Voice | Text-to-speech tutor (Vietnamese) |

PWA: manifest, service worker, offline lesson cache.

## Layer 2 — Intelligence (packages/ai-core)

**Knowledge source:** `docs/driver-guide-vi.pdf` — Vietnamese Washington Driver Guide (sole source).

### Triple-Check RAG Pipeline

```
Query
  ↓
[1] Retriever AI — vector search + rerank
  ↓
[2] Generator AI — grounded answer from chunks only
  ↓
[3] Validator AI — verify answer ⊆ retrieved chunks
  ↓
[4] Re-checker AI — independent second validation
  ↓
Conflict? → REJECT (no answer returned)
Pass?    → Return answer + retrieval trace
```

**Rule:** No response without retrieval trace. Hallucination = system failure.

### Ingestion Pipeline

```
PDF → extract text → semantic chunk (512 tokens, 64 overlap)
    → embed (text-embedding-3-small) → store in rag_chunks (pgvector)
```

## Layer 3 — Learning Loop (packages/learning-engine)

Behaves like Anki + Duolingo + lightweight RL.

### Tracked Signals

| Signal | Use |
|--------|-----|
| User mistakes | Failure cluster detection |
| Question difficulty drift | Dynamic difficulty scoring |
| Retention decay | Spaced repetition intervals |
| Time-to-master | Curriculum reordering |
| Response latency | Confusion detection |

### Adaptive Actions

- Regenerate questions from RAG (never static dataset)
- Update SM-2-inspired spacing algorithm
- Reorder curriculum by failure clusters
- Retrain difficulty scoring via Elo-style rating

## Layer 4 — Self-Improvement (packages/mutation-engine)

### Observed Metrics

- Learning success rate, exam pass rate
- Question accuracy per topic
- RAG retrieval confidence
- User frustration signals (rapid clicks, back navigation)
- Drop-off points per screen

### Mutation Types

| Type | Trigger | Action |
|------|---------|--------|
| `rewrite_question` | High ambiguity score | Regenerate via RAG |
| `adjust_retrieval` | Low confidence | Change top-k, rerank weights |
| `update_chunking` | Weak chunk matches | Adjust chunk size/overlap |
| `improve_prompt` | Validator rejections | Mutate system prompts |
| `reorder_curriculum` | Failure clusters | Move topics earlier |
| `adjust_ui` | Drop-off on screen | Simplify layout |

### Closed Loop

```
Telemetry Event (packages/db)
  → AnalyticsEngine.analyze()
  → InsightGenerator.generate()
  → MutationEngine.propose()
  → MutationEngine.apply() (writes to system_mutations)
  → Next request uses updated config
```

## Internal AI Agents (Simulated Roles)

| Agent | Responsibility |
|-------|----------------|
| Architect | System structure, package boundaries |
| Builder | Production code |
| QA | Failure case simulation |
| Fixer | Repair pipeline breaks |
| RAG Guardian | Enforce no-hallucination rule |
| UX Elderly | 60–70 age accessibility |

## Database Schema (packages/db)

- `users` — learner profiles
- `rag_chunks` — PDF chunks + pgvector embeddings
- `questions` — dynamically generated, never static
- `user_attempts` — every answer with timing
- `mastery_states` — per-topic SM-2 state
- `telemetry_events` — all user/system events
- `system_mutations` — applied self-improvements
- `rag_traces` — every RAG query audit log

## Infrastructure

- **Postgres 16** + pgvector for embeddings
- **Redis** for session cache + event streaming buffer
- **Docker Compose** for local dev

## Environment Variables

See `.env.example` at repo root.

## Validation Loop (Before Every Release)

1. Simulate runtime execution
2. Test failure cases (missing PDF, empty retrieval)
3. Verify incorrect answers are tracked
4. Confirm elderly UX (large buttons, Vietnamese text)
5. Run triple-check RAG with adversarial queries

## Phase Roadmap

| Phase | Deliverable | Status |
|-------|-------------|--------|
| 0 | Architecture + monorepo scaffold | ✅ |
| 1 | Infra + DB schema + RAG ingestion | ✅ |
| 2 | Triple-check RAG API + learning loop | ✅ |
| 3 | Mutation engine + telemetry pipeline | ✅ |
| 4 | Elderly PWA product layer | ✅ |
| 5 | Voice tutor + offline PWA | ✅ |
| 6 | Production deployment + continuous loop | ✅ |
| 7 | Scale: B+C balanced roadmap | 📋 [SCALE_ROADMAP.md](./SCALE_ROADMAP.md) |
| 8 | Phase 3: B2B + validator + caregiver | ✅ |
