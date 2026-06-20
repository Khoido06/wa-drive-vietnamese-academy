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
EMBED_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=1536
OPENAI_API_KEY=sk-...   # chỉ cần nếu chưa import DB từ bước 1
WA_DRIVER_GUIDE_PDF_PATH=./docs/driver-guide-vi.pdf
MUTATION_ENABLED=true
```

6. Deploy → copy URL (vd: `https://wa-drive-api-production.up.railway.app`)
7. Test: `curl https://YOUR-API/health`

> Nếu đã import DB từ bước 1 → bỏ qua ingest. Nếu chưa: `curl -X POST https://YOUR-API/rag/ingest`

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
