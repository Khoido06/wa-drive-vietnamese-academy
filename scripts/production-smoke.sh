#!/usr/bin/env bash
# Production smoke check — run after deploy
set -euo pipefail

WEB="${WEB_URL:-https://wa-drive-vietnamese-academy.vercel.app}"
API="${API_URL:-https://api-production-72db.up.railway.app}"

echo "=== WA Drive Production Smoke ==="
echo "Web: $WEB"
echo "API: $API"
echo ""

fail=0
check() {
  local name="$1" url="$2" expect="${3:-200}"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "$url" || echo "000")
  if [[ "$code" == "$expect" ]]; then
    echo "✅ $name → $code"
  else
    echo "❌ $name → $code (expected $expect)"
    fail=1
  fi
}

check "Home"              "$WEB/"
check "Sign-in"         "$WEB/sign-in"
check "Sign-up"         "$WEB/sign-up"
check "Exam"            "$WEB/exam"
check "Learn"           "$WEB/learn"
check "Tutor"           "$WEB/tutor"
check "Progress"        "$WEB/progress"
check "Offline bundle"  "$WEB/offline/exam-wa-set-01.json"
check "API health"      "$API/health"
check "Exam sets"       "$API/learning/exam-sets?stateCode=WA"
check "RAG status"      "$API/rag/status"
check "OpenAPI docs"    "$API/docs"

health=$(curl -sS "$API/health")
echo ""
echo "API: $health"

if [[ $fail -ne 0 ]]; then
  echo ""
  echo "❌ Smoke check FAILED"
  exit 1
fi

echo ""
echo "✅ All production checks passed"
