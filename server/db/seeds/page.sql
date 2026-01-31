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
    ('Spielfilm', 'feature'),
    ('Dokumentation', 'documentary'),
    ('Kurzfilm', 'short'),
    ('Panel & Q&A', 'talks'),
    ('Specials', 'specials')
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name;
END $$;

--------------------------------------------------------------------------------
-- B) PAGES (DE/EN/KU) – Home + Kernseiten
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
  'Kurdisches Filmfestival Berlin – Kino & Online',
  'Filme, Gespräche und Kultur: Kurdisches Filmfestival Berlin – im Kino und online. Programm, Tickets und Online-Pass.',
  'index,follow',
  TRUE, FALSE, 0, TRUE,
  $$[
    {"type":"hero","headline":"Kurdisches Filmfestival Berlin","subline":"12-13 September 2026","focus":"Fokus: Historie"},    {"type":"richText","html":"<p>Willkommen beim Kurdischen Filmfestival Berlin. Entdecke Spielfilme, Dokumentationen und Kurzfilme aus Kurdistan und der Diaspora – ergänzt durch Panels, Q&As und Begegnungen.</p><p>Hier findest du Programm-Highlights, News, Tickets sowie den Online-Pass für ausgewählte Inhalte.</p>"},    {"type":"welcome","headline":"Was erwartet dich hier?","video":{"src":""},"links":[{"label":"News","href":"#news","enabled":true},{"label":"Online-Tickets","href":"#online-tickets","enabled":true},{"label":"Kino-Tickets","href":"#kino-tickets","enabled":true},{"label":"Programm","href":"#programm","enabled":true}]},
    {"type":"richText","html":"<p>Willkommen beim Kurdischen Filmfestival Berlin. Entdecke Spielfilme, Dokumentationen und Kurzfilme aus Kurdistan und der Diaspora – ergänzt durch Panels, Q&As und Begegnungen.</p><p>Hier findest du Programm-Highlights, News, Tickets sowie den Online-Pass für ausgewählte Inhalte.</p>"},    {"type":"imageText","title":"Tickets & Online-Pass","text":"Sichere dir dein Kino-Ticket oder hol dir den Online-Pass, um ausgewählte Filme bequem von überall zu sehen.","imageUrl":"/images/placeholder-festival.webp","imageAlt":"Publikum im Kino"},
    {"type":"cta","headline":"Programm entdecken","subline":"Sieh dir die Programmpunkte an und plane deinen Festivalbesuch.","button":{"href":"/programm-de","label":"Zum Programm"}},
    {"type":"faq","items":[
      {"q":"Wann findet das Festival statt?","a":"Geplant ist September 2026. Die genauen Termine veröffentlichen wir rechtzeitig auf dieser Seite."},
      {"q":"Gibt es einen Online-Pass?","a":"Ja. Mit dem Online-Pass kannst du ausgewählte Filme online ansehen. Details findest du unter „Online-Pass“."},
      {"q":"Wo findet das Festival statt?","a":"In Berlin (Kino-Location folgt) und ergänzend online."}
    ]}
  ]$$::jsonb
),

-- =========================
-- HOME (EN)
-- =========================
(
  'en', '/en', 'en-US', 'home',
  'Home',
  'Kurdish Film Festival Berlin – Cinema & Online',
  'Films, talks and culture: Kurdish Film Festival Berlin – in cinema and online. Programme, tickets and online pass.',
  'index,follow',
  TRUE, FALSE, 0, TRUE,
  $$[
    {"type":"hero","headline":"Kurdish Film Festival Berlin","subline":"12-13 September 2026","focus":"Focus: History"},    
    {"type":"welcome","headline":"What awaits you here?","video":{"src":""},"links":[{"label":"News","href":"#news","enabled":true},{"label":"Online tickets","href":"#online-tickets","enabled":true},{"label":"Cinema tickets","href":"#cinema-tickets","enabled":true},{"label":"Programme","href":"#programme","enabled":true}]},    {"type":"richText","html":"<p>Welcome to the Kurdish Film Festival Berlin. Discover feature films, documentaries and shorts from Kurdistan and the diaspora – complemented by panels, Q&As and encounters.</p><p>Find programme highlights, news, tickets and the online pass for selected content.</p>"},
    {"type":"cta","headline":"Explore the programme","subline":"Browse programme items and plan your festival days.","button":{"href":"/programm-en","label":"View programme"}}
  ]$$::jsonb
),

-- =========================
-- HOME (KU) – Platzhalter-Kurdish (bitte später sprachlich finalisieren)
-- =========================
(
  'ku', '/ku', 'ku', 'home',
  'Destpêk',
  'Festîvala Fîlman a Kurdî ya Berlînê – Sînemayê & Online',
  'Fîlm, gotûbêj û çand: Festîvala Fîlman a Kurdî ya Berlînê – li sînemayê û online. Bername, bilêt û online-pass.',
  'index,follow',
  TRUE, FALSE, 0, TRUE,
  $$[
    {"type":"hero","headline":"Festîvala Fîlman a Kurdî ya Berlînê","subline":"12-13 September 2026","focus":"Fokus: Historie"},
    {"type":"welcome","headline":"Li vir tu çi dibînî?","video":{"src":""},"links":[{"label":"Nûçe","href":"#news","enabled":true},{"label":"Online bilêt","href":"#online-tickets","enabled":true},{"label":"Bilêtên sînemayê","href":"#cinema-tickets","enabled":true},{"label":"Bername","href":"#programme","enabled":true}]},
    {"type":"richText","html":"<p>Bi xêr hatî Festîvala Fîlman a Kurdî ya Berlînê. Li vir fîlmên dirêj, belgefîlm û kurtfîlmên Kurdistanê û diaspora bibîne.</p><p>Tu dikarî bername, nûçe, bilêt û online-pass li vir bibînî.</p>"}
  ]$$::jsonb
),

-- =========================
-- KERNSEITEN (DE) – Slugs wie von dir gewünscht
-- =========================
('programm-de',  '/programm-de',  'de-DE','programm','Programm','Programm – Kurdisches Filmfestival Berlin','Alle Programmpunkte, Screenings, Panels & Q&As.','index,follow', TRUE, TRUE, 10, TRUE,
 $$[{"type":"hero","headline":"Programm","subline":"Alle Screenings, Panels und Q&As auf einen Blick.","cta":{"href":"/tickets-de","label":"Tickets"}}]$$::jsonb),
('news-de',      '/news-de',      'de-DE','news','News','News – Kurdisches Filmfestival Berlin','Aktuelle Ankündigungen und Updates.','index,follow', TRUE, TRUE, 20, TRUE,
 $$[{"type":"hero","headline":"News","subline":"Ankündigungen, Updates und Highlights.","cta":{"href":"/programm-de","label":"Zum Programm"}},{"type":"richText","html":"<p>Hier erscheinen in Kürze die neuesten Festival-News.</p>"}]$$::jsonb),
('rahmenplan-de', '/rahmenplan-de', 'de-DE','rahmenplan','Rahmenplan','Rahmenplan – Kurdisches Filmfestival Berlin','Rahmenplan und Festivalablauf auf einen Blick.','index,follow', TRUE, TRUE, 25, TRUE,
 $$[{"type":"rahmenplan","headline":"Rahmenplan","shortText":"Hier findest du den Rahmenplan für das Festival.","longText":"Lade die aktuellen Planungsdokumente herunter und erfahre, wie der Ablauf in diesem Jahr gestaltet ist.","poster":{"src":"","alt":""},"downloads":[]}]$$::jsonb),
('tickets-de',   '/tickets-de',   'de-DE','tickets','Tickets','Tickets – Kurdisches Filmfestival Berlin','Tickets fürs Kino & Infos zum Online-Pass.','index,follow', TRUE, TRUE, 30, TRUE,
 $$[{"type":"ticketsHero","defaultChoice":"online","tabs":[{"key":"online","label":"Online-Pass"},{"key":"kino","label":"Kino-Ticket"}],"online":{"tabLabel":"Online-Pass","title":"Online-Pass","text":"Erhalte Zugriff zu allen Videos und Filmen des diesjährigen Filmfestivals. Du kannst von überall und jederzeit auf die Inhalte in unserer Onlinemediathek zugreifen.","buttonLabel":"Onlinezugang erlangen","buttonUrl":"/online-pass-de","image":{"src":"/images/subscriber_image.png","alt":"Online-Pass"}}, "kino":{"tabLabel":"Kino-Ticket","title":"Kino-Ticket","text":"Unsere Filme und Videos werden lokal im Kino Babylon Berlin im Herzen Berlins übertragen. Du hast die Möglichkeit Online-Tickets für das Kino zu erwerben.","buttonLabel":"Kinoticket kaufen","buttonUrl":"/tickets-de","image":{"src":"/images/subscriber_image.png","alt":"Kino-Ticket"}}},
   {"type":"ticketsSection","defaultChoice":"online","online":{"headline":"Du hast die Auswahl zwischen 3 verschiedenen Monatspaketen","text":"Mit dem Onlineticket hast du von überall und jederzeit Zugriff auf alle Filme und Videos vom diesjährigen Festival. Du hast die Wahl zwischen einem Pass für 1-Monat, 3-Monaten und 6-Monaten. Der entsprechende Preis bezieht sich dabei immer auf die komplette Laufzeit des jeweiligen Passes.","packages":[{"badge":"Neu","badgeColor":"#1e4730","badgeTextColor":"#eafdef","title":"1-Monat-Pass","price":"29 €","priceNote":"pro Person","features":["1-Monat lang voller Zugriff","24/7 Videos auf Abruf","Zugang zur Online-Mediathek"],"note":"Begrenzte Plätze","buttonLabel":"Ticket wählen","buttonUrl":"/online-pass-de"},{"badge":"Beliebt","badgeColor":"#e0b15c","badgeTextColor":"#4a3500","title":"3-Monate-Pass","price":"49 €","priceNote":"pro Person","features":["3-Monate lang voller Zugriff","24/7 Videos auf Abruf","Zugang zur Online-Mediathek"],"note":"Begrenzte Plätze","buttonLabel":"Ticket wählen","buttonUrl":"/online-pass-de"},{"badge":"Highlight","badgeColor":"#1a3a84","badgeTextColor":"#eaf3ff","title":"6-Monate-Pass","price":"59 €","priceNote":"pro Person","features":["6-Monate lang voller Zugriff","1 kostenloser Kinobesuch","Zugang zur Online-Mediathek"],"note":"Begrenzte Plätze","buttonLabel":"Ticket wählen","buttonUrl":"/online-pass-de"}],"listingHeadline":"Hier findest du eine kleine Auflistung unserer Filme:","featured":{"title":"Bêwar: Kurdish Asylum Seekers in Tel Aviv","image":"/images/subscriber_image.png","meta":["2026","Sprache: Englisch, Kurdisch, Hebräisch, Deutsch","Regie: Veysi Dag","Produktion: Veysi Dag","Laufzeit: 43 min"],"tag":"ONLINE","description":"Bêwar ist eine mutige und eindringliche Dokumentation, die das bislang unsichtbare Leben der kurdischen Geflüchteten in Tel Aviv beleuchtet.","actions":[{"label":"Onlineticket kaufen","url":"/online-pass-de"},{"label":"Zum Kinoticket","url":"/tickets-de","variant":"secondary"}]},"scenesLabel":"Szenen","scenes":[{"src":"/images/subscriber_image.png","alt":"Szene 1"},{"src":"/images/background.png","alt":"Szene 2"},{"src":"/images/subscriber_image.png","alt":"Szene 3"}],"videosHeadline":"Alle Filme","videosLink":"/video-de","videosLinkLabel":"Alle anzeigen","videos":[{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Belindana","image":"/images/background.png"},{"title":"Das ungenutzte Potential","image":"/images/subscriber_image.png"},{"title":"Der Dön...","image":"/images/background.png"}]}, "kino":{"headline":"Hier findest du alle Filme, welche momentan im Kino Babylon Berlin gespielt werden:","text":"Du kannst hier einen kleinen Einblick zum jeweiligen Film und die ersten Szenen sehen.","listingHeadline":"","featured":{"title":"Bêwar: Kurdish Asylum Seekers in Tel Aviv","image":"/images/subscriber_image.png","meta":["2026","Sprache: Englisch, Kurdisch, Hebräisch, Deutsch","Regie: Veysi Dag","Produktion: Veysi Dag","Laufzeit: 43 min"],"tag":"KINO","description":"Bêwar ist eine mutige und eindringliche Dokumentation, die das bislang unsichtbare Leben der kurdischen Geflüchteten in Tel Aviv beleuchtet.","actions":[{"label":"Kinoticket kaufen","url":"/tickets-de"},{"label":"Zum Onlinepass","url":"/online-pass-de","variant":"secondary"}]},"scenesLabel":"Szenen","scenes":[{"src":"/images/subscriber_image.png","alt":"Szene 1"},{"src":"/images/background.png","alt":"Szene 2"},{"src":"/images/subscriber_image.png","alt":"Szene 3"}],"nowPlayingHeadline":"Diese Woche im Kino","nowPlayingLink":"/programm-de","nowPlayingLinkLabel":"Alle anzeigen","nowPlaying":[{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Belindana","image":"/images/background.png"},{"title":"Das ungenutzte Potential","image":"/images/subscriber_image.png"},{"title":"Der Dön...","image":"/images/background.png"}],"upcomingHeadline":"Ab 18.09.2026 im Kino","upcoming":[{"title":"Belindana","image":"/images/background.png"},{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Der Dönerkönig","image":"/images/subscriber_image.png"},{"title":"Das ungenutzte Potential","image":"/images/background.png"}]}}
 ]$$::jsonb),
 ('online-pass-de','/online-pass-de','de-DE','online-pass','Online-Pass','Online-Pass – Kurdisches Filmfestival Berlin','Ausgewählte Filme online ansehen.','index,follow', TRUE, TRUE, 40, TRUE,
 $$[{"type":"hero","headline":"Online-Pass","subline":"Ausgewählte Filme online streamen.","cta":{"href":"/tickets-de","label":"Jetzt kaufen"}},{"type":"richText","html":"<p>Mit dem Online-Pass erhältst du Zugriff auf ausgewählte Festivalinhalte. Details folgen.</p>"}]$$::jsonb),
('team-de',      '/team-de',      'de-DE','team','Team','Team – Kurdisches Filmfestival Berlin','Wer hinter dem Festival steht.','index,follow', TRUE, TRUE, 50, TRUE,
 $$[
  {"type":"hero","headline":"Team","subline":"Menschen, die das Festival möglich machen.","cta":{"href":"/kontakt-de","label":"Kontakt"}},
  {"type":"teamAbout","headline":"Über","text":"Hier kannst du das Festival-Team vorstellen und allgemeine Informationen zum Festival teilen."}
 ]$$::jsonb),
 ('sponsor-de',   '/sponsor-de',   'de-DE','sponsor','Sponsoren','Sponsoren – Kurdisches Filmfestival Berlin','Unsere Unterstützer und Partner.','index,follow', TRUE, TRUE, 70, TRUE,
 $$[
  {"type":"sponsorHero","title":"Unsere Sponsoren","subtitle":"Sponsoren & Partner"},
  {"type":"sponsors","headline":"Unsere Unterstützer","text":"Vielen Dank für die Unterstützung und Support unseres Festivals."}
 ]$$::jsonb),
 ('kontakt-de',   '/kontakt-de',   'de-DE','contact','Kontakt','Kontakt – Kurdisches Filmfestival Berlin','Schreib uns – Presse, Kooperationen, Fragen.','index,follow', TRUE, TRUE, 60, TRUE, $$[{"type":"hero","headline":"Kontakt","subline":"Presse, Kooperationen und allgemeine Anfragen.","cta":{"href":"mailto:info@example.org","label":"E-Mail senden"}},{"type":"richText","html":"<p>Kontaktformular/Infos kannst du hier platzieren.</p>"}]$$::jsonb),

-- =========================
-- KERNSEITEN (EN)
-- =========================
('programm-en',    '/programm-en',   'en-US','programm','Programme','Programme – Kurdish Film Festival Berlin','All screenings, panels & Q&As.','index,follow', TRUE, TRUE, 10, TRUE,
 $$[{"type":"hero","headline":"Programme","subline":"All screenings, panels and Q&As.","cta":{"href":"/tickets-en","label":"Tickets"}}]$$::jsonb),
('news-en',        '/news-en',        'en-US','news','News','News – Kurdish Film Festival Berlin','Announcements and updates.','index,follow', TRUE, TRUE, 20, TRUE,
 $$[{"type":"hero","headline":"News","subline":"Announcements, updates and highlights.","cta":{"href":"/programm-en","label":"Programme"}},{"type":"richText","html":"<p>Festival news will be published here soon.</p>"}]$$::jsonb),
('rahmenplan-en',   '/rahmenplan-en',   'en-US','rahmenplan','Framework plan','Framework plan – Kurdish Film Festival Berlin','Festival framework plan and schedule overview.','index,follow', TRUE, TRUE, 25, TRUE,
 $$[{"type":"rahmenplan","headline":"Framework plan","shortText":"Find the framework plan for the festival here.","longText":"Download the latest planning documents and learn how this year’s schedule is structured.","poster":{"src":"","alt":""},"downloads":[]}]$$::jsonb),
('tickets-en',     '/tickets-en',     'en-US','tickets','Tickets','Tickets – Kurdish Film Festival Berlin','Cinema tickets & online pass information.','index,follow', TRUE, TRUE, 30, TRUE,
 $$[{"type":"ticketsHero","defaultChoice":"online","tabs":[{"key":"online","label":"Online Pass"},{"key":"kino","label":"Cinema Ticket"}],"online":{"tabLabel":"Online Pass","title":"Online Pass","text":"Get access to all videos and films from this year's festival. You can watch the content in our online media library anytime and anywhere.","buttonLabel":"Get online access","buttonUrl":"/online-pass-en","image":{"src":"/images/subscriber_image.png","alt":"Online Pass"}}, "kino":{"tabLabel":"Cinema Ticket","title":"Cinema Ticket","text":"Our films and videos are screened locally at Kino Babylon Berlin. You can purchase online tickets for the cinema.","buttonLabel":"Buy cinema ticket","buttonUrl":"/tickets-en","image":{"src":"/images/subscriber_image.png","alt":"Cinema Ticket"}}},
   {"type":"ticketsSection","defaultChoice":"online","online":{"headline":"Choose between 3 different monthly packages","text":"With the online ticket you can access all films and videos from this year's festival wherever you are. Choose between 1-month, 3-month and 6-month passes. The price always covers the full duration of the pass.","packages":[{"badge":"New","badgeColor":"#1e4730","badgeTextColor":"#eafdef","title":"1-Month Pass","price":"€29","priceNote":"per person","features":["Full access for 1 month","24/7 videos on demand","Access to the online media library"],"note":"Limited seats","buttonLabel":"Choose ticket","buttonUrl":"/online-pass-en"},{"badge":"Popular","badgeColor":"#e0b15c","badgeTextColor":"#4a3500","title":"3-Month Pass","price":"€49","priceNote":"per person","features":["Full access for 3 months","24/7 videos on demand","Access to the online media library"],"note":"Limited seats","buttonLabel":"Choose ticket","buttonUrl":"/online-pass-en"},{"badge":"Highlight","badgeColor":"#1a3a84","badgeTextColor":"#eaf3ff","title":"6-Month Pass","price":"€59","priceNote":"per person","features":["Full access for 6 months","1 free cinema visit","Access to the online media library"],"note":"Limited seats","buttonLabel":"Choose ticket","buttonUrl":"/online-pass-en"}],"listingHeadline":"Here is a small selection of our films:","featured":{"title":"Bêwar: Kurdish Asylum Seekers in Tel Aviv","image":"/images/subscriber_image.png","meta":["2026","Languages: English, Kurdish, Hebrew, German","Director: Veysi Dag","Production: Veysi Dag","Duration: 43 min"],"tag":"ONLINE","description":"Bêwar is a moving documentary that sheds light on the previously unseen lives of Kurdish refugees in Tel Aviv.","actions":[{"label":"Buy online ticket","url":"/online-pass-en"},{"label":"Go to cinema ticket","url":"/tickets-en","variant":"secondary"}]},"scenesLabel":"Scenes","scenes":[{"src":"/images/subscriber_image.png","alt":"Scene 1"},{"src":"/images/background.png","alt":"Scene 2"},{"src":"/images/subscriber_image.png","alt":"Scene 3"}],"videosHeadline":"All videos","videosLink":"/video-en","videosLinkLabel":"View all","videos":[{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Belindana","image":"/images/background.png"},{"title":"Untapped Potential","image":"/images/subscriber_image.png"},{"title":"Der Dön...","image":"/images/background.png"}]}, "kino":{"headline":"Here are the films currently playing at Kino Babylon Berlin:","text":"Get a short preview of each film and watch the first scenes.","listingHeadline":"","featured":{"title":"Bêwar: Kurdish Asylum Seekers in Tel Aviv","image":"/images/subscriber_image.png","meta":["2026","Languages: English, Kurdish, Hebrew, German","Director: Veysi Dag","Production: Veysi Dag","Duration: 43 min"],"tag":"CINEMA","description":"Bêwar is a moving documentary that sheds light on the previously unseen lives of Kurdish refugees in Tel Aviv.","actions":[{"label":"Buy cinema ticket","url":"/tickets-en"},{"label":"Go to online pass","url":"/online-pass-en","variant":"secondary"}]},"scenesLabel":"Scenes","scenes":[{"src":"/images/subscriber_image.png","alt":"Scene 1"},{"src":"/images/background.png","alt":"Scene 2"},{"src":"/images/subscriber_image.png","alt":"Scene 3"}],"nowPlayingHeadline":"This week in cinema","nowPlayingLink":"/programm-en","nowPlayingLinkLabel":"View all","nowPlaying":[{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Belindana","image":"/images/background.png"},{"title":"Untapped Potential","image":"/images/subscriber_image.png"},{"title":"Der Dön...","image":"/images/background.png"}],"upcomingHeadline":"In cinema from 18.09.2026","upcoming":[{"title":"Belindana","image":"/images/background.png"},{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Der Döner King","image":"/images/subscriber_image.png"},{"title":"Untapped Potential","image":"/images/background.png"}]}}
 ]$$::jsonb),
 ('online-pass-en', '/online-pass-en', 'en-US','online-pass','Online pass','Online Pass – Kurdish Film Festival Berlin','Watch selected films online.','index,follow', TRUE, TRUE, 40, TRUE,
 $$[{"type":"hero","headline":"Online pass","subline":"Stream selected films online.","cta":{"href":"/tickets-en","label":"Buy now"}},{"type":"richText","html":"<p>With the online pass you get access to selected festival content. Details coming soon.</p>"}]$$::jsonb),
('team-en',        '/team-en',        'en-US','team','Team','Team – Kurdish Film Festival Berlin','People behind the festival.','index,follow', TRUE, TRUE, 50, TRUE,
 $$[
  {"type":"hero","headline":"Team","subline":"People who make the festival happen.","cta":{"href":"/kontakt-en","label":"Contact"}},
  {"type":"teamAbout","headline":"About","text":"Use this space to introduce the festival team and share background information about the festival."}
 ]$$::jsonb),
 ('sponsor-en',     '/sponsor-en',     'en-US','sponsor','Sponsors','Sponsors – Kurdish Film Festival Berlin','Our supporters and partners.','index,follow', TRUE, TRUE, 70, TRUE,
 $$[
  {"type":"sponsorHero","title":"Our Supporters","subtitle":"Sponsors & Partners"},
  {"type":"sponsors","headline":"Our Supporters","text":"Thank you for supporting our festival."}
 ]$$::jsonb),
 ('kontakt-en',     '/kontakt-en',     'en-US','contact','Contact','Contact – Kurdish Film Festival Berlin','Press, partnerships and questions.','index,follow', TRUE, TRUE, 60, TRUE,
 $$[{"type":"hero","headline":"Contact","subline":"Press, partnerships and general enquiries.","cta":{"href":"mailto:info@example.org","label":"Send email"}}]$$::jsonb),

-- =========================
-- KERNSEITEN (KU) – Platzhalter
-- =========================
('programm-ku',    '/programm-ku',    'ku','programm','Bername','Bername – Festîvala Fîlman a Kurdî ya Berlînê','Hemû pêşandan, panel û Q&A.','index,follow', TRUE, TRUE, 10, TRUE,
 $$[{"type":"hero","headline":"Bername","subline":"Hemû pêşandan, panel û Q&A.","cta":{"href":"/tickets-ku","label":"Bilêt"}}]$$::jsonb),
('news-ku',        '/news-ku',        'ku','news','Nûçe','Nûçe – Festîvala Fîlman a Kurdî ya Berlînê','Ragihandin û nûvekirin.','index,follow', TRUE, TRUE, 20, TRUE,
 $$[{"type":"hero","headline":"Nûçe","subline":"Ragihandin, nûvekirin û highlights.","cta":{"href":"/programm-ku","label":"Bername"}}]$$::jsonb),
('rahmenplan-ku',   '/rahmenplan-ku',   'ku','rahmenplan','Rahmenplan','Rahmenplan – Festîvala Fîlman a Kurdî ya Berlînê','Rahmenplan û awayê festîvalê.','index,follow', TRUE, TRUE, 25, TRUE,
 $$[{"type":"rahmenplan","headline":"Rahmenplan","shortText":"Li vir tu dikarî rahmenplanê bibînî.","longText":"Pelên planînê daxîne û li ser awayê festîvalê zêde agahdar bibe.","poster":{"src":"","alt":""},"downloads":[]}]$$::jsonb),
('tickets-ku',     '/tickets-ku',     'ku','tickets','Bilêt','Bilêt – Festîvala Fîlman a Kurdî ya Berlînê','Bilêtên sînemayê û online-pass.','index,follow', TRUE, TRUE, 30, TRUE,
 $$[{"type":"ticketsHero","defaultChoice":"online","tabs":[{"key":"online","label":"Online-pass"},{"key":"kino","label":"Bilêta Sînemayê"}],"online":{"tabLabel":"Online-pass","title":"Online-pass","text":"Gihîştinê bo hemû fîlm û vîdyoyên festîvalê bibîne. Tu dikarî li her der û her dem li ser online-mediatheke me bigihîjî.","buttonLabel":"Gihîştina online","buttonUrl":"/online-pass-ku","image":{"src":"/images/subscriber_image.png","alt":"Online-pass"}}, "kino":{"tabLabel":"Bilêta Sînemayê","title":"Bilêta Sînemayê","text":"Fîlm û vîdyoyên me li Kino Babylon Berlinê têne nîşandan. Tu dikarî bilêtên online bo sînemayê bikirî.","buttonLabel":"Bilêta sînemayê bikire","buttonUrl":"/tickets-ku","image":{"src":"/images/subscriber_image.png","alt":"Bilêta Sînemayê"}}},
   {"type":"ticketsSection","defaultChoice":"online","online":{"headline":"Tu dikarî 3 pakêtên mehî hilbijêrî","text":"Bi bilêta online tu dikarî li her der û her dem hemû fîlm û vîdyoyên festîvalê bibîne. Hilbijartinên 1-mehî, 3-mehî û 6-mehî hene. Nirx her gav bo tevahiya demê ye.","packages":[{"badge":"Nû","badgeColor":"#1e4730","badgeTextColor":"#eafdef","title":"1-Mehî Pass","price":"29 €","priceNote":"bo kesek","features":["1-mehî têgihîştina tev","24/7 vîdyoyên ava","Gihîştina online-mediatheke"],"note":"Cihên sinor","buttonLabel":"Bilêt hilbijêre","buttonUrl":"/online-pass-ku"},{"badge":"Herî hez","badgeColor":"#e0b15c","badgeTextColor":"#4a3500","title":"3-Mehî Pass","price":"49 €","priceNote":"bo kesek","features":["3-mehî têgihîştina tev","24/7 vîdyoyên ava","Gihîştina online-mediatheke"],"note":"Cihên sinor","buttonLabel":"Bilêt hilbijêre","buttonUrl":"/online-pass-ku"},{"badge":"Highlight","badgeColor":"#1a3a84","badgeTextColor":"#eaf3ff","title":"6-Mehî Pass","price":"59 €","priceNote":"bo kesek","features":["6-mehî têgihîştina tev","1 chuyîna sînemayê belaş","Gihîştina online-mediatheke"],"note":"Cihên sinor","buttonLabel":"Bilêt hilbijêre","buttonUrl":"/online-pass-ku"}],"listingHeadline":"Li vir hinek fîlmên me dibînî:","featured":{"title":"Bêwar: Kurdish Asylum Seekers in Tel Aviv","image":"/images/subscriber_image.png","meta":["2026","Ziman: English, Kurdî, Hebrî, Almanî","Rêjî: Veysi Dag","Çêkirin: Veysi Dag","Dirêjî: 43 dk"],"tag":"ONLINE","description":"Bêwar belgefîlmeke herimî ye ku jiyana penaberên kurd li Tel Avivê nîşan dide.","actions":[{"label":"Bilêta online bikire","url":"/online-pass-ku"},{"label":"Bo bilêta sînemayê","url":"/tickets-ku","variant":"secondary"}]},"scenesLabel":"Senen","scenes":[{"src":"/images/subscriber_image.png","alt":"Sena 1"},{"src":"/images/background.png","alt":"Sena 2"},{"src":"/images/subscriber_image.png","alt":"Sena 3"}],"videosHeadline":"Hemû vîdyo","videosLink":"/video-ku","videosLinkLabel":"Hemû bibîne","videos":[{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Belindana","image":"/images/background.png"},{"title":"Das ungenutzte Potential","image":"/images/subscriber_image.png"},{"title":"Der Dön...","image":"/images/background.png"}]}, "kino":{"headline":"Li vir hemû fîlmên ku niha li Kino Babylon Berlinê têne nîşandan dibînî:","text":"Tu dikarî nêrînêke kurt û sene yên destpêkê bibînî.","listingHeadline":"","featured":{"title":"Bêwar: Kurdish Asylum Seekers in Tel Aviv","image":"/images/subscriber_image.png","meta":["2026","Ziman: English, Kurdî, Hebrî, Almanî","Rêjî: Veysi Dag","Çêkirin: Veysi Dag","Dirêjî: 43 dk"],"tag":"KINO","description":"Bêwar belgefîlmeke herimî ye ku jiyana penaberên kurd li Tel Avivê nîşan dide.","actions":[{"label":"Bilêta sînemayê bikire","url":"/tickets-ku"},{"label":"Bo online-pass","url":"/online-pass-ku","variant":"secondary"}]},"scenesLabel":"Senen","scenes":[{"src":"/images/subscriber_image.png","alt":"Sena 1"},{"src":"/images/background.png","alt":"Sena 2"},{"src":"/images/subscriber_image.png","alt":"Sena 3"}],"nowPlayingHeadline":"Ev hefte li sînemayê","nowPlayingLink":"/programm-ku","nowPlayingLinkLabel":"Hemû bibîne","nowPlaying":[{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Belindana","image":"/images/background.png"},{"title":"Das ungenutzte Potential","image":"/images/subscriber_image.png"},{"title":"Der Dön...","image":"/images/background.png"}],"upcomingHeadline":"Ji 18.09.2026 li sînemayê","upcoming":[{"title":"Belindana","image":"/images/background.png"},{"title":"Tanzfest","image":"/images/subscriber_image.png"},{"title":"Der Dönerkönig","image":"/images/subscriber_image.png"},{"title":"Das ungenutzte Potential","image":"/images/background.png"}]}}
 ]$$::jsonb),
 ('online-pass-ku', '/online-pass-ku', 'ku','online-pass','Online-pass','Online-pass – Festîvala Fîlman a Kurdî ya Berlînê','Fîlmên hilbijartî online bibîne.','index,follow', TRUE, TRUE, 40, TRUE,
 $$[{"type":"hero","headline":"Online-pass","subline":"Fîlmên hilbijartî online bibîne.","cta":{"href":"/tickets-ku","label":"Bikire"}}]$$::jsonb),
('team-ku',        '/team-ku',        'ku','team','Tîm','Tîm – Festîvala Fîlman a Kurdî ya Berlînê','Kesên piştî festîvalê.','index,follow', TRUE, TRUE, 50, TRUE,
 $$[
  {"type":"hero","headline":"Tîm","subline":"Kesên ku festîvalê çêdikin.","cta":{"href":"/kontakt-ku","label":"Têkilî"}},
  {"type":"teamAbout","headline":"Derbarê","text":"Li vir tîma festîvalê nas bike û agahiyên giştî li ser festîvalê parve bike."}
 ]$$::jsonb),
 ('sponsor-ku',     '/sponsor-ku',     'ku','sponsor','Sponsor','Sponsor – Festîvala Fîlman a Kurdî ya Berlînê','Piştgir û hevkarên me.','index,follow', TRUE, TRUE, 70, TRUE,
 $$[
  {"type":"sponsorHero","title":"Piştgiranên Me","subtitle":"Sponsor û Hevkar"},
  {"type":"sponsors","headline":"Piştgiranên Me","text":"Spas ji bo piştgirî û destekê ya festîvala me."}
 ]$$::jsonb),
 ('kontakt-ku',     '/kontakt-ku',     'ku','contact','Têkilî','Têkilî – Festîvala Fîlman a Kurdî ya Berlînê','Pirs, hevkarî û ragihandin.','index,follow', TRUE, TRUE, 60, TRUE,
 $$[{"type":"hero","headline":"Têkilî","subline":"Pirs, hevkarî û ragihandin.","cta":{"href":"mailto:info@example.org","label":"E-mail"}}]$$::jsonb)
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
