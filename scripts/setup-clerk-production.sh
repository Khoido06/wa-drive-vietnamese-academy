#!/usr/bin/env bash
# Bật Clerk Production trên Vercel — chạy sau khi có pk_live_ + sk_live_ từ dashboard.clerk.com
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== Clerk Production → Vercel ==="
echo ""
echo "Lấy keys tại: https://dashboard.clerk.com → Production → API Keys"
echo "  - Publishable: pk_live_..."
echo "  - Secret:      sk_live_..."
echo ""

read -r -p "Paste NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY (pk_live_...): " PK
read -r -s -p "Paste CLERK_SECRET_KEY (sk_live_...): " SK
echo ""

if [[ ! "$PK" =~ ^pk_live_ ]]; then
  echo "❌ Publishable key phải bắt đầu bằng pk_live_ (không dùng pk_test_ trên production)"
  exit 1
fi
if [[ ! "$SK" =~ ^sk_live_ ]]; then
  echo "❌ Secret key phải bắt đầu bằng sk_live_"
  exit 1
fi

echo ""
echo "→ Gỡ key test cũ (nếu có) và thêm key production..."

for var in NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY CLERK_SECRET_KEY; do
  npx vercel env rm "$var" production --yes 2>/dev/null || true
done

printf '%s' "$PK" | npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production
printf '%s' "$SK" | npx vercel env add CLERK_SECRET_KEY production

for var in NEXT_PUBLIC_CLERK_SIGN_IN_URL NEXT_PUBLIC_CLERK_SIGN_UP_URL; do
  npx vercel env rm "$var" production --yes 2>/dev/null || true
done
printf '%s' "/sign-in" | npx vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production
printf '%s' "/sign-up" | npx vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production

echo ""
echo "→ Redeploy Vercel production..."
npx vercel deploy --prod --yes

echo ""
echo "✅ Xong. Kiểm tra:"
echo "  1. https://wa-drive-vietnamese-academy.vercel.app — nút Đăng nhập"
echo "  2. DevTools console — không còn 'development keys'"
echo "  3. Clerk Dashboard → Domains → wa-drive-vietnamese-academy.vercel.app"
echo ""
echo "Mẹ vẫn không cần đăng nhập — bỏ qua nút Đăng nhập là được."
