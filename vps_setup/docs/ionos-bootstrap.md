# IONOS VPS Bootstrap (Docker + Verzeichnisstruktur)

## 1) Basispakete installieren

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
```

Docker Engine + Compose Plugin nach Docker-Doku installieren.

## 2) Projektstruktur anlegen

```bash
mkdir -p /home/webadmin/apps/TODO_PROJECT_NAME
mkdir -p /home/webadmin/apps/TODO_PROJECT_NAME/data/{uploads,downloads,postgres}
```

## 3) Repository klonen

```bash
cd /home/webadmin/apps
git clone git@github.com:TODO_OWNER/TODO_REPO.git TODO_PROJECT_NAME
cd TODO_PROJECT_NAME
```

## 4) Setup-Dateien übernehmen

- `docker-compose.template.yml` als `docker-compose.yml` ablegen
- `example.env` als `.env` ablegen
- `deploy/deploy.sh` ausführbar machen:

```bash
chmod +x deploy/deploy.sh
```

## 5) Netzwerk (falls Traefik extern läuft)

```bash
docker network create proxy || true
docker network create dbadmin || true
```

Wenn du kein externes Traefik nutzt:
- `proxy`/`dbadmin` in Compose auf interne Netze ändern
- Traefik Labels entfernen
- stattdessen `ports` auf App und Webhook setzen

## 6) Start

```bash
docker compose up -d --build
```

## 7) Healthcheck

```bash
docker compose ps
docker compose logs --tail=100 app
docker compose logs --tail=100 postgres
docker compose logs --tail=100 webhook
```

## 8) Backup-Strategie (empfohlen)

- PostgreSQL täglich dumpen (`pg_dump` per cron/systemd timer)
- `data/uploads` regelmäßig sichern
- `.env` verschlüsselt sichern (z. B. Passwortmanager/Secret Store)
