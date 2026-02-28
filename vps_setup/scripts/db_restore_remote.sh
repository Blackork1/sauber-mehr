#!/usr/bin/env bash
set -euo pipefail

# Stellt einen lokalen Dump auf dem VPS wieder her.
# Beispiel:
#   DUMP_FILE=./backup.dump REMOTE_DB_HOST=127.0.0.1 REMOTE_DB_PORT=5434 \
#   REMOTE_DB_USER=app_user REMOTE_DB_NAME=app_db PGPASSWORD='xxx' ./db_restore_remote.sh

DUMP_FILE="${DUMP_FILE:-}"
REMOTE_DB_HOST="${REMOTE_DB_HOST:-127.0.0.1}"
REMOTE_DB_PORT="${REMOTE_DB_PORT:-5432}"
REMOTE_DB_USER="${REMOTE_DB_USER:-postgres}"
REMOTE_DB_NAME="${REMOTE_DB_NAME:-app_db}"

if [[ -z "$DUMP_FILE" || ! -f "$DUMP_FILE" ]]; then
  echo "[restore] Bitte DUMP_FILE auf vorhandene Datei setzen."
  exit 1
fi

: "${PGPASSWORD:?Bitte PGPASSWORD setzen (remote DB-Passwort).}"

echo "[restore] Warnung: Ziel-DB wird geleert: $REMOTE_DB_NAME"
psql -h "$REMOTE_DB_HOST" -p "$REMOTE_DB_PORT" -U "$REMOTE_DB_USER" -d postgres -v ON_ERROR_STOP=1 <<SQL
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = '${REMOTE_DB_NAME}' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS "${REMOTE_DB_NAME}";
CREATE DATABASE "${REMOTE_DB_NAME}";
SQL

echo "[restore] Restore läuft..."
pg_restore \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --host "$REMOTE_DB_HOST" \
  --port "$REMOTE_DB_PORT" \
  --username "$REMOTE_DB_USER" \
  --dbname "$REMOTE_DB_NAME" \
  "$DUMP_FILE"

echo "[restore] Fertig."
