BEGIN;

-- Optional: wenn du wirklich "frisch" willst, dann erst TRUNCATE (vorsichtig mit FK!)
-- TRUNCATE TABLE pages RESTART IDENTITY CASCADE;
-- TRUNCATE TABLE industries RESTART IDENTITY CASCADE;

--------------------------------------------------------------------------------
-- A) INDUSTRIES (Kategorien)
--------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.industries') IS NULL THEN
    RAISE NOTICE 'Table public.industries not found -> skipping industries seed.';
    RETURN;
  END IF;

  -- Minimal-Upsert (name, slug)
  INSERT INTO industries (name, slug)
  VALUES
    ('Haushaltsreinigung', 'household'),
    ('Büroreinigung', 'office'),
    ('Treppenhausreinigung', 'stairwell'),
    ('Fensterreinigung', 'windows'),
    ('Sonderreinigung', 'specials')
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name;
END $$;

--------------------------------------------------------------------------------
-- B) PAGES (DE/EN) – Home + Kernseiten
--    Wichtig: canonical_path wird gesetzt (NOT NULL-Fix)
--------------------------------------------------------------------------------

-- Wir legen die Seed-Daten in einer TEMP Tabelle ab, damit wir sie sauber upserten können.
-- (Wenn deine pages-Tabelle zusätzliche Spalten hat, ist das ok – wir befüllen die Kernfelder.)
CREATE TEMP TABLE seed_pages (
  slug            TEXT,
  canonical_path  TEXT,
  locale          TEXT,
  i18n_group      TEXT,
  title           TEXT,
  meta_title      TEXT,
  meta_description TEXT,
  robots          TEXT,
  nav             BOOLEAN,
  show_in_nav     BOOLEAN,
  nav_order       INT,
  display         BOOLEAN,
  content         JSONB
) ON COMMIT DROP;

INSERT INTO seed_pages (
  slug, canonical_path, locale, i18n_group,
  title, meta_title, meta_description,
  robots, nav, show_in_nav, nav_order, display, content
)
VALUES

-- =========================
-- HOME (DE)
-- =========================
(
  'de', '/de', 'de-DE', 'home',
  'Start',
  'TM Sauber & Mehr UG – Gebäudereinigung in Berlin',
  'Zuverlässige Gebäudereinigung, Büro- und Haushaltsservice in Berlin. Individuelle Angebote und persönliche Beratung.',
  'index,follow',
  TRUE, FALSE, 0, TRUE,
  $$[
    {"type":"hero","headline":"TM Sauber & Mehr UG","subline":"Gebäudereinigung in Berlin","focus":"Fokus: Historie"},    {"type":"richText","html":"<p>Willkommen beim TM Sauber & Mehr UG. Entdecke unsere Reinigungsleistungen für Haushalt, Büro und Gewerbe in Berlin.</p><p>Hier findest du Leistungsübersichten, Kontaktmöglichkeiten und aktuelle Angebote.</p>"},    {"type":"welcome","headline":"Was erwartet dich hier?","video":{"src":""},"links":[{"label":"News","href":"#news","enabled":true},{"label":"Online-Anfragen","href":"#online-offers","enabled":true},{"label":"Vor-Ort-Services","href":"#kino-offers","enabled":true},{"label":"Leistungen","href":"#programm","enabled":true}]},
    {"type":"richText","html":"<p>Willkommen beim TM Sauber & Mehr UG. Entdecke unsere Reinigungsleistungen für Haushalt, Büro und Gewerbe in Berlin.</p><p>Hier findest du Leistungsübersichten, Kontaktmöglichkeiten und aktuelle Angebote.</p>"},    {"type":"imageText","title":"Angebote & Servicepaket","text":"Fordere ein individuelles Angebot an und erfahre mehr über unsere Services.","imageUrl":"/images/placeholder-service.webp","imageAlt":"Publikum im Service"},
    {"type":"cta","headline":"Leistungen entdecken","subline":"Sieh dir die Leistungen und plane deinen Service.","button":{"href":"/programm-de","label":"Zu den Leistungen"}},
    {"type":"faq","items":[
      {"q":"Wann sind Leistungen verfügbar?","a":"Wir sind ganzjährig für dich da und erstellen gerne ein individuelles Angebot."},
      {"q":"Gibt es individuelle Angebote?","a":"Ja, kontaktiere uns für ein passendes Angebot."},
      {"q":"Wo seid ihr tätig?","a":"Wir sind in Berlin und Umgebung im Einsatz."}
    ]}
  ]$$::jsonb
),

