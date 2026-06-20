# B2B API — Driving Schools

Embed the WA Drive AI tutor in your driving school app or website.

---

## Quick start

1. Admin creates org at `/admin` → **Driving schools (B2B)**
2. Save the `wa_sk_...` API key (shown once)
3. Call the B2B endpoint with header `X-API-Key`

---

## Endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/b2b/health` | API key |
| POST | `/b2b/v1/rag/query/stream` | API key |

### Stream tutor (SSE)

```bash
curl -N -X POST https://YOUR-API/b2b/v1/rag/query/stream \
  -H "X-API-Key: wa_sk_..." \
  -H "Content-Type: application/json" \
  -d '{"query":"Tốc độ tối đa trong khu dân cư?","stateCode":"WA"}'
```

Events: `meta` → `trace` → `token`* → `done`

---

## Limits

- **100 requests/min** per org (Upstash when configured)
- **Seat limit** default 50 (configurable in admin)
- Same RAG pipeline as consumer app (validator + cache)

---

## School tier ($49/mo)

Stripe School plan maps to org features (manual org creation for now).

See [BILLING.md](./BILLING.md) for Stripe setup.

---

## Caregiver / Family

Family tier learners share read-only progress:

```
POST /family/invite  { learnerUserId }
GET  /family/shared/:token
```

Web: `/family` and `/family/view/:token`
