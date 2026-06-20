# Clerk Auth (Optional)

> **Mẹ không cần đăng nhập.** App chạy đầy đủ với tên + localStorage.  
> Clerk chỉ hữu ích khi **đổi điện thoại** hoặc **con muốn xem tiến độ** qua tài khoản.

---

## Ai cần gì?

| Người dùng | Cần đăng nhập? | Cách dùng |
|------------|----------------|-----------|
| **Mẹ** | ❌ Không | Mở app → nhập **Cô Lan** / **Mẹ** → học/thi/AI ngay |
| **Con (caregiver)** | ✅ Tuỳ chọn | Đăng nhập Clerk → xem tiến độ (Family tier) hoặc setup giúp mẹ |
| **User trả phí Pro** | ✅ Tuỳ chọn | Sync tiến độ giữa nhiều thiết bị |

Mẹ unlimited free qua **tên** (`PREMIUM_DISPLAY_NAMES`), **không** qua Clerk hay Stripe.

---

## Hiện trạng production (khuyên dùng)

**Không set Clerk keys** → không có nút Đăng nhập, không cảnh báo console.

App vẫn:
- Học / thi / AI tutor
- Unlimited cho mẹ (tên Cô Lan, Mẹ, Lan, Mom)
- Offline thi Bộ đề 1

---

## Khi nào bật Clerk Production?

Bật khi bạn muốn:

1. **Mẹ đổi điện thoại** — đăng nhập lại → tiến độ sync từ cloud
2. **Con xem tiến độ** — Family share link + account
3. **Portfolio / scale** — user Pro sync cross-device

---

## Setup Production (Cách B)

### 1. Clerk Dashboard

1. [dashboard.clerk.com](https://dashboard.clerk.com) → chọn app
2. Chuyển **Development** → **Production**
3. **Configure → Domains** → thêm:
   ```
   wa-drive-vietnamese-academy.vercel.app
   ```
4. **Configure → API Keys** (tab Production) → copy:
   - `pk_live_...` (Publishable)
   - `sk_live_...` (Secret)

⚠️ **Không dùng** `pk_test_` trên Vercel Production — code sẽ tắt Clerk và vẫn báo warning.

### 2. Vercel env (Production only)

| Biến | Giá trị |
|------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_live_...` |
| `CLERK_SECRET_KEY` | `sk_live_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

Xóa các key `pk_test_` / `sk_test_` cũ → **Redeploy**.

Hoặc chạy script (sau khi có `pk_live_` / `sk_live_`):

```bash
chmod +x scripts/setup-clerk-production.sh
./scripts/setup-clerk-production.sh
```

### 3. Clerk paths

| Setting | Value |
|---------|-------|
| Home URL | `https://wa-drive-vietnamese-academy.vercel.app` |
| After sign-in | `/` |

**Sign-in methods gợi ý cho người Việt lớn tuổi:**
- Email + password
- Google (nếu có Gmail)
- Tránh SMS phức tạp nếu không cần

### 4. DB (đã có sẵn)

```bash
pnpm db:migrate:users-auth
```

Cột `users.clerk_id` dùng để link Clerk ↔ tiến độ học.

---

## Luồng kỹ thuật

```
Mẹ (không login):
  localStorage wa_user_id → API /users → Neon

User đăng nhập Clerk:
  Clerk session → UserSync → POST /users/link
  → merge localUserId + clerkId → một user Neon
```

Code: `apps/web/components/user-sync.tsx`, `packages/learning-engine/src/engine.ts` (`linkClerkUser`).

Production guard: `apps/web/lib/clerk-config.ts` — tắt Clerk nếu `pk_test_` trên production.

---

## Hướng dẫn ngắn cho mẹ (không cần Clerk)

Gửi mẹ:

1. Mở https://wa-drive-vietnamese-academy.vercel.app
2. Add to Home Screen
3. Nhập tên **Cô Lan** (bỏ qua đăng nhập)
4. Học → Thi thử → Hỏi AI

**Không cần** bấm "Đăng nhập" — bỏ qua nút đó nếu thấy.

---

## Hướng dẫn cho con (khi đã bật Clerk)

1. Mẹ học bình thường **không login** (hoặc login 1 lần trên máy mẹ nếu muốn backup tiến độ)
2. Con vào **Gia đình** (`/family`) → tạo link chia sẻ (cần gói Family)
3. Hoặc con **đăng nhập Clerk** trên máy mẹ giúp mẹ link account trước khi đổi phone

---

## Verify

Sau deploy Vercel với `pk_live_`:

- [ ] Nút **Đăng nhập** hiện góc phải
- [ ] Console **không** có `development keys` warning
- [ ] Đăng nhập → tiến độ vẫn có sau refresh
- [ ] Mẹ không login vẫn học/thi bình thường

```bash
# App không load Clerk nếu thiếu key hoặc pk_test trên prod
# Kiểm tra: mở DevTools → không thấy clerk.browser.js (khi tắt)
```

---

## Chi phí

Clerk Free: **10,000 MAU/tháng** — đủ cho gia đình + vài user.

---

*Liên quan: [BILLING.md](./BILLING.md) (mom unlimited) · [OBSERVABILITY.md](./OBSERVABILITY.md)*