-- =========================
-- HOME (EN)
-- =========================
(
  'en', '/en', 'en-US', 'home',
  'Home',
  'TM Sauber & Mehr UG – Cleaning Services in Berlin',
  'Reliable cleaning services for homes and offices in Berlin. Individual offers and personal support.',
  'index,follow',
  TRUE, FALSE, 0, TRUE,
  $$[    {"type":"hero","headline":"TM Sauber & Mehr UG","subline":"Gebäudereinigung in Berlin","focus":"Focus: History"},    
    {"type":"welcome","headline":"What awaits you here?","video":{"src":""},"links":[{"label":"News","href":"#news","enabled":true},{"label":"Online inquiries","href":"#online-offers","enabled":true},{"label":"On-site services","href":"#on-site-service-offers","enabled":true},{"label":"Services","href":"#programme","enabled":true}]},    {"type":"richText","html":"<p>Welcome to the TM Sauber & Mehr UG. Discover our cleaning services for homes, offices, and commercial spaces in Berlin.</p><p>Find service highlights, contact info, and current offers.</p>"},
    {"type":"cta","headline":"Explore our services","subline":"See our services and request a quote.","button":{"href":"/programm-en","label":"View services"}}
  ]$$::jsonb
),

-- =========================
-- KERNSEITEN (DE) – Slugs wie von dir gewünscht
-- =========================
('programm-de',  '/programm-de',  'de-DE','programm','Leistungen','Leistungen – TM Sauber & Mehr UG','Alle Leistungspunkte, Reinigungsleistungen und Services.','index,follow', TRUE, TRUE, 10, TRUE,
 $$[{"type":"hero","headline":"Leistungen","subline":"Alle Reinigungsleistungen und Services auf einen Blick.","cta":{"href":"/tickets-de","label":"Angebote"}}]$$::jsonb),
('news-de',      '/news-de',      'de-DE','news','News','News – TM Sauber & Mehr UG','Aktuelle Ankündigungen und Updates.','index,follow', TRUE, TRUE, 20, TRUE,
 $$[{"type":"hero","headline":"News","subline":"Ankündigungen, Updates und Highlights.","cta":{"href":"/programm-de","label":"Zu den Leistungen"}},{"type":"richText","html":"<p>Hier erscheinen in Kürze die neuesten Service-News.</p>"}]$$::jsonb),
('rahmenplan-de', '/rahmenplan-de', 'de-DE','rahmenplan','Rahmenplan','Rahmenplan – TM Sauber & Mehr UG','Rahmenplan und Serviceablauf auf einen Blick.','index,follow', TRUE, TRUE, 25, TRUE,
 $$[{"type":"rahmenplan","headline":"Rahmenplan","shortText":"Hier findest du den Rahmenplan für das Service.","longText":"Lade die aktuellen Planungsdokumente herunter und erfahre, wie der Ablauf in diesem Jahr gestaltet ist.","poster":{"src":"","alt":""},"downloads":[]}]$$::jsonb),
