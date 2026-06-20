# Clerk Auth (Optional)

> **Mẹ không cần đăng nhập.** App chạy đầy đủ với tên + localStorage.  
> Clerk chỉ hữu ích khi **con muốn thử đăng nhập** hoặc **sync tiến độ** qua tài khoản.

---

## Ba mức (chọn 1)

| Mức | Ai | Clerk keys | Domain |
|-----|-----|------------|--------|
| **1 — Mẹ thi bằng** | Mẹ | Không set | `*.vercel.app` OK |
| **2 — Gia đình / thử login** | Con test trên web live | `pk_test_` / `sk_test_` (Development) | `*.vercel.app` OK |
| **3 — Portfolio / user trả phí** | Scale thật | `pk_live_` / `sk_live_` (Production) | **Domain riêng** bắt buộc |

Mẹ unlimited free qua **tên** (`PREMIUM_DISPLAY_NAMES`), **không** qua Clerk hay Stripe.

---

## Mức 1 — Mẹ (không Clerk)

**Không set** Clerk env trên Vercel → không có nút Đăng nhập.

App vẫn: học / thi / AI tutor / offline Bộ đề 1 / unlimited cho **Hạnh**, **Mẹ**, **Lan**, **Mom**.

---

## Mức 2 — Dev keys trên vercel.app (khuyên dùng hiện tại)

Cho phép **con thử đăng nhập** trên https://wa-drive-vietnamese-academy.vercel.app **không cần mua domain**.

### 1. Clerk Dashboard (Development — không tạo Production)

1. [dashboard.clerk.com](https://dashboard.clerk.com) → **Go to app**
2. Giữ **Development** (không cần "Create production instance")
3. **Configure → Domains** (hoặc Paths) → thêm:
   ```
   https://wa-drive-vietnamese-academy.vercel.app
   ```
4. **Configure → API Keys** (tab **Development**) → copy:
   - `pk_test_...`
   - `sk_test_...`

### 2. Vercel env (Production)

| Biến | Giá trị |
|------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `CLERK_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

**Redeploy** sau khi set env.

### 3. Hạn chế (chấp nhận được cho gia đình)

- Console có thể báo *"development keys"* — bình thường với `pk_test_`
- Google OAuth dùng credential dev của Clerk
- Không dùng cho scale user trả phí lớn

### 4. Verify

- [ ] Nút **Đăng nhập** góc phải
- [ ] `/sign-in` → đăng ký email test → **UserButton** hiện
- [ ] Mẹ **không login** vẫn học/thi bình thường

---

## Mức 3 — Production thật (sau này)

Khi có **domain riêng** (~$10/năm) gắn Vercel:

1. Clerk → **Create production instance**
2. **Domains** → domain riêng (vd. `hoclaixewa.com`) — **không** dùng `*.vercel.app`
3. DNS records → **Deploy certificates**
4. Copy `pk_live_` / `sk_live_` → Vercel Production
5. Chạy:

```bash
./scripts/setup-clerk-production.sh
```

OAuth (Google) production: tạo credentials riêng trên Google Cloud.

---

## Ai cần gì?

| Người dùng | Cần đăng nhập? | Cách dùng |
|------------|----------------|-----------|
| **Mẹ** | ❌ Không | Nhập **Hạnh** / **Mẹ** → học/thi/AI ngay |
| **Con** | ✅ Tuỳ chọn | Mức 2: đăng nhập trên vercel.app |
| **User Pro** | ✅ Tuỳ chọn | Mức 3: sync cross-device với domain riêng |

---

## Luồng kỹ thuật

```
Mẹ (không login):
  localStorage wa_user_id → API /users → Neon

User đăng nhập Clerk:
  Clerk session → UserSync → POST /users/link
  → merge localUserId + clerkId → một user Neon
```

Code: `apps/web/components/user-sync.tsx`, `apps/web/lib/clerk-config.ts`, `apps/web/middleware.ts`.

---

## Hướng dẫn mẹ (không cần Clerk)

1. Mở https://wa-drive-vietnamese-academy.vercel.app
2. Add to Home Screen
3. Nhập tên **Hạnh** — **bỏ qua** nút Đăng nhập
4. Học → Thi thử → Hỏi AI

---

## DB (đã có sẵn)

```bash
pnpm db:migrate:users-auth
```

Cột `users.clerk_id` link Clerk ↔ tiến độ học.

---

## Chi phí

Clerk Free: **10,000 MAU/tháng** — đủ gia đình + vài user.

---

*Liên quan: [BILLING.md](./BILLING.md) (mom unlimited) · [OBSERVABILITY.md](./OBSERVABILITY.md)*
