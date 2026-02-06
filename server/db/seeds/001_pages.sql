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

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display, locale, i18n_group)
VALUES
  (
    'leistungen',
    '/leistungen',
    'Leistungen',
    'Leistungen – Sauber Mehr',
    'Reinigungsleistungen für Haushalt, Büro und Treppenhaus.',
    '[
  {
    "type": "hero",
    "headline": "Unsere Reinigungsleistungen im Überblick",
    "subline": "Wir melden uns innerhalb von 24 Stunden bei dir. Dein Angebot wird kostenlos und individuell erstellt.",
    "ctaLabel": "Jetzt anrufen",
    "ctaHref": "#kontakt",
    "image": "/images/team.webp"
  },
  {
    "type": "kosten",
    "headline": "Was kostet die Büroreinigung?",
    "description": "Unsere Preise werden individuell berechnet. Dazu kommen wir zu einer kostenlosen Besichtigung vorbei und erstellen daraufhin dein unverbindliches Angebot.",
    "subheading": "Und so einfach geht’s.",
    "subline": "In 3 einfachen Schritten zu deinem unverbindlichen Angebot",
    "leadText": "Ab 01.26 sind wir in der Unterhaltsreinigung bei 15 Euro Mindestlohn, dazu kommen Nacht-, Sonn- und Feiertagszuschläge. In der Glasreinigung liegen wir bei 18,40 Euro Mindestlohn.",
    "detailText": "Wir unterliegen dem allgemein gültigen Rahmentarifvertrag (RTV), Lohntarifvertrag (LTV) verpflichtend für alle, die Reinigungsdienstleistungen anbieten.",
    "primaryButton": {
      "label": "Zum Buchungsformular",
      "href": "#kontakt"
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
    "type": "kontaktformular",
    "layout": "services",
    "action": "/contact",
    "sideTitle": "Professionelle Reinigung in Berlin",
    "sideDescription": "Wir melden uns innerhalb von 24 Stunden bei dir. Dein Angebot wird kostenlos und auf deine Bedürfnisse angepasst erstellt.",
    "sideSubheading": "folgende Leistungen bieten wir an",
    "services": [
      "Haushaltsreinigung",
      "Büroreinigung",
      "Treppenhausreinigung",
      "Fensterreinigung"
    ]
  },
  {
    "type": "bereiche",
    "title": "In diesen Bereichen reinigen wir Berlin:",
    "description": "Wir melden uns innerhalb von 24 Stunden bei dir. Dein Angebot wird kostenlos und auf deine Bedürfnisse angepasst erstellt.\\nHast du weitere Fragen, dann ruf uns gerne an oder schreib uns auf WhatsApp.",
    "slider": {
      "slides": [
        {
          "title": "Haushaltsreinigung",
          "link": "/leistungen/haushalt",
          "image": {
            "src": "/images/unterhaltsreinigung.webp",
            "alt": "Haushaltsreinigung"
          }
        },
        {
          "title": "Büroreinigung",
          "link": "/leistungen/buero",
          "image": {
            "src": "/images/büroreinigung.webp",
            "alt": "Büroreinigung"
          }
        },
        {
          "title": "Treppenhausreinigung",
          "link": "/leistungen/treppenhaus",
          "image": {
            "src": "/images/aufgangsreinigung.webp",
            "alt": "Treppenhausreinigung"
          }
        },
        {
          "title": "Fensterreinigung",
          "link": "/leistungen/fenster",
          "image": {
            "src": "/images/fensterreinigung.webp",
            "alt": "Fensterreinigung"
          }
        }
      ]
    }
  },
  {
    "type": "faq",
    "title": "Typische Fragen zur Reinigung",
    "description": "Wir sind rund um die Uhr telefonisch erreichbar. Eine Antwort erfolgt garantiert innerhalb von 24 Stunden nach Eingang deiner Nachricht.",
    "button": {
      "label": "jetzt anrufen",
      "href": "tel:+493028641263"
    },
    "items": [
      {
        "q": "Wie schnell meldet ihr euch zurück?",
        "a": "In der Regel innerhalb von 24 Stunden nach Eingang deiner Anfrage."
      },
      {
        "q": "Muss ich für die Besichtigung etwas vorbereiten?",
        "a": "Nein. Wir sehen uns das Objekt vor Ort an und besprechen alle Details direkt mit dir."
      },
      {
        "q": "Können wir den Turnus flexibel anpassen?",
        "a": "Ja, wir passen den Reinigungsplan flexibel an deine Anforderungen und Zeiten an."
      },
      {
        "q": "Welche Leistungen sind im Angebot enthalten?",
        "a": "Wir erstellen ein individuelles Angebot, das alle gewünschten Leistungen beinhaltet."
      }
    ]
  }
]'::jsonb,
    true,
    true,
    true,
    'de-DE',
    'leistungen'
  )
  ON CONFLICT (slug) DO UPDATE SET
    canonical_path = EXCLUDED.canonical_path,
    title = EXCLUDED.title,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    content = EXCLUDED.content,
    nav = EXCLUDED.nav,
    show_in_nav = EXCLUDED.show_in_nav,
    display = EXCLUDED.display,
    locale = EXCLUDED.locale,
    i18n_group = EXCLUDED.i18n_group,
    updated_at = now();

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display, locale, i18n_group)
VALUES
  (
    'leistungen-de',
    '/leistungen-de',
    'Leistungen (DE)',
    'Leistungen – Sauber Mehr',
    'Reinigungsleistungen für Haushalt, Büro und Treppenhaus.',
    '[
  {
    "type": "hero",
    "headline": "Unsere Reinigungsleistungen im Überblick",
    "subline": "Wir melden uns innerhalb von 24 Stunden bei dir. Dein Angebot wird kostenlos und individuell erstellt.",
    "ctaLabel": "Jetzt anrufen",
    "ctaHref": "#kontakt",
    "image": "/images/team.webp"
  },
  {
    "type": "kosten",
    "headline": "Was kostet die Büroreinigung?",
    "description": "Unsere Preise werden individuell berechnet. Dazu kommen wir zu einer kostenlosen Besichtigung vorbei und erstellen daraufhin dein unverbindliches Angebot.",
    "subheading": "Und so einfach geht’s.",
    "subline": "In 3 einfachen Schritten zu deinem unverbindlichen Angebot",
    "leadText": "Ab 01.26 sind wir in der Unterhaltsreinigung bei 15 Euro Mindestlohn, dazu kommen Nacht-, Sonn- und Feiertagszuschläge. In der Glasreinigung liegen wir bei 18,40 Euro Mindestlohn.",
    "detailText": "Wir unterliegen dem allgemein gültigen Rahmentarifvertrag (RTV), Lohntarifvertrag (LTV) verpflichtend für alle, die Reinigungsdienstleistungen anbieten.",
    "primaryButton": {
      "label": "Zum Buchungsformular",
      "href": "#kontakt"
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
    "type": "kontaktformular",
    "layout": "services",
    "action": "/contact",
    "sideTitle": "Professionelle Reinigung in Berlin",
    "sideDescription": "Wir melden uns innerhalb von 24 Stunden bei dir. Dein Angebot wird kostenlos und auf deine Bedürfnisse angepasst erstellt.",
    "sideSubheading": "folgende Leistungen bieten wir an",
    "services": [
      "Haushaltsreinigung",
      "Büroreinigung",
      "Treppenhausreinigung",
      "Fensterreinigung"
    ]
  },
  {
    "type": "bereiche",
    "title": "In diesen Bereichen reinigen wir Berlin:",
    "description": "Wir melden uns innerhalb von 24 Stunden bei dir. Dein Angebot wird kostenlos und auf deine Bedürfnisse angepasst erstellt.\\nHast du weitere Fragen, dann ruf uns gerne an oder schreib uns auf WhatsApp.",
    "slider": {
      "slides": [
        {
          "title": "Haushaltsreinigung",
          "link": "/leistungen/haushalt",
          "image": {
            "src": "/images/unterhaltsreinigung.webp",
            "alt": "Haushaltsreinigung"
          }
        },
        {
          "title": "Büroreinigung",
          "link": "/leistungen/buero",
          "image": {
            "src": "/images/büroreinigung.webp",
            "alt": "Büroreinigung"
          }
        },
        {
          "title": "Treppenhausreinigung",
          "link": "/leistungen/treppenhaus",
          "image": {
            "src": "/images/aufgangsreinigung.webp",
            "alt": "Treppenhausreinigung"
          }
        },
        {
          "title": "Fensterreinigung",
          "link": "/leistungen/fenster",
          "image": {
            "src": "/images/fensterreinigung.webp",
            "alt": "Fensterreinigung"
          }
        }
      ]
    }
  },
  {
    "type": "faq",
    "title": "Typische Fragen zur Reinigung",
    "description": "Wir sind rund um die Uhr telefonisch erreichbar. Eine Antwort erfolgt garantiert innerhalb von 24 Stunden nach Eingang deiner Nachricht.",
    "button": {
      "label": "jetzt anrufen",
      "href": "tel:+493028641263"
    },
    "items": [
      {
        "q": "Wie schnell meldet ihr euch zurück?",
        "a": "In der Regel innerhalb von 24 Stunden nach Eingang deiner Anfrage."
      },
      {
        "q": "Muss ich für die Besichtigung etwas vorbereiten?",
        "a": "Nein. Wir sehen uns das Objekt vor Ort an und besprechen alle Details direkt mit dir."
      },
      {
        "q": "Können wir den Turnus flexibel anpassen?",
        "a": "Ja, wir passen den Reinigungsplan flexibel an deine Anforderungen und Zeiten an."
      },
      {
        "q": "Welche Leistungen sind im Angebot enthalten?",
        "a": "Wir erstellen ein individuelles Angebot, das alle gewünschten Leistungen beinhaltet."
      }
    ]
  }
]'::jsonb,
    false,
    false,
    true,
    'de',
    'leistungen'
  )
  ON CONFLICT (slug) DO UPDATE SET
    canonical_path = EXCLUDED.canonical_path,
    title = EXCLUDED.title,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    content = EXCLUDED.content,
    nav = EXCLUDED.nav,
    show_in_nav = EXCLUDED.show_in_nav,
    display = EXCLUDED.display,
    locale = EXCLUDED.locale,
    i18n_group = EXCLUDED.i18n_group,
    updated_at = now();

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display, locale, i18n_group)
VALUES
  (
    'leistungen-en',
    '/leistungen-en',
    'Services',
    'Services – Sauber Mehr',
    'Cleaning services for households, offices, and stairwells.',
    '[
  {
    "type": "hero",
    "headline": "Our cleaning services at a glance",
    "subline": "We reply within 24 hours. Your quote is free and tailored to your needs.",
    "ctaLabel": "Call now",
    "ctaHref": "#kontakt",
    "image": "/images/team.webp"
  },
  {
    "type": "kosten",
    "headline": "How much does office cleaning cost?",
    "description": "Our prices are calculated individually. We visit you for a free inspection and then prepare your non-binding quote.",
    "subheading": "And it’s that simple.",
    "subline": "Your free quote in 3 easy steps",
    "leadText": "From 01.26 we apply a minimum wage of 15 euros in regular cleaning, plus night, Sunday and holiday surcharges. For glass cleaning we apply 18.40 euros minimum wage.",
    "detailText": "We are bound by the generally applicable framework collective agreement (RTV) and wage agreement (LTV) for cleaning services.",
    "primaryButton": {
      "label": "Go to booking form",
      "href": "#kontakt"
    },
    "secondaryButton": {
      "label": "Whats App",
      "href": "https://wa.me/491795163864"
    },
    "steps": [
      {
        "title": "Call or booking form",
        "imageUrl": "/images/anruf.webp",
        "imageAlt": "Call"
      },
      {
        "title": "Free inspection",
        "imageUrl": "/images/besichtigung.webp",
        "imageAlt": "Inspection"
      },
      {
        "title": "Individual quote",
        "imageUrl": "/images/angebot.webp",
        "imageAlt": "Quote"
      }
    ]
  },
  {
    "type": "kontaktformular",
    "layout": "services",
    "action": "/contact",
    "sideTitle": "Professional cleaning in Berlin",
    "sideDescription": "We respond within 24 hours. Your quote is free and tailored to your needs.",
    "sideSubheading": "these services are available",
    "services": [
      "Household cleaning",
      "Office cleaning",
      "Stairwell cleaning",
      "Window cleaning"
    ]
  },
  {
    "type": "bereiche",
    "title": "We clean these areas in Berlin:",
    "description": "We respond within 24 hours. Your quote is free and tailored to your needs.\\nIf you have more questions, feel free to call or message us on WhatsApp.",
    "slider": {
      "slides": [
        {
          "title": "Household cleaning",
          "link": "/leistungen/haushalt",
          "image": {
            "src": "/images/unterhaltsreinigung.webp",
            "alt": "Household cleaning"
          }
        },
        {
          "title": "Office cleaning",
          "link": "/leistungen/buero",
          "image": {
            "src": "/images/büroreinigung.webp",
            "alt": "Office cleaning"
          }
        },
        {
          "title": "Stairwell cleaning",
          "link": "/leistungen/treppenhaus",
          "image": {
            "src": "/images/aufgangsreinigung.webp",
            "alt": "Stairwell cleaning"
          }
        },
        {
          "title": "Window cleaning",
          "link": "/leistungen/fenster",
          "image": {
            "src": "/images/fensterreinigung.webp",
            "alt": "Window cleaning"
          }
        }
      ]
    }
  },
  {
    "type": "faq",
    "title": "Typical questions about cleaning",
    "description": "We are available by phone around the clock. You will receive a response within 24 hours of your message.",
    "button": {
      "label": "call now",
      "href": "tel:+493028641263"
    },
    "items": [
      {
        "q": "How quickly will you get back to us?",
        "a": "Usually within 24 hours after receiving your request."
      },
      {
        "q": "Do we need to prepare anything for the inspection?",
        "a": "No. We inspect the location and clarify all details with you on site."
      },
      {
        "q": "Can we adjust the schedule later?",
        "a": "Yes, we adapt the cleaning plan flexibly to your requirements and timings."
      },
      {
        "q": "Which services are included in the offer?",
        "a": "We create an individual offer that includes all requested services."
      }
    ]
  }
]'::jsonb,
    false,
    false,
    true,
    'en',
    'leistungen'
  )
  ON CONFLICT (slug) DO UPDATE SET
    canonical_path = EXCLUDED.canonical_path,
    title = EXCLUDED.title,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    content = EXCLUDED.content,
    nav = EXCLUDED.nav,
    show_in_nav = EXCLUDED.show_in_nav,
    display = EXCLUDED.display,
    locale = EXCLUDED.locale,
    i18n_group = EXCLUDED.i18n_group,
    updated_at = now();

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  (
    'kontakt',
    '/kontakt',
    'Kontakt',
    'Kontakt – Sauber & Mehr',
    'Kontaktiere Sauber & Mehr für dein individuelles Reinigungsangebot.',
    '[
  {
    "type": "kontaktseite",
    "action": "/contact",
    "breadcrumb": "Startseite > Kontakt",
    "headline": "Kontaktiere uns und",
    "headlineAccent": "erhalte dein Angebot",
    "description": "Wir melden uns innerhalb von 24 Stunden bei dir. Dein Angebot wird kostenlos und auf deine Bedürfnisse angepasst erstellt.",
    "primaryCta": {
      "label": "Jetzt anrufen",
      "href": "tel:+493028641263"
    },
    "secondaryCta": {
      "label": "WhatsApp Nachricht",
      "href": "https://wa.me/493028641263"
    },
    "startCard": {
      "title": "Was benötigst du?",
      "options": [
        {
          "label": "Unterhaltsreinigung",
          "imageUrl": "/images/unterhaltsreinigung.webp",
          "imageAlt": "Unterhaltsreinigung",
          "branch": "area-a"
        },
        {
          "label": "Fensterreinigung",
          "imageUrl": "/images/fensterreinigung.webp",
          "imageAlt": "Fensterreinigung",
          "branch": "area-b"
        },
        {
          "label": "Andere Reinigung",
          "imageUrl": "/images/angebot.webp",
          "imageAlt": "Andere Reinigung",
          "branch": "area-a"
        }
      ]
    },
    "areaACard": {
      "title": "Wie viel Quadratmeter müssen gereinigt werden?",
      "options": [
        {
          "label": "<200 m2",
          "imageUrl": "/images/büroreinigung.webp",
          "imageAlt": "<200 m2"
        },
        {
          "label": "> 200 m2",
          "imageUrl": "/images/aufgangsreinigung.webp",
          "imageAlt": "> 200 m2"
        },
        {
          "label": "> 1000m2",
          "imageUrl": "/images/unterhaltsreinigung.webp",
          "imageAlt": "> 1000m2"
        }
      ]
    },
    "areaBCard": {
      "title": "Wie groß ist die Fensterfläche ungefähr?",
      "options": [
        {
          "label": "<50 m2",
          "imageUrl": "/images/fensterreinigung.webp",
          "imageAlt": "<50 m2"
        },
        {
          "label": "> 50 m2",
          "imageUrl": "/images/fensterreinigung.webp",
          "imageAlt": "> 50 m2"
        },
        {
          "label": "> 200 m2",
          "imageUrl": "/images/fensterreinigung.webp",
          "imageAlt": "> 200 m2"
        }
      ]
    },
    "sectorCard": {
      "title": "Was soll gereinigt werden?",
      "options": [
        {
          "label": "Praxen",
          "imageUrl": "/images/angebot.webp",
          "imageAlt": "Praxen"
        },
        {
          "label": "Büro",
          "imageUrl": "/images/büroreinigung.webp",
          "imageAlt": "Büro"
        },
        {
          "label": "Gastronomie",
          "imageUrl": "/images/aufgangsreinigung.webp",
          "imageAlt": "Gastronomie"
        },
        {
          "label": "Andere",
          "imageUrl": "/images/unterhaltsreinigung.webp",
          "imageAlt": "Andere",
          "isOther": true
        }
      ]
    },
    "otherCard": {
      "title": "Was soll gereinigt werden?",
      "label": "Beschreibe deine Reinigung",
      "placeholder": "Reinigungsart",
      "buttonLabel": "Weiter"
    },
    "contactMethodCard": {
      "title": "Wie möchtest du kontaktiert werden?",
      "options": [
        {
          "label": "Telefonisch",
          "imageUrl": "/images/anruf.webp",
          "imageAlt": "Telefonisch"
        },
        {
          "label": "WhatsApp",
          "imageUrl": "/images/angebot.webp",
          "imageAlt": "WhatsApp"
        },
        {
          "label": "Mail",
          "imageUrl": "/images/individuell.webp",
          "imageAlt": "Mail"
        }
      ]
    },
    "contactDetailsCard": {
      "title": "Gebe deine Kontaktdaten ein",
      "nameLabel": "Dein Name (optional)",
      "namePlaceholder": "Name",
      "emailLabel": "Deine Mail",
      "emailPlaceholder": "name@beispiel.de",
      "phoneLabel": "Deine Rufnummer",
      "phonePlaceholder": "+49 123 456789",
      "submitLabel": "Anfrage absenden"
    }
  }
]'::jsonb,
    true,
    true,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    canonical_path = EXCLUDED.canonical_path,
    title = EXCLUDED.title,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    content = EXCLUDED.content,
    nav = EXCLUDED.nav,
    show_in_nav = EXCLUDED.show_in_nav,
    display = EXCLUDED.display,
    updated_at = now();

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  (
    'impressum',
    '/impressum',
    'Impressum',
    'Impressum – Sauber Mehr',
    'Impressum der TM Sauber & Mehr UG (haftungsbeschränkt).',
    '[
  {
    "type": "richText",
    "title": "Impressum",
    "html": "<p><strong>Name des Unternehmens:</strong><br>TM Sauber &amp; Mehr UG (haftungsbeschränkt)</p><p><strong>Firmensitz:</strong><br>Senftenberger Ring 38B<br>13435 Berlin</p><p><strong>Vertreten durch:</strong><br>Tatjahna Genzke</p><p><strong>Kontaktinformationen:</strong><br>T: +49 30 28641-263<br>E: <a href='mailto:info@sauber-mehr.de'>info@sauber-mehr.de</a></p><p><strong>Registereintrag:</strong><br>Amtsgericht Charlottenburg<br>Handelsregister – Nummer: HRB 245844B</p><p><strong>Kammer und Aufsichtsbehörde:</strong><br>Handwerkskammer Berlin<br>Blücherstraße 86 · 10961 Berlin</p><p><strong>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV:</strong><br>Tatjahna Genzke<br>Senftenberger Ring 38B<br>13435 Berlin</p>"
  }
]'::jsonb,
    false,
    false,
    true
  )
  ON CONFLICT (slug) DO UPDATE SET
    canonical_path = EXCLUDED.canonical_path,
    title = EXCLUDED.title,
    meta_title = EXCLUDED.meta_title,
    meta_description = EXCLUDED.meta_description,
    content = EXCLUDED.content,
    nav = EXCLUDED.nav,
    show_in_nav = EXCLUDED.show_in_nav,
    display = EXCLUDED.display,
    updated_at = now();

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  (
    'datenschutz',
    '/datenschutz/',
    'Datenschutz',
    'Datenschutz – Sauber Mehr',
    'Datenschutzerklärung der TM Sauber & Mehr UG (haftungsbeschränkt).',
    '[
  {
    "type": "richText",
    "title": "Datenschutzerklärung",
    "html": "<p>Wir nehmen den Schutz Ihrer personenbezogenen Daten ernst. Nachfolgend informieren wir Sie über Art, Umfang und Zweck der Verarbeitung personenbezogener Daten bei Nutzung unserer Website.</p><h3>1. Verantwortlicher</h3><p>TM Sauber &amp; Mehr UG (haftungsbeschränkt)<br>Senftenberger Ring 38B<br>13435 Berlin<br>T: +49 30 28641-263<br>E: <a href='mailto:info@sauber-mehr.de'>info@sauber-mehr.de</a></p><h3>2. Hosting</h3><p>Unsere Website wird bei der IONOS SE, Elgendorfer Str. 57, 56410 Montabaur (Deutschland) gehostet. Die Verarbeitung erfolgt auf Servern in Deutschland. Mit dem Hosting-Anbieter besteht ein Vertrag zur Auftragsverarbeitung gemäß Art. 28 DSGVO.</p><h3>3. Zugriffsdaten und Server-Logfiles</h3><p>Beim Besuch der Website verarbeitet der Hosting-Anbieter folgende Daten: IP-Adresse, Datum und Uhrzeit der Anfrage, Zeitzonendifferenz, Inhalt der Anfrage (konkrete Seite), HTTP-Statuscode, übertragene Datenmenge, Referrer-URL, Browsertyp, Betriebssystem und dessen Oberfläche sowie Sprache und Version der Browsersoftware. Die Verarbeitung erfolgt zur Gewährleistung der Sicherheit und Stabilität der Website auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO.</p><h3>4. Kontaktaufnahme</h3><p>Wenn Sie uns per E-Mail, Telefon oder Kontaktformular kontaktieren, verarbeiten wir Ihre Angaben zur Bearbeitung der Anfrage und für den Fall von Anschlussfragen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an effizienter Kommunikation).</p><h3>5. Newsletter (Mailchimp)</h3><p>Für den Versand unseres Newsletters nutzen wir den Dienst „Mailchimp“ der Intuit Inc., 2700 Coast Ave, Mountain View, CA 94043, USA. Die Anmeldung erfolgt im Double-Opt-In-Verfahren. Dabei werden E-Mail-Adresse, Zeitpunkt der Anmeldung und Bestätigung sowie IP-Adresse verarbeitet. Rechtsgrundlage ist Ihre Einwilligung nach Art. 6 Abs. 1 lit. a DSGVO. Die Datenübermittlung in die USA erfolgt auf Grundlage von Standardvertragsklauseln (SCC). Sie können den Newsletter jederzeit über den Abmeldelink oder per E-Mail abbestellen.</p><h3>6. Medienverwaltung (Cloudinary)</h3><p>Zur Bereitstellung und Optimierung von Bildern und Videos verwenden wir den Dienst Cloudinary Ltd., 111 W Evelyn Ave, Sunnyvale, CA 94086, USA. Bei Abruf von Medien werden IP-Adresse, Gerätedaten und technische Informationen verarbeitet. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (schnelle und sichere Medienauslieferung). Datenübermittlungen in die USA erfolgen auf Basis von Standardvertragsklauseln.</p><h3>7. Google Fonts</h3><p>Unsere Website nutzt Google Fonts. Die Schriftarten werden von Servern der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland geladen. Dabei wird Ihre IP-Adresse an Google übertragen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (einheitliche Darstellung und performante Auslieferung). Es kann eine Datenübermittlung in die USA stattfinden; diese erfolgt auf Grundlage von Standardvertragsklauseln.</p><h3>8. Google Search Console</h3><p>Wir verwenden die Google Search Console der Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland, um die technische Performance unserer Website in der Google-Suche zu überwachen. Google verarbeitet dabei insbesondere aggregierte Suchanfragen, Klickdaten und technische Informationen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO (Analyse und Optimierung der Auffindbarkeit). Eine Datenübermittlung in die USA ist möglich und erfolgt auf Basis von Standardvertragsklauseln.</p><h3>9. Ihre Rechte</h3><p>Sie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO), Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch gegen die Verarbeitung (Art. 21 DSGVO). Sofern die Verarbeitung auf Ihrer Einwilligung beruht, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen (Art. 7 Abs. 3 DSGVO).</p><h3>10. Beschwerderecht bei der Aufsichtsbehörde</h3><p>Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig ist insbesondere die Berliner Beauftragte für Datenschutz und Informationsfreiheit.</p><h3>11. Aktualität und Änderung dieser Datenschutzerklärung</h3><p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, damit sie stets den aktuellen rechtlichen Anforderungen entspricht.</p>"
  }
]'::jsonb,
    false,
    false,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  canonical_path = EXCLUDED.canonical_path,
  title = EXCLUDED.title,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  content = EXCLUDED.content,
  nav = EXCLUDED.nav,
  show_in_nav = EXCLUDED.show_in_nav,
  display = EXCLUDED.display,
  updated_at = now();
