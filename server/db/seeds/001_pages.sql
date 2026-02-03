INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  (
    'de',
    '/',
    'Start',
    'Start – DB-first Starter',
    'DB-first Rendering mit EJS + PostgreSQL',
    '[
  {
    "type": "hero",
    "headline": "Sauber Mehr Gebäudereinigung",
    "subline": "Zuverlässige Reinigung für Haushalt, Büro und Gewerbe in Berlin.",
    "cta": {
      "href": "#kontakt",
      "label": "Angebot anfragen"
    }
  },
  {
    "type": "kosten",
    "headline": "Was wird die Reinigung kosten?",
    "subline": "In 3 einfachen Schritten zu deinem unverbindlichen Angebot",
    "leadText": "Ab 01.26 sind wir in der Unterhaltsreinigung bei 15 Euro Mindestlohn, dazu kommen Nacht-, Sonn- und Feiertagszuschläge. In der Glasreinigung liegen wir bei 18,40 Euro Mindestlohn.",
    "detailText": "Wir unterliegen dem allgemein gültigen Rahmentarifvertrag (RTV), Lohntarifvertrag (LTV) verpflichtend für alle, die Reinigungsdienstleistungen anbieten.",
    "primaryButton": {
      "label": "zum Buchungsformular",
      "href": "#Kontakt"
    },
    "secondaryButton": {
      "label": "Whats App",
      "href": "https://wa.me/491795163864"
    },
    "steps": [
      {
        "title": "Anruf oder Buchungsformular",
        "imageUrl": "/images/anruf.webp",
        "imageAlt": "Anruf"
      },
      {
        "title": "kostenlose Besichtigung",
        "imageUrl": "/images/besichtigung.webp",
        "imageAlt": "Besichtigung"
      },
      {
        "title": "individuelles Angebot",
        "imageUrl": "/images/angebot.webp",
        "imageAlt": "Angebot"
      }
    ]
  },
  {
    "type": "imageSlider",
    "button": {
      "label": "Leistung entdecken"
    },
    "slides": [
      {
        "title": "Haushaltsreinigung",
        "description": "Sauberkeit für Zuhause – flexibel und gründlich.",
        "link": "/leistungen/haushalt",
        "image": {
          "src": "/images/unterhaltsreinigung.webp",
          "alt": "Haushaltsreinigung"
        }
      },
      {
        "title": "Büroreinigung",
        "description": "Gepflegte Arbeitsplätze für Ihr Team und Ihre Kundschaft.",
        "link": "/leistungen/buero",
        "image": {
          "src": "/images/büroreinigung.webp",
          "alt": "Büroreinigung"
        }
      },
      {
        "title": "Treppenhausreinigung",
        "description": "Saubere Aufgänge für Bewohner und Besucher.",
        "link": "/leistungen/treppenhaus",
        "image": {
          "src": "/images/aufgangsreinigung.webp",
          "alt": "Treppenhausreinigung"
        }
      },
      {
        "title": "Fensterreinigung",
        "description": "Klare Sicht und streifenfreie Ergebnisse.",
        "link": "/leistungen/fenster",
        "image": {
          "src": "/images/fensterreinigung.webp",
          "alt": "Fensterreinigung"
        }
      }
    ]
  },
  {
    "type": "angebote",
    "title": "Was bieten wir dir?",
    "description": "Mit unserem kleinen starken Team steht bei uns Persönlichkeit und direkter Kontakt im Mittelpunkt. Wir sind bei Fragen und Problemen immer für Sie erreichbar und lösen Probleme schnell und unkompliziert. Dabei steht Ihre Zufriedenheit immer an erster Stelle.",
    "cards": [
      {
        "title": "Nachhaltig",
        "description": "Wir arbeiten ressourcenschonend mit Mehrwegmaterialien und klaren Abläufen – sauber, effizient und verantwortungsvoll im Betrieb.",
        "imageUrl": "/images/nachhaltig.webp",
        "imageAlt": "Nachhaltige Reinigung"
      },
      {
        "title": "Persönlich",
        "description": "Feste Ansprechpartner, kurze Wege und direkte Kommunikation – du erreichst uns schnell, ohne Hotline, mit echter Verantwortung.",
        "imageUrl": "/images/angebot.webp",
        "imageAlt": "Persönliche Betreuung"
      },
      {
        "title": "Zufrieden",
        "description": "Zuverlässige Qualität durch Checklisten, Abnahmen und schnelle Nachbesserung – damit Büros und Teams dauerhaft zufrieden bleiben.",
        "imageUrl": "/images/büroreinigung.webp",
        "imageAlt": "Zufriedene Teams"
      },
      {
        "title": "Individuell",
        "description": "Reinigungskonzepte nach Objekt, Branche und Frequenz – von Praxis bis Büro, mit abgestimmten Leistungen und Prioritäten.",
        "imageUrl": "/images/individuell.webp",
        "imageAlt": "Individuelle Lösungen"
      },
      {
        "title": "Flexibel",
        "description": "Termine auch früh, spät oder am Wochenende – wir passen uns deinen Betriebszeiten an und reagieren kurzfristig.",
        "imageUrl": "/images/flexibel.webp",
        "imageAlt": "Flexible Einsätze"
      },
      {
        "title": "Lokal",
        "description": "Regional vor Ort in Berlin, schnell einsatzbereit – kurze Anfahrten, planbare Zeiten und verlässlicher Service für deine Standorte.",
        "imageUrl": "/images/lokal.webp",
        "imageAlt": "Lokaler Service"
      }
    ]
  },
  {
    "type": "kontaktformular",
    "action": "/contact",
    "badge": "Kontakt",
    "headline": "Kontaktiere uns noch",
    "headlineAccent": "Heute",
    "intro": "Du suchst eine zuverlässige B2B-Reinigung, die mit einem kleinen, eingespielten Team fast alle Leistungen aus einer Hand abdeckt? Dann lass uns kurz sprechen.",
    "details": "In einem 10-Minuten-Call klären wir Objekt, Turnus und Sonderwünsche – danach erhältst du ein transparentes, unverbindliches Angebot.",
    "services": [
      "Haushaltsreinigung",
      "Büroreinigung",
      "Treppenhausreinigung",
      "Fensterreinigung"
    ],
    "contactItems": [
      {
        "text": "+49 30 28641-263",
        "icon": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M6 4h4l2 5-2 1c1 2 3 4 5 5l1-2 5 2v4c0 1-1 2-2 2-8 0-14-6-14-14 0-1 1-2 2-2z\" fill=\"currentColor\"/></svg>"
      },
      {
        "text": "Berlin",
        "icon": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M12 2c-3 0-6 2-6 6 0 4.4 6 12 6 12s6-7.6 6-12c0-4-3-6-6-6zm0 9a3 3 0 1 1 0-6 3 3 0 0 1 0 6z\" fill=\"currentColor\"/></svg>"
      },
      {
        "text": "info@sauber-mehr.de",
        "icon": "<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M4 6h16v12H4z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/><path d=\"m4 7 8 6 8-6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\"/></svg>"
      }
    ]
  }
]'::jsonb,        true, false, true
  )
ON CONFLICT (slug) DO UPDATE SET
  canonical_path = EXCLUDED.canonical_path,
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content,
  nav = EXCLUDED.nav,
  display = EXCLUDED.display,
  updated_at = now();

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  ('leistungen', '/leistungen', 'Leistungen', 'Leistungen – Sauber Mehr', 'Reinigungsleistungen für Haushalt, Büro und Treppenhaus.', '[]'::jsonb, true, true, true)
  ON CONFLICT (slug) DO NOTHING;

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  ('impressum', '/impressum', 'Impressum', 'Impressum – Sauber Mehr', 'Impressum von Sauber Mehr.', '[]'::jsonb, false, false, true)
  ON CONFLICT (slug) DO NOTHING;

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  ('datenschutz', '/datenschutz/', 'Datenschutz', 'Datenschutz – Sauber Mehr', 'Datenschutz von Sauber Mehr.', '[]'::jsonb, false, false, true)
ON CONFLICT (slug) DO NOTHING;
