# VPS Setup Bundle (IONOS + Docker + GitHub Webhook)

Dieser Ordner ist als **kopierbares Deployment-Kit** gedacht. Du kannst ihn in ein anderes Projekt übernehmen und nur die markierten Platzhalter anpassen.

## 1) Inhalt dieses Ordners

### A) Platzhalter-Templates (für neue Projekte)

- `docker-compose.template.yml` – Compose-Template mit App, PostgreSQL und Webhook-Service.
- `example.env` – zentrale Variablenliste inkl. Erklärung.
- `deploy/deploy.sh` – Deployment-Script (Git pull/reset + Docker build/up).
- `deploy/webhook/*` – Docker-Webhook-Server (GitHub Signature-Check + Deploy Trigger).
- `scripts/db_dump_local.sh` – Dump deiner lokalen Test-Datenbank.
- `scripts/db_restore_remote.sh` – Restore auf VPS-PostgreSQL.
- `docs/github-webhook-setup.md` – GitHub-Webhook-Einrichtung Schritt für Schritt.
- `docs/ionos-bootstrap.md` – Server-Basissetup (Docker, SSH, Verzeichnisse, Rechte).

### B) Konkrete Referenz (aktuell ausgefüllt)

Damit du direkt siehst, **wie echte Werte aussehen**, gibt es eine befüllte Referenzkopie:

- `filled_example/docker-compose.current.yml`
- `filled_example/.env.current.example`
- `filled_example/deploy/deploy.current.sh`
- `filled_example/deploy/webhook/server.current.js`
- `filled_example/deploy/webhook/Dockerfile`
- `filled_example/deploy/webhook/package.json`

> Diese Dateien dienen als Orientierung. Für neue Projekte bitte weiterhin die Template-Dateien verwenden.

---

## 2) In ein neues Projekt kopieren

1. `vps_setup` in dein Zielprojekt kopieren.
2. Dateien wie folgt verteilen:
   - `vps_setup/docker-compose.template.yml` → `<projekt-root>/docker-compose.yml`
   - `vps_setup/example.env` → `<projekt-root>/.env`
   - `vps_setup/deploy/deploy.sh` → `<projekt-root>/deploy/deploy.sh`
   - `vps_setup/deploy/webhook/*` → `<projekt-root>/deploy/webhook/*`
3. Optional: `filled_example/*` parallel öffnen und Wertevergleich machen.
4. In allen Dateien die `TODO:`-Markierungen ersetzen.
5. `deploy/deploy.sh` ausführbar machen:
   ```bash
   chmod +x deploy/deploy.sh
   ```

---

## 3) Schnellstart auf dem VPS

1. Basissetup durchführen: `docs/ionos-bootstrap.md`
2. Projekt unter `/home/webadmin/apps/<projekt-name>` klonen.
3. `.env` aus `example.env` erstellen und befüllen (mit Hilfe von `filled_example/.env.current.example`).
4. Docker starten:
   ```bash
   docker compose up -d --build
   ```
5. GitHub Webhook konfigurieren: `docs/github-webhook-setup.md`
6. Datenbank importieren (optional, falls lokale Testdaten vorhanden):
   - Lokal: `scripts/db_dump_local.sh`
   - VPS: `scripts/db_restore_remote.sh`

---

## 4) Anpassungspunkte (wichtig)

- **Projektname/Service-Namen** in `docker-compose.yml` und Labels.
- **Domains** (`SITE_HOST_WWW`, `SITE_HOST_ROOT`, `HOOKS_HOST`).
- **Pfad-Mappings** (`/home/webadmin/apps/<projekt-name>/...`).
- **Branch** (`DEPLOY_BRANCH`) für Produktion.
- **Webhook-URL und Secret** in GitHub + `.env`.
- **Datenbank-Credentials** identisch zwischen `.env` und Compose.

Wenn du Traefik nicht nutzt, entferne die Labels und nutze stattdessen `ports`.
