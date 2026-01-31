# Stripe Ticketing Setup (Kurdisches Festival)

Diese Anleitung beschreibt das komplette Stripe-Setup, die benötigten `.env`-Variablen und den Ticketfluss für Online-, Kino- und Kombitickets.

## 1) Stripe vorbereiten

1. **Stripe Account erstellen**: https://dashboard.stripe.com/
2. **Produkte & Preise**:
   - Ihr legt die Ticketpreise weiterhin im CMS/DB an (Tabelle `media_tickets`).
   - Stripe erhält die Preise dynamisch pro Checkout (kein manuelles Produkt nötig).
3. **Webhook einrichten**:
   - Stripe Dashboard → **Developers → Webhooks**.
   - Endpoint URL: `https://<deine-domain>/api/stripe/webhook`
   - Event: `checkout.session.completed`
   - Webhook-Secret kopieren → `STRIPE_WEBHOOK_SECRET` in `.env`.

## 2) .env Variablen

```
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Basis-URL deiner Website (wichtig für Redirects)
BASE_URL=https://kurdisches-filmfestival.de

# E-Mail Versand (PDFs + Zugangscodes)
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM="Kurdisches Filmfestival" <info@mitosfilm.com>

# Optional: Session Secret
SESSION_SECRET=...
```

## 3) Ticket-Flow (was passiert beim Kauf?)

1. **User klickt „Kaufen“** → `/checkout?ticketId=...`.
2. Er gibt **Name + E-Mail** ein und ggf. **Namen für Kino-Tickets** (1–10).
3. **Stripe Checkout** wird erstellt.
4. **Webhook** bestätigt Zahlung:
   - Online/Kombi → Zugangscode wird erzeugt.
   - Kino/Kombi → personalisierte PDF-Tickets inkl. QR-Code werden erzeugt.
   - E-Mail wird versendet.
5. **Online-Zugang**:
   - User loggt sich ein und geht auf `/online-access`.
   - Einmaliger Code wird eingegeben → Account erhält Online-Zugang.

## 4) Tickettypen & Regeln

- **Online-Ticket**: Zugangscode per Mail, keine Kino-Tickets.
- **Kino-Ticket**: 1–10 Tickets möglich, jedes Ticket benötigt Vor-/Nachnamen.
- **Kombi-Ticket**: 1 Kino-Ticket + Online-Zugang, plus optionale weitere Kino-Tickets (max. 10 insgesamt).

## 5) Ticket PDF Inhalt

Jedes Kino-Ticket PDF enthält:
- Name des Ticketinhabers
- QR-Code mit Ticketnummer
- „Kurdisches Festival 2026“
- Hinweistext: *Das Ticket ist an die oben genannte Person gebunden...*
- „Viel Spaß im Kino Babylon Berlin“
- Hintergrundbild (oben)

## 6) Wichtige Routen

- `GET /checkout` – Kaufformular
- `POST /api/checkout/create` – Stripe Checkout Session
- `POST /api/stripe/webhook` – Zahlungsabschluss
- `GET /online-access` – Online-Zugangscode einlösen

## 7) Stripe Live schalten

1. Testmodus durch Live Keys ersetzen.
2. Webhook in Live-Umgebung neu anlegen.
3. Live-Webhook-Secret in `.env` setzen.