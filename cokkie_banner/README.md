# Cookie Banner (Drag & Drop)

Dieser Ordner enthält ein sofort einsetzbares Cookie-Banner (EJS + CSS + JS + Controller), das sich leicht in andere Projekte kopieren lässt.

## Inhalt

```
cookie_banner/
├─ css/
│  ├─ cookie-banner.css
│  └─ hero.css
├─ js/
│  └─ cookie-consent.js
├─ ejs/
│  ├─ cookie-banner.ejs
│  ├─ head-consent.ejs
│  └─ hero.ejs
├─ controller/
│  └─ consentController.js
├─ helper/
│  └─ cookieBannerData.js
├─ routes/
│  └─ consentRoutes.js
├─ content/
│  ├─ banner-copy.json
│  └─ hero-copy.json
└─ docs/
   └─ session-store.sql
```

## Drag & Drop Integration (Express + EJS)

### 1) Assets verfügbar machen

Option A (empfohlen): Ordner `cookie_banner` als statische Assets bereitstellen.

```js
app.use('/cookie_banner', express.static(path.join(process.cwd(), 'cookie_banner')));
```

Option B: CSS/JS manuell in deinen `public/`-Ordner kopieren.

### 2) Header anpassen (Consent Mode + Loader)

Füge in den `<head>` deiner EJS-Templates das Snippet aus `ejs/head-consent.ejs` ein, **bevor** Google/Clarity geladen wird.

```ejs
<%- include('path/to/cookie_banner/ejs/head-consent') %>
```

Benötigte ENV-Variablen (optional):

- `GA_MEASUREMENT_ID`
- `CLARITY_ID`

Wenn du GA/Clarity nicht nutzt, kannst du die ENV-Variablen leer lassen oder das Snippet anpassen.

### 3) Banner im Body einfügen

```ejs
<%- include('path/to/cookie_banner/ejs/cookie-banner', { bannerCopy }) %>
```

### 4) Daten/Copy laden (Helper)

```js
import { loadCookieBannerCopy, loadCookieBannerHeroCopy } from './cookie_banner/helper/cookieBannerData.js';

app.get('/', (req, res) => {
  res.render('index', {
    bannerCopy: loadCookieBannerCopy(),
    heroCopy: loadCookieBannerHeroCopy()
  });
});
```

### 5) API-Routen für Consent

```js
import consentRoutes from './cookie_banner/routes/consentRoutes.js';

app.use('/api', consentRoutes);
```

### 6) Sessions (Datenbank)

Das Banner speichert die Consent-Entscheidung in der Session (`req.session.cookieConsent`).

- **Ohne DB**: Session-Memory-Store (nur für lokale Tests).
- **Mit DB (empfohlen)**: z. B. Postgres + `connect-pg-simple`. Das Schema findest du in `docs/session-store.sql`.

## Anpassungen für andere Projekte

- **Texte/Labels**: `content/banner-copy.json`
- **Datenschutz-Link**: `content/banner-copy.json`
- **Hero-Block (optional)**: `content/hero-copy.json` + `ejs/hero.ejs` + `css/hero.css`

## Welche weiteren JS/Helper werden benötigt?

- `js/cookie-consent.js` (Frontend-Logik)
- `controller/consentController.js` + `routes/consentRoutes.js` (Backend-API)
- `helper/cookieBannerData.js` (Copy-Loader für EJS)

Damit ist der Cookie Banner komplett in sich geschlossen und per Drag & Drop in andere Projekte integrierbar.