# Deploy ngay — 15 phút

Repo: **https://github.com/Khoido06/wa-drive-vietnamese-academy**

---

## Bước 1: Neon (Database) — 3 phút

1. Vào [neon.tech](https://neon.tech) → Sign up free
2. **New Project** → tên `wa-drive`
3. SQL Editor → chạy:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
4. Copy **Connection string** → lưu làm `DATABASE_URL`

5. Import dữ liệu từ máy bạn (100 chunks đã ingest):
   ```bash
   chmod +x scripts/export-db.sh
   ./scripts/export-db.sh
   # Paste DATABASE_URL Neon vào:
   psql "postgresql://..." -f backup/wa-drive-backup.sql
   ```

---

## Bước 2: Groq (AI free) — 2 phút

1. Vào [console.groq.com](https://console.groq.com) → Sign up
2. **API Keys** → Create → copy `gsk_...`

---

## Bước 3: Railway (API) — 5 phút

1. Vào [railway.app](https://railway.app) → Login with GitHub
2. **New Project** → **Deploy from GitHub repo**
3. Chọn `Khoido06/wa-drive-vietnamese-academy`
4. Railway tự detect `railway.toml` + Dockerfile
5. **Variables** → Add:

```
DATABASE_URL=postgresql://...neon...
AI_PROVIDER=groq
GROQ_API_KEY=gsk_...
LLM_MODEL=llama-3.1-8b-instant
EMBEDDING_DIMENSIONS=768
WA_DRIVER_GUIDE_PDF_PATH=./docs/driver-guide-vi.pdf
MUTATION_ENABLED=true
```

> **Không cần** `OLLAMA_BASE_URL`, `REDIS_URL`, `NEXT_PUBLIC_API_URL` trên Railway.
> Import Neon backup trước → không cần `OPENAI_API_KEY` cho embedding.

6. **Settings → Deploy** → xóa Custom Start Command (Dockerfile tự chạy `pnpm start`)
7. Deploy → copy URL (vd: `https://api-production-72db.up.railway.app`)
8. Test:
   ```bash
   curl https://YOUR-API/health
   curl -N -X POST https://YOUR-API/rag/query/stream \
     -H "Content-Type: application/json" \
     -d '{"query":"Tốc độ tối đa trong khu dân cư?"}'
   ```

---

## Bước 4: Vercel (Web) — 5 phút

1. Vào [vercel.com](https://vercel.com) → Login with GitHub
2. **Add New Project** → Import `wa-drive-vietnamese-academy`
3. **Root Directory:** `apps/web`
4. **Environment Variables:**
   ```
   NEXT_PUBLIC_API_URL=https://YOUR-RAILWAY-API-URL
   ```
5. **Deploy** → copy URL (vd: `https://wa-drive-vietnamese-academy.vercel.app`)

---

## Xong! 🎉

Gửi link Vercel cho mẹ bạn mở trên điện thoại → **Add to Home Screen** (PWA).

### Resume

```
WA Drive Vietnamese Academy | vercel.app/...
GitHub: github.com/Khoido06/wa-drive-vietnamese-academy
Stack: Next.js 16, Hono, pgvector RAG, Groq AI, Turborepo
```

---

## Vercel CLI (tuỳ chọn)

Terminal đang chờ login tại:
```
https://vercel.com/oauth/device?user_code=MGFD-FHWX
```
Mở link → Allow → CLI sẽ deploy tự động.
