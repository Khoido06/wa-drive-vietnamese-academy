#!/usr/bin/env bash
# Export local Postgres for Neon (run after pnpm infra:up + ingest)
set -euo pipefail

OUT="${1:-./backup/wa-drive-backup.sql}"
mkdir -p "$(dirname "$OUT")"

echo "Exporting database..."
docker exec wa-drive-postgres pg_dump -U wa_drive -d wa_drive_academy --no-owner --no-acl > "$OUT"
echo "✅ Saved to $OUT"
echo ""
echo "Import to Neon:"
echo "  psql \"\$DATABASE_URL\" -f $OUT"
