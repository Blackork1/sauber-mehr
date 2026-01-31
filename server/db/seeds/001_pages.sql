INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  (
    'de',
    '/de',
    'Start',
    'Start – DB-first Starter',
    'DB-first Rendering mit EJS + PostgreSQL',
    '[{"type":"hero","headline":"DB-first Node.js Starter (EJS + PostgreSQL)","subline":"Jede Seite lädt ihren Hauptinhalt aus der Datenbank und rendert ihn als EJS-Komponenten.","cta":{"href":"/kontakt-de","label":"Kontakt"}},{"type":"mediaVideos","headline":"Momente vom Festival","text":"Hier findest du alle Filme und Videos des diesjährigen Filmfestivals. Dabei handelt es sich jedoch zunächst um Einblicke und Vorschaubilder zu den Filmen. Möchtest du die vollständigen Inhalte sehen, dann kannst du entweder ein Ticket für das Kino-Babylon Berlin kaufen oder unser Onlineticket erwerben. Somit hast du Zugriff auf alle Filme, egal wo du gerade bist.","categories":["Alle Filme","Fokus","Featured","Dokumentar","Kurzfilm","Kinder"]},{"type":"mediaTickets","headline":"Tickets & Online-Zugang","text":"Mit dem Online-Pass sicherst du dir den Zugriff auf alle Festival-Videos und kannst die Beiträge jederzeit bequem online anschauen. Wenn du das Festival lieber im Kino erleben möchtest, wirst du direkt zum Babylon Berlin weitergeleitet. So entscheidest du selbst: flexibel online oder als echtes Kino-Erlebnis vor Ort."},{"type":"richText","title":"Wie es funktioniert","html":"<p>Die Tabelle <code>pages</code> enthält pro Seite ein <code>content</code>-JSON (Array von Blocks). Der Controller normalisiert die Blocks (Whitelist) und rendert die passenden EJS-Partial-Komponenten.</p><p>So kannst du später im Admin-Bereich Blocks editieren, speichern und live ausspielen.</p>"},{"type":"cta","title":"Nächster Schritt","text":"Baue jetzt deinen Admin-Editor (Pages/Components) auf Basis deines bestehenden Projekts ein.","button":{"href":"/kontakt-de","label":"Beispielseite"}},{"type":"faq","title":"FAQ","items":[{"q":"Kann ich auch die Startseite aus der DB rendern?","a":"<p>Ja. Im Starter ist <code>/de</code> die Seite mit dem Slug <code>de</code>.</p>"},{"q":"Wie verhindere ich, dass jemand beliebige Includes lädt?","a":"<p>Über eine Whitelist: Block-Typen werden auf erlaubte Partials gemappt. Alles andere wird zu <code>_unknown</code>.</p>"}]}]'::jsonb,    
    true, false, true
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
  ('ueber-uns', '/ueber-uns/', 'Über', 'Über – DB-first Starter', 'Beispielseite aus der Datenbank', '[]'::jsonb, true, false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  ('impressum', '/impressum/', 'Impressum', 'Impressum', 'Impressum', '[]'::jsonb, false, false, true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display)
VALUES
  ('datenschutz', '/datenschutz/', 'Datenschutz', 'Datenschutz', 'Datenschutz', '[]'::jsonb, false, false, true)
ON CONFLICT (slug) DO NOTHING;
