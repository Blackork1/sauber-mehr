# cokkie_banner (portable)

Wiederverwendbares Cookie-Banner-Setup (Express + EJS) mit:
- Consent-Banner + Einstellungs-Modal
- Consent API (`GET/POST/DELETE /api/consent`)
- GTM/GA + Clarity Consent-Handling
- lokaler Fallback im Browser, falls API kurz ausfällt

## Struktur

```txt
cokkie_banner/
  content/banner-copy.json
  css/cookie-banner.css
  js/cookie-consent.js
  ejs/cookie-banner.ejs
  ejs/head-consent.ejs
  helper/cookieBannerData.js
  controller/consentController.js
  routes/consentRoutes.js
  docs/session.store.sql
```

## Schnellstart (Express + EJS)

1. Statische Auslieferung einbinden

```js
import path from 'path';
app.use('/cookie_banner', express.static(path.join(process.cwd(), 'cokkie_banner')));
```

2. Banner-Copy laden

```js
import { loadCookieBannerCopy } from './cokkie_banner/helper/cookieBannerData.js';

const bannerCopy = loadCookieBannerCopy();
app.use((req, res, next) => {
  if (typeof res.locals.bannerCopy === 'undefined') res.locals.bannerCopy = bannerCopy;
  if (typeof res.locals.assetSuffix === 'undefined') res.locals.assetSuffix = '';
  next();
});
```

3. Consent-Routen registrieren

```js
import consentRoutes from './cokkie_banner/routes/consentRoutes.js';
app.use('/api', consentRoutes);
```

4. Session-Store aktivieren (Pflicht)

Das Banner speichert Consent in `req.session.cookieConsent`.

Beispiel mit Postgres:

```js
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pool from './util/db.js';

const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' }
}));
```

Alternative SQL für Session-Tabelle liegt in `docs/session.store.sql`.

5. Head-Snippet einbinden

In `<head>`:

```ejs
<%- include('../../cokkie_banner/ejs/head-consent') %>
```

Umgebungsvariablen:
- `GA_MEASUREMENT_ID` (optional)
- `CLARITY_ID` (optional)

6. Banner im Layout einbinden

Vor `</body>`:

```ejs
<%- include('../../cokkie_banner/ejs/cookie-banner', { bannerCopy, assetSuffix }) %>
```

## Anpassung

- Texte/Kategorien/Anbieter: `content/banner-copy.json`
- Styling: `css/cookie-banner.css`
- Logik: `js/cookie-consent.js`

## Wichtig

- Für rechtssicheren Betrieb müssen Banner-Inhalt, eingesetzte Dienste und Datenschutzerklärung immer konsistent sein.
- Falls du Dienste änderst (z. B. neue Tracking-Tools), aktualisiere `banner-copy.json` und die Datenschutzerklärung gemeinsam.
