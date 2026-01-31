# DB-first Node.js Starter (Express + EJS + PostgreSQL)

Dieses Starter-Projekt ist so aufgebaut, dass **jede Seite ihren Hauptinhalt aus PostgreSQL lädt** und als EJS-Blocks (Components) rendert.

## 1) Setup

```bash
cp .env.example .env
npm install
```

Optional (lokale DB via Docker):

```bash
docker compose up -d
```

## 2) DB initialisieren + Seed

```bash
npm run db:seed
```

## 3) Start

```bash
npm run dev
# oder
npm start
```

Dann öffnen:
- http://localhost:3000/  (Slug: `home`)
- http://localhost:3000/ueber-uns

## Architektur

- `pages` Table: `slug`, `title`, `meta_*`, `content (jsonb[])`
- `controllers/pageController.js`: lädt Page per Slug, normalisiert Blocks (Whitelist)
- `views/pages/page.ejs`: rendert Blocks als Partials `views/components/*`

### Block-Whitelist / Sicherheit

Siehe `helpers/componentRegistry.js`. DB-Blocks bekommen ein `view`-Feld:
- bekannte `type` → Partial (z.B. `hero`)
- unbekannte `type` → `_unknown`

Damit sind dynamische Includes sicher (kein Include-Pfad aus DB).

## Google OAuth Login/Registrierung

### Voraussetzungen
- Ein Google Cloud Projekt (OAuth Consent Screen + OAuth Client).
- Eine gültige `SESSION_SECRET` in der `.env`.
- Die Google OAuth-Env-Keys (siehe unten).

### .env Keys
Mindestens erforderlich:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback
SESSION_SECRET=...
```

### Google Cloud Konfiguration
1. **Google Cloud Console öffnen** → https://console.cloud.google.com/
2. **Projekt erstellen/auswählen**.
3. **APIs & Dienste → OAuth-Zustimmungsbildschirm**:
   - Anwendungstyp: *Extern* (oder *Intern* für Workspace).
   - App-Name, Support-Mail, Entwicklerkontakt setzen.
   - Scopes: `openid`, `email`, `profile` (Standard).
   - Testnutzer hinzufügen, falls im Testmodus.
4. **APIs & Dienste → Anmeldedaten**:
   - **Anmeldedaten erstellen → OAuth-Client-ID**.
   - Anwendungstyp: *Webanwendung*.
   - **Autorisierte Redirect-URIs**:
     - Lokal: `http://localhost:3000/auth/google/callback`
     - Produktion: `https://<deine-domain>/auth/google/callback`
5. Client-ID & Client-Secret kopieren und in `.env` eintragen.

### Datenbank
Die OAuth-Login/Registrierung nutzt die Tabelle `users` (Migration `008_users_auth.sql`).
Stelle sicher, dass die Migrationen ausgeführt wurden.

### Nutzung
- Login: `/login` → Button **"Mit Google anmelden"**
- Registrierung: `/register` → Button **"Mit Google registrieren"**

## Nächste Schritte (wie in deinem Komplett-Webdesign Projekt)

- Admin-Editor: Pages + Components (deine bestehenden Admin-Routen/Controller)
- SEO/Schema: BreadcrumbList, FAQPage, Article etc. aus DB ableiten
- Slug-Router erweitern: Priorität für feste Routes, dann DB-Fallback

ssh -o PreferredAuthentications=publickey -o PasswordAuthentication=no webadmin@217.154.89.44
Testpush