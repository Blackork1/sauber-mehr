#!/usr/bin/env bash
set -euo pipefail

# Exportiert lokale Testdaten als SQL-Dump.
# Voraussetzungen:
# - psql/pg_dump installiert
# - Zugriff auf lokale DB

LOCAL_DB_HOST="${LOCAL_DB_HOST:-127.0.0.1}"
LOCAL_DB_PORT="${LOCAL_DB_PORT:-5432}"
LOCAL_DB_USER="${LOCAL_DB_USER:-postgres}"
LOCAL_DB_NAME="${LOCAL_DB_NAME:-app_db}"
OUT_FILE="${OUT_FILE:-./backup_local_$(date +%F_%H%M%S).dump}"

: "${PGPASSWORD:?Bitte PGPASSWORD setzen (lokales DB-Passwort).}"

echo "[dump] Erstelle Dump: $OUT_FILE"
pg_dump \
  --format=custom \
  --no-owner \
  --no-privileges \
  --host "$LOCAL_DB_HOST" \
  --port "$LOCAL_DB_PORT" \
  --username "$LOCAL_DB_USER" \
  --dbname "$LOCAL_DB_NAME" \
  --file "$OUT_FILE"

echo "[dump] Fertig: $OUT_FILE"
