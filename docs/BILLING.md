# Stripe Billing Setup

Optional — **mom stays on Free (WA) forever** without Stripe.

---

## 1. Create Stripe account

1. [dashboard.stripe.com](https://dashboard.stripe.com) → Test mode
2. Products → create **Pro** ($4.99/mo) and **Family** ($9.99/mo)
3. Copy Price IDs

## 2. Webhook

Developers → Webhooks → Add endpoint:

```
https://YOUR-API/billing/webhook
```

Events:
- `checkout.session.completed`
- `customer.subscription.deleted`

## 3. Env vars (Railway API)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_FAMILY=price_...
WEB_URL=https://wa-drive-vietnamese-academy.vercel.app
```

## 4. DB migration

```bash
pnpm db:push
```

Backfill existing chunks (Neon SQL console):

```sql
UPDATE rag_chunks SET state_code = 'WA' WHERE state_code IS NULL;
```

Or: `node --import tsx scripts/backfill-state-code.ts`

## 5. Free tier limits (default)

| Limit | Free | Pro/Family |
|-------|------|------------|
| Tutor questions/day | 10 | Unlimited |
| Practice/day | 20 | Unlimited |
| States | WA only | WA + CA/TX/FL |

Override: `FREE_TUTOR_DAILY`, `FREE_PRACTICE_DAILY`

## 5b. Unlimited for mom (no Stripe)

**Option A — by display name only (recommended for mom):** Railway API env:

```env
FAMILY_UNLIMITED=false
PREMIUM_DISPLAY_NAMES=Mẹ,Cô Lan,Lan
```

Mom must enter one of these names at onboarding. Other users stay on Free limits.

**Option B — grant Pro in database** (after mom opens app once):

```bash
pnpm grant:premium -- "Cô Lan"
pnpm grant:premium -- --all-matching "Mẹ"
```

Do **not** set `FAMILY_UNLIMITED=true` unless you want everyone unlimited.

---

## 6. Clerk auth (optional — mom does NOT need login)

**Mẹ:** mở app, nhập tên **Cô Lan** / **Mẹ** → học/thi/AI — **không cần đăng nhập**.

Clerk chỉ cho:
- Sync tiến độ khi **đổi điện thoại**
- **Con** xem tiến độ qua account (kết hợp Family tier)

**Production khuyên dùng:** không set Clerk keys (app chạy không warning).

**Bật sau:** `pk_live_` + `sk_live_` trên Vercel — chi tiết → **[docs/CLERK.md](./CLERK.md)**

---

## 7. RAG A/B (optional)

```env
RAG_AB_ENABLED=true
```

Variants: topK=3 vs topK=7

## 8. Verify

```bash
curl https://YOUR-API/rag/status
curl https://YOUR-API/billing/status/USER_ID
```
