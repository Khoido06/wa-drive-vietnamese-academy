# Clerk Auth (Optional)

> **Khuyên mẹ Hạnh đăng nhập 1 lần** để đồng bộ tiến độ khi đổi điện thoại.  
> Vẫn học được nếu chưa login — unlimited qua tên **Hạnh** trên Railway.

---

## Luồng cho mẹ Hạnh (khuyên dùng)

1. Mở https://wa-drive-vietnamese-academy.vercel.app
2. Onboarding → nhập **Hạnh**
3. Bước **Lưu tiến độ** → **Đăng nhập** (email hoặc Google)
4. Học / thi — tiến độ lưu cloud, đổi máy đăng nhập lại là có

**Con giúp mẹ:** tạo tài khoản email/Gmail trên `/sign-in` lần đầu.

---

## Setup Clerk trên vercel.app (Mức 2 — không cần domain riêng)

### 1. Clerk Dashboard → **Development**

1. [dashboard.clerk.com](https://dashboard.clerk.com) → **Go to app**
2. **Configure → Paths** (không phải Domains Primary):

| Field | Giá trị |
|-------|---------|
| Home URL | `https://wa-drive-vietnamese-academy.vercel.app` |
| Sign-in URL | `https://wa-drive-vietnamese-academy.vercel.app/sign-in` |
| Sign-up URL | `https://wa-drive-vietnamese-academy.vercel.app/sign-up` |
| After sign-in | `https://wa-drive-vietnamese-academy.vercel.app/` |

3. **Configure → API keys** (tab **Development**) → `pk_test_` + `sk_test_`
4. **User & authentication** → bật **Email** và **Google** (dễ cho mẹ có Gmail)

> **Domains** (`fine-mallard-61.clerk.accounts.dev`) — để nguyên, không cần sửa.

### 2. Vercel env (Production)

| Biến | Giá trị |
|------|---------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | `pk_test_...` |
| `CLERK_SECRET_KEY` | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |

Redeploy sau khi set.

### 3. Railway (unlimited cho mẹ)

```env
FAMILY_UNLIMITED=false
PREMIUM_DISPLAY_NAMES=Mẹ,Hạnh,Lan,Mom
```

Mẹ nhập **Hạnh** lúc onboarding → giữ tên khi link Clerk (code merge `wa_display_name`).

---

## Verify

- [ ] Nút **Đăng nhập** góc phải
- [ ] Mẹ đăng ký → avatar hiện → refresh vẫn đăng nhập
- [ ] Làm vài câu học → đăng xuất → đăng nhập lại → tiến độ còn
- [ ] Banner **💾 Lưu tiến độ** trên trang chủ (khi chưa login)

Console có thể báo *development keys* — OK với `pk_test_`.

---

## Luồng kỹ thuật

```
Mẹ nhập Hạnh → localStorage wa_display_name + wa_user_id

Đăng nhập Clerk:
  UserSync → POST /users/link { clerkId, displayName: "Hạnh", localUserId }
  → merge tiến độ cũ + clerk_id trên Neon
  → setUserId(linked.id) — cùng user trên mọi máy
```

Code: `user-sync.tsx`, `engine.ts` (`linkClerkUser`), `sync-login-banner.tsx`, `mom-onboarding.tsx` (bước Lưu tiến độ).

---

## Mức 3 — Production thật (sau này)

Domain riêng + `pk_live_` — xem `./scripts/setup-clerk-production.sh`.

---

## Chi phí

Clerk Free: **10,000 MAU/tháng** — đủ gia đình.

*Liên quan: [BILLING.md](./BILLING.md)*
