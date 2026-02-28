#!/usr/bin/env bash
set -euo pipefail

# TODO: auf deinen Projektpfad anpassen
ROOT="/apps/TODO_PROJECT_NAME"
REPO_DIR="$ROOT"
COMPOSE_FILE="$ROOT/docker-compose.yml"
BRANCH="${DEPLOY_BRANCH:-main}"

# Services, die beim Deploy NICHT neu gebaut werden sollen
EXCLUDE_REGEX='^(webhook)$'

exec 9>/tmp/deploy-TODO_PROJECT_NAME.lock
if ! flock -n 9; then
  echo "[deploy] Deploy läuft bereits – Abbruch."
  exit 0
fi

echo "[deploy] 📦 Deployment: TODO_PROJECT_NAME"
echo "[deploy] REPO: $REPO_DIR | BRANCH: $BRANCH"

mkdir -p /root/.ssh
chmod 700 /root/.ssh
chmod 600 /root/.ssh/id_ed25519 || true
touch /root/.ssh/known_hosts
ssh-keyscan -H github.com >> /root/.ssh/known_hosts 2>/dev/null || true

export GIT_SSH_COMMAND="ssh -i /root/.ssh/id_ed25519 -o IdentitiesOnly=yes -o StrictHostKeyChecking=yes"
git config --global --add safe.directory "$REPO_DIR" >/dev/null 2>&1 || true

cd "$REPO_DIR"
echo "[deploy] 🔄 Git Update…"
git fetch origin --prune
git checkout -f "$BRANCH"
git reset --hard "origin/$BRANCH"

echo "[deploy] 🧩 Ermittle Services…"
SERVICES_RAW="$(docker compose -f "$COMPOSE_FILE" config --services | grep -Ev "$EXCLUDE_REGEX" || true)"
if [[ -z "${SERVICES_RAW// }" ]]; then
  echo "[deploy] ❌ Keine Services gefunden (oder alles ausgeschlossen)."
  exit 1
fi
mapfile -t SERVICES <<< "$SERVICES_RAW"

echo "[deploy] 🛠️ Build: ${SERVICES[*]}"
docker compose -f "$COMPOSE_FILE" build "${SERVICES[@]}"

echo "[deploy] 🚀 Up: ${SERVICES[*]}"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans "${SERVICES[@]}"

echo "[deploy] ✅ Fertig."