('tickets-de',   '/tickets-de',   'de-DE','tickets','Angebote','Angebote – TM Sauber & Mehr UG','Angebote fürs Service & Infos zum Servicepaket.','index,follow', TRUE, TRUE, 30, TRUE,
 $$[{"type":"ticketsHero","defaultChoice":"online","tabs":[{"key":"online","label":"Servicepaket"},{"key":"kino","label":"Service-Angebot"}],"online":{"tabLabel":"Servicepaket","title":"Servicepaket","text":"Erhalte Zugriff zu allen Leistungen und Leistungen des diesjährigen Serviceangebots. Du kannst von überall und jederzeit auf die Inhalte in unserer Onlinemediathek zugreifen.","buttonLabel":"Angebot anfragen","buttonUrl":"/online-pass-de","image":{"src":"/images/subscriber_image.png","alt":"Servicepaket"}}, "kino":{"tabLabel":"Service-Angebot","title":"Service-Angebot","text":"Unsere Leistungen und Leistungen werden lokal im unsere Standorte in Berlin und Umgebung im Herzen Berlins übertragen. Du hast die Möglichkeit Online-Anfragen für das Service zu erwerben.","buttonLabel":"Serviceanfrage kaufen","buttonUrl":"/tickets-de","image":{"src":"/images/subscriber_image.png","alt":"Service-Angebot"}}},
   {"type":"ticketsSection","defaultChoice":"online","online":{"headline":"Du hast die Auswahl zwischen 3 verschiedenen Monatspaketen","text":"Mit dem Online-Anfrage hast du von überall und jederzeit Zugriff auf alle Leistungen und Leistungen vom diesjährigen Service. Du hast die Wahl zwischen einem Pass für 1-Monat, 3-Monaten und 6-Monaten. Der entsprechende Preis bezieht sich dabei immer auf die komplette Laufzeit des jeweiligen Passes.","packages":[{"badge":"Neu","badgeColor":"#1e4730","badgeTextColor":"#eafdef","title":"1-Monat-Pass","price":"29 €","priceNote":"pro Person","features":["1-Monat lang voller Zugriff","24/7 Leistungen auf Abruf","Zugang zur Online-Mediathek"],"note":"Begrenzte Plätze","buttonLabel":"Angebot wählen","buttonUrl":"/online-pass-de"},{"badge":"Beliebt","badgeColor":"#e0b15c","badgeTextColor":"#4a3500","title":"3-Monate-Pass","price":"49 €","priceNote":"pro Person","features":["3-Monate lang voller Zugriff","24/7 Leistungen auf Abruf","Zugang zur Online-Mediathek"],"note":"Begrenzte Plätze","buttonLabel":"Angebot wählen","buttonUrl":"/online-pass-de"},{"badge":"Highlight","badgeColor":"#1a3a84","badgeTextColor":"#eaf3ff","title":"6-Monate-Pass","price":"59 €","priceNote":"pro Person","features":["6-Monate lang voller Zugriff","1 kostenloser Servicebesuch","Zugang zur Online-Mediathek"],"note":"Begrenzte Plätze","buttonLabel":"Angebot wählen","buttonUrl":"/online-pass-de"}],"listingHeadline":"Hier findest du eine kleine Auflistung unserer Leistungen:","featured":{"title":"Reinigungsservice Berlin","image":"/images/subscriber_image.png","meta":["2026","Sprache: Englisch, Hebräisch, Deutsch","Regie: Veysi Dag","Produktion: Veysi Dag","Laufzeit: 43 min"],"tag":"SERVICE","description":"Zuverlässige Reinigungslösungen für Büros, Haushalte und Gewerbe in Berlin.","actions":[{"label":"Online-Anfrage kaufen","url":"/online-pass-de"},{"label":"Zum Serviceanfrage","url":"/tickets-de","variant":"secondary"}]},"scenesLabel":"Szenen","scenes":[{"src":"/images/subscriber_image.png","alt":"Szene 1"},{"src":"/images/background.png","alt":"Szene 2"},{"src":"/images/subscriber_image.png","alt":"Szene 3"}],"servicesHeadline":"Alle Leistungen","servicesLink":"/video-de","servicesLinkLabel":"Alle anzeigen","services":[{"title":"Haushaltsreinigung","image":"/images/subscriber_image.png"},{"title":"Büroreinigung","image":"/images/background.png"},{"title":"Fensterreinigung","image":"/images/subscriber_image.png"},{"title":"Treppenhausreinigung","image":"/images/background.png"}]}, "kino":{"headline":"Hier findest du alle Leistungen, welche momentan im unsere Standorte in Berlin und Umgebung gespielt werden:","text":"Du kannst hier einen kleinen Einblick zum jeweiligen Service und die ersten Szenen sehen.","listingHeadline":"","featured":{"title":"Reinigungsservice Berlin","image":"/images/subscriber_image.png","meta":["2026","Sprache: Englisch, Hebräisch, Deutsch","Regie: Veysi Dag","Produktion: Veysi Dag","Laufzeit: 43 min"],"tag":"SERVICE","description":"Zuverlässige Reinigungslösungen für Büros, Haushalte und Gewerbe in Berlin.","actions":[{"label":"Serviceanfrage kaufen","url":"/tickets-de"},{"label":"Zum Servicepaket","url":"/online-pass-de","variant":"secondary"}]},"scenesLabel":"Szenen","scenes":[{"src":"/images/subscriber_image.png","alt":"Szene 1"},{"src":"/images/background.png","alt":"Szene 2"},{"src":"/images/subscriber_image.png","alt":"Szene 3"}],"nowPlayingHeadline":"Diese Woche im Service","nowPlayingLink":"/programm-de","nowPlayingLinkLabel":"Alle anzeigen","nowPlaying":[{"title":"Haushaltsreinigung","image":"/images/subscriber_image.png"},{"title":"Büroreinigung","image":"/images/background.png"},{"title":"Fensterreinigung","image":"/images/subscriber_image.png"},{"title":"Treppenhausreinigung","image":"/images/background.png"}],"upcomingHeadline":"Ab 18.09.2026 im Service","upcoming":[{"title":"Büroreinigung","image":"/images/background.png"},{"title":"Haushaltsreinigung","image":"/images/subscriber_image.png"},{"title":"Grundreinigung","image":"/images/subscriber_image.png"},{"title":"Fensterreinigung","image":"/images/background.png"}]}}
  ]$$::jsonb),

 ('online-pass-de','/online-pass-de','de-DE','online-pass','Servicepaket','Servicepaket – TM Sauber & Mehr UG','Ausgewählte Leistungen online ansehen.','index,follow', TRUE, TRUE, 40, TRUE,
 $$[{"type":"hero","headline":"Servicepaket","subline":"Ausgewählte Leistungen online streamen.","cta":{"href":"/tickets-de","label":"Jetzt kaufen"}},{"type":"richText","html":"<p>Mit dem Servicepaket erhältst du Zugriff auf ausgewählte Serviceinhalte. Details folgen.</p>"}]$$::jsonb),
('team-de',      '/team-de',      'de-DE','team','Team','Team – TM Sauber & Mehr UG','Wer hinter dem Service steht.','index,follow', TRUE, TRUE, 50, TRUE,
 $$[
  {"type":"hero","headline":"Team","subline":"Menschen, die das Service möglich machen.","cta":{"href":"/kontakt-de","label":"Kontakt"}},
  {"type":"teamAbout","headline":"Über","text":"Hier kannst du das Service-Team vorstellen und allgemeine Informationen zum Service teilen."}
  ]$$::jsonb),
 ('sponsor-de',   '/sponsor-de',   'de-DE','sponsor','Sponsoren','Sponsoren – TM Sauber & Mehr UG','Unsere Unterstützer und Partner.','index,follow', TRUE, TRUE, 70, TRUE,
  $$[
  {"type":"sponsorHero","title":"Unsere Sponsoren","subtitle":"Sponsoren & Partner"},
  {"type":"sponsors","headline":"Unsere Unterstützer","text":"Vielen Dank für die Unterstützung und Support unseres Services."}
   ]$$::jsonb),
 ('kontakt-de',   '/kontakt-de',   'de-DE','contact','Kontakt','Kontakt – TM Sauber & Mehr UG','Schreib uns – Presse, Kooperationen, Fragen.','index,follow', TRUE, TRUE, 60, TRUE, $$[{"type":"hero","headline":"Kontakt","subline":"Presse, Kooperationen und allgemeine Anfragen.","cta":{"href":"mailto:info@example.org","label":"E-Mail senden"}},{"type":"richText","html":"<p>Kontaktformular/Infos kannst du hier platzieren.</p>"}]$$::jsonb),
-- =========================
-- KERNSEITEN (EN)
-- =========================
('programm-en',    '/programm-en',   'en-US','programm','Services','Services – TM Sauber & Mehr UG','All cleaning services and consulting at a glance.','index,follow', TRUE, TRUE, 10, TRUE,
 $$[{"type":"hero","headline":"Services","subline":"All cleaning services and consulting at a glance.","cta":{"href":"/tickets-en","label":"Angebote"}}]$$::jsonb),
('news-en',        '/news-en',        'en-US','news','News','News – TM Sauber & Mehr UG','Announcements and updates.','index,follow', TRUE, TRUE, 20, TRUE,
 $$[{"type":"hero","headline":"News","subline":"Announcements, updates and highlights.","cta":{"href":"/programm-en","label":"Services"}},{"type":"richText","html":"<p>Service news will be published here soon.</p>"}]$$::jsonb),
('rahmenplan-en',   '/rahmenplan-en',   'en-US','rahmenplan','Framework plan','Framework plan – TM Sauber & Mehr UG','Service framework plan and schedule overview.','index,follow', TRUE, TRUE, 25, TRUE,
 $$[{"type":"rahmenplan","headline":"Framework plan","shortText":"Find the framework plan for the service here.","longText":"Download the latest planning documents and learn how this year’s schedule is structured.","poster":{"src":"","alt":""},"downloads":[]}]$$::jsonb),
('tickets-en',     '/tickets-en',     'en-US','tickets','Angebote','Angebote – TM Sauber & Mehr UG','On-site services & online service information.','index,follow', TRUE, TRUE, 30, TRUE,
 $$[{"type":"ticketsHero","defaultChoice":"online","tabs":[{"key":"online","label":"Online Service"},{"key":"kino","label":"On-site service"}],"online":{"tabLabel":"Online Service","title":"Online Service","text":"Get access to all services and services from this year's service. You can watch the content in our online media library anytime and anywhere.","buttonLabel":"Get online access","buttonUrl":"/online-pass-en","image":{"src":"/images/subscriber_image.png","alt":"Online Service"}}, "kino":{"tabLabel":"On-site service","title":"On-site service","text":"Our services are screened locally at unsere Standorte in Berlin und Umgebung. You can purchase online offers for the on-site service.","buttonLabel":"Request on-site service","buttonUrl":"/tickets-en","image":{"src":"/images/subscriber_image.png","alt":"On-site service"}}},
   {"type":"ticketsSection","defaultChoice":"online","online":{"headline":"Choose between 3 different monthly packages","text":"With the online offer you can access all services from this year's service wherever you are. Choose between 1-month, 3-month and 6-month passes. The price always covers the full duration of the pass.","packages":[{"badge":"New","badgeColor":"#1e4730","badgeTextColor":"#eafdef","title":"1-Month Pass","price":"€29","priceNote":"per person","features":["Full access for 1 month","24/7 services on demand","Access to the online media library"],"note":"Limited seats","buttonLabel":"Choose offer","buttonUrl":"/online-pass-en"},{"badge":"Popular","badgeColor":"#e0b15c","badgeTextColor":"#4a3500","title":"3-Month Pass","price":"€49","priceNote":"per person","features":["Full access for 3 months","24/7 services on demand","Access to the online media library"],"note":"Limited seats","buttonLabel":"Choose offer","buttonUrl":"/online-pass-en"},{"badge":"Highlight","badgeColor":"#1a3a84","badgeTextColor":"#eaf3ff","title":"6-Month Pass","price":"€59","priceNote":"per person","features":["Full access for 6 months","1 free on-site service visit","Access to the online media library"],"note":"Limited seats","buttonLabel":"Choose offer","buttonUrl":"/online-pass-en"}],"listingHeadline":"Here is a small selection of our services:","featured":{"title":"Reinigungsservice Berlin","image":"/images/subscriber_image.png","meta":["2026","Languages: English, Hebrew, German","Director: Veysi Dag","Production: Veysi Dag","Duration: 43 min"],"tag":"SERVICE","description":"Zuverlässige Reinigungslösungen für Büros, Haushalte und Gewerbe in Berlin.","actions":[{"label":"Buy online offer","url":"/online-pass-en"},{"label":"View on-site services","url":"/tickets-en","variant":"secondary"}]},"scenesLabel":"Scenes","scenes":[{"src":"/images/subscriber_image.png","alt":"Scene 1"},{"src":"/images/background.png","alt":"Scene 2"},{"src":"/images/subscriber_image.png","alt":"Scene 3"}],"servicesHeadline":"All services","servicesLink":"/video-en","servicesLinkLabel":"View all","services":[{"title":"Haushaltsreinigung","image":"/images/subscriber_image.png"},{"title":"Büroreinigung","image":"/images/background.png"},{"title":"Grundreinigung","image":"/images/subscriber_image.png"},{"title":"Treppenhausreinigung","image":"/images/background.png"}]}, "kino":{"headline":"Here are the services currently playing at unsere Standorte in Berlin und Umgebung:","text":"Get a short preview of each service and watch the first scenes.","listingHeadline":"","featured":{"title":"Reinigungsservice Berlin","image":"/images/subscriber_image.png","meta":["2026","Languages: English, Hebrew, German","Director: Veysi Dag","Production: Veysi Dag","Duration: 43 min"],"tag":"SERVICE","description":"Zuverlässige Reinigungslösungen für Büros, Haushalte und Gewerbe in Berlin.","actions":[{"label":"Request on-site service","url":"/tickets-en"},{"label":"Go to online service","url":"/online-pass-en","variant":"secondary"}]},"scenesLabel":"Scenes","scenes":[{"src":"/images/subscriber_image.png","alt":"Scene 1"},{"src":"/images/background.png","alt":"Scene 2"},{"src":"/images/subscriber_image.png","alt":"Scene 3"}],"nowPlayingHeadline":"This week in service","nowPlayingLink":"/programm-en","nowPlayingLinkLabel":"View all","nowPlaying":[{"title":"Haushaltsreinigung","image":"/images/subscriber_image.png"},{"title":"Büroreinigung","image":"/images/background.png"},{"title":"Grundreinigung","image":"/images/subscriber_image.png"},{"title":"Treppenhausreinigung","image":"/images/background.png"}],"upcomingHeadline":"Starting 18.09.2026","upcoming":[{"title":"Büroreinigung","image":"/images/background.png"},{"title":"Haushaltsreinigung","image":"/images/subscriber_image.png"},{"title":"Der Döner King","image":"/images/subscriber_image.png"},{"title":"Grundreinigung","image":"/images/background.png"}]}}
 ]$$::jsonb),


 ('online-pass-en', '/online-pass-en', 'en-US','online-pass','Service package','Online Service – TM Sauber & Mehr UG','Access selected services online.','index,follow', TRUE, TRUE, 40, TRUE,
 $$[{"type":"hero","headline":"Service package","subline":"Access selected services online.","cta":{"href":"/tickets-en","label":"Buy now"}},{"type":"richText","html":"<p>With the online service you get access to selected service content. Details coming soon.</p>"}]$$::jsonb),
('team-en',        '/team-en',        'en-US','team','Team','Team – TM Sauber & Mehr UG','People behind the service.','index,follow', TRUE, TRUE, 50, TRUE,
 $$[
  {"type":"hero","headline":"Team","subline":"People who make the service happen.","cta":{"href":"/kontakt-en","label":"Contact"}},
  {"type":"teamAbout","headline":"About","text":"Use this space to introduce the service team and share background information about the service."}
 ]$$::jsonb),
 ('sponsor-en',     '/sponsor-en',     'en-US','sponsor','Sponsors','Sponsors – TM Sauber & Mehr UG','Our supporters and partners.','index,follow', TRUE, TRUE, 70, TRUE, $$[
  {"type":"sponsorHero","title":"Our Supporters","subtitle":"Sponsors & Partners"},
   {"type":"sponsors","headline":"Our Supporters","text":"Thank you for supporting our service."}
 ]$$::jsonb),
 ('kontakt-en',     '/kontakt-en',     'en-US','contact','Contact','Contact – TM Sauber & Mehr UG','Press, partnerships and questions.','index,follow', TRUE, TRUE, 60, TRUE,
 $$[{"type":"hero","headline":"Contact","subline":"Press, partnerships and general enquiries.","cta":{"href":"mailto:info@example.org","label":"Send email"}}]$$::jsonb)
;
-- Upsert in pages: nur die Spalten, die in deiner echten Tabelle existieren und die wir im Seed haben.
DO $$
DECLARE
  cols TEXT[];
  cols_sql TEXT;
  set_sql  TEXT;
BEGIN
  IF to_regclass('public.pages') IS NULL THEN
    RAISE EXCEPTION 'Table public.pages not found.';
  END IF;

  -- Schnittmenge aus (Seed-Spalten) und (echten pages-Spalten)
  SELECT array_agg(c.column_name ORDER BY c.ordinal_position)
  INTO cols
  FROM information_schema.columns c
  WHERE c.table_schema='public'
    AND c.table_name='pages'
    AND c.column_name = ANY(ARRAY[
      'slug','canonical_path','locale','i18n_group',
      'title','meta_title','meta_description','robots',
      'nav','show_in_nav','nav_order','display','content'
    ]);

  IF cols IS NULL OR NOT ('slug' = ANY(cols)) THEN
    RAISE EXCEPTION 'pages.slug missing (or not visible in information_schema).';
  END IF;

  cols_sql := array_to_string(ARRAY(SELECT format('%I', x) FROM unnest(cols) x), ', ');

  -- Update alle gesetzten Spalten außer slug
  SELECT string_agg(format('%I = EXCLUDED.%I', x, x), ', ')
  INTO set_sql
  FROM unnest(cols) x
  WHERE x NOT IN ('slug','id','created_at');

  EXECUTE format(
    'INSERT INTO public.pages (%s)
     SELECT %s FROM seed_pages
     ON CONFLICT (slug) DO UPDATE SET %s;',
    cols_sql, cols_sql, set_sql
  );
END $$;

COMMIT;
