# GitHub Webhook + Docker Webhook Service einrichten

## Ziel
Bei jedem Push auf den gewünschten Branch ruft GitHub den Webhook-Endpunkt auf. Der Webhook-Container validiert die Signatur und startet `deploy/deploy.sh`.

## 1) Secret erzeugen

```bash
openssl rand -hex 32
```

Wert in `.env` setzen:

```env
WEBHOOK_SECRET=<dein_hex_secret>
```

## 2) Deploy-Key für Repo (Read-Only)

Auf dem VPS (als `webadmin`):

```bash
ssh-keygen -t ed25519 -f ~/.ssh/github_ionos_ed25519 -C "github-deploy-key" -N ""
cat ~/.ssh/github_ionos_ed25519.pub
```

Public Key in GitHub hinterlegen:
- Repo → **Settings** → **Deploy keys** → **Add deploy key**
- Key einfügen
- **Write access deaktiviert** lassen (Read-Only reicht)

## 3) Webhook-URL bestimmen

Wenn du Traefik + Template nutzt:
- Host: `HOOKS_HOST` (z. B. `hooks.example.de`)
- Pfad: `/TODO_PROJECT_NAME`

Beispiel:

```text
https://hooks.example.de/TODO_PROJECT_NAME
```

## 4) Webhook in GitHub anlegen

Repo → **Settings** → **Webhooks** → **Add webhook**

- **Payload URL**: `https://hooks.example.de/TODO_PROJECT_NAME`
- **Content type**: `application/json`
- **Secret**: exakt wie `WEBHOOK_SECRET`
- **SSL verification**: enabled
- **Events**: `Just the push event`
- Speichern

## 5) Funktionstest

1. Leeren Commit pushen:
   ```bash
   git commit --allow-empty -m "test: webhook"
   git push
   ```
2. Logs prüfen:
   ```bash
   docker compose logs -f webhook
   ```
3. Erfolgsindikatoren:
   - `Webhook validiert, starte Deploy…`
   - `Deploy beendet (Code 0)`

## 6) Typische Fehler

- **401 Unauthorized**: Secret in GitHub und `.env` stimmt nicht überein.
- **No such file deploy.sh**: `DEPLOY_SCRIPT` oder Volumes falsch.
- **Permission denied (SSH)**: falscher Key-Pfad oder fehlender Deploy-Key.
- **Webhook nicht erreichbar**: DNS/Traefik-Router/Firewall prüfen.
