INSERT INTO news_articles (
  title,
  meta_description,
  description_short,
  description_long,
  title_image_url,
  h2_title,
  article_text,
  gallery,
  language,
  published_at,
  news_group_id,
  slug,
  display
  )
VALUES
  (
    'Festivaleröffnung mit Live-Orchester',
    'Die feierliche Eröffnung des Kurdischen Filmfestivals mit Live-Musik.',
    'Ein stimmungsvoller Auftakt mit Live-Orchester und Gästen aus ganz Europa.',
    'Am ersten Abend eröffnen wir das Festival mit einem besonderen Konzertprogramm und ausgewählten Filmpremieren.',
    'https://kurdisches-filmfestival.de/images/news/opening.jpg',
    'Eröffnungsabend im Kino Babylon',
    'Freue dich auf ein Live-Orchester, Filmpremieren und eine kuratierte Auswahl an Beiträgen, die das Festival einläuten.',
    '[{"type":"image","url":"https://kurdisches-filmfestival.de/images/news/opening-1.jpg","alt":"Orchester im Saal"},{"type":"video","url":"https://kurdisches-filmfestival.de/videos/opening-teaser.mp4"}]'::jsonb,
    'de',
    now() - interval '3 days',
    1,
    '/news-de/festivaleroeffnung-mit-live-orchester',
    TRUE
  ),
  (
    'Workshops & Panels angekündigt',
    'Neue Workshops zu Regie, Drehbuch und Produktion.',
    'Unsere Workshop-Reihe bietet praxisnahe Einblicke in die Filmproduktion.',
    'Lerne von erfahrenen Filmschaffenden in intensiven Sessions und Diskussionsrunden.',
    'https://kurdisches-filmfestival.de/images/news/workshops.jpg',
    'Hands-on Wissen für Filmschaffende',
    'Von der Idee bis zur Premiere: Wir begleiten dich durch die wichtigsten Stationen der Filmproduktion.',
    '[{"type":"image","url":"https://kurdisches-filmfestival.de/images/news/workshops-1.jpg","alt":"Workshop-Situation"}]'::jsonb,
    'de',
    now() - interval '5 days',
    2,
    '/news-de/workshops-panels-angekuendigt',
    TRUE
  ),
  (
    'Rückblick auf den Publikumspreis',
    'Das Publikum kürt die Gewinnerinnen und Gewinner.',
    'Ein bewegender Abschluss mit vielen Stimmen aus dem Publikum.',
    'Wir fassen die Highlights des Publikumspreises zusammen und danken allen Beteiligten.',
    'https://kurdisches-filmfestival.de/images/news/award.jpg',
    'Die Gewinnerfilme 2024',
    'Das Publikum wählte seine Favoriten – hier sind die prämierten Filme und Stimmen der Jury.',
    '[{"type":"image","url":"https://kurdisches-filmfestival.de/images/news/award-1.jpg","alt":"Preisverleihung"}]'::jsonb,
    'de',
    now() - interval '12 days',
    3,
    '/news-de/rueckblick-auf-den-publikumspreis',
    TRUE
  )
ON CONFLICT DO NOTHING;