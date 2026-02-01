INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  (
    'de',
    '/',
    'Start',
    'Start – DB-first Starter',
    'DB-first Rendering mit EJS + PostgreSQL',
    '[{"type":"hero","headline":"Sauber Mehr Gebäudereinigung","subline":"Zuverlässige Reinigung für Haushalt, Büro und Gewerbe in Berlin.","cta":{"href":"#kontakt","label":"Angebot anfragen"}},{"type":"kosten","headline":"Was wird die Reinigung kosten?","subline":"In 3 einfachen Schritten zu deinem unverbindlichen Angebot","leadText":"Ab 01.26 sind wir in der Unterhaltsreinigung bei 15 Euro Mindestlohn, dazu kommen Nacht-, Sonn- und Feiertagszuschläge. In der Glasreinigung liegen wir bei 18,40 Euro Mindestlohn.","detailText":"Wir unterliegen dem allgemein gültigen Rahmentarifvertrag (RTV), Lohntarifvertrag (LTV) verpflichtend für alle, die Reinigungsdienstleistungen anbieten.","primaryButton":{"label":"zum Buchungsformular","href":"#Kontakt"},"secondaryButton":{"label":"Whats App","href":"https://wa.me/491795163864"},"steps":[{"title":"Anruf oder Buchungsformular","imageUrl":"/images/anruf.webp","imageAlt":"Anruf"},{"title":"kostenlose Besichtigung","imageUrl":"/images/besichtigung.webp","imageAlt":"Besichtigung"},{"title":"individuelles Angebot","imageUrl":"/images/angebot.webp","imageAlt":"Angebot"}]},{"type":"imageText","title":"Reinigung mit System","text":"Wir arbeiten strukturiert, transparent und mit festen Ansprechpartnern. So behalten Sie jederzeit den Überblick über Leistungen und Termine.","imageUrl":"/images/placeholder-cleaning.webp","imageAlt":"Reinigungsteam von Sauber Mehr"},{"type":"richText","title":"Warum Sauber Mehr?","html":"<p>Wir stehen für klare Kommunikation, faire Angebote und gründliche Ergebnisse. Ob regelmäßige Unterhaltsreinigung oder einmaliger Einsatz – wir liefern zuverlässig.</p><ul><li>Persönliche Beratung</li><li>Flexible Einsatzzeiten</li><li>Geschulte Teams</li></ul>"},{"type":"cta","headline":"Jetzt Beratung sichern","subline":"Wir melden uns innerhalb von 24 Stunden zurück.","button":{"href":"#kontakt","label":"Kontakt aufnehmen"}},{"type":"faq","title":"Häufige Fragen","items":[{"q":"Welche Leistungen bietet Sauber Mehr?","a":"<p>Wir reinigen Haushalte, Büros, Treppenhäuser und bieten individuelle Lösungen für Gewerbeflächen.</p>"},{"q":"Wie schnell erhalte ich ein Angebot?","a":"<p>In der Regel melden wir uns innerhalb von 24 Stunden mit einem persönlichen Angebot.</p>"}]}]'::jsonb,        true, false, true
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
