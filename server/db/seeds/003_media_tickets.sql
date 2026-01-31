-- Seed data for tickets section

INSERT INTO media_tickets (slug, ticket_type, title, ticket_text, badge_text, badge_bg_color, badge_text_color, hint_text, button_label, button_url, event_price, active, sort_order, language)
VALUES
  (
    'kino-ticket',
    'kino',
    'Kino-Ticket',
    'Eintritt für eine Vorstellung im Kino Babylon Berlin.',
    'Beliebt',
    '#fbe7b3',
    '#7a4f00',
    'Begrenzte Plätze',
    'Ticket wählen',
    '/tickets/kino',
    49.00,
    true,
    1,
    'de'
  ),
  (
    'online-ticket',
    'online',
    'Online-Ticket',
    'Onlinezugang zu allen Festival-Videos, flexibel von überall.',
    'Neu',
    '#c4ecd6',
    '#2e7d5b',
    'Begrenzte Plätze',
    'Ticket wählen',
    '/tickets/online',
    89.00,
    true,
    2,
    'de'
  ),
  (
    'combo-ticket',
    'combo',
    'Kombi-Ticket',
    'Kinoeintritt plus Onlinezugang in einem Paket.',
    'Begrenztes Angebot',
    '#e0ecff',
    '#2251c2',
    'Begrenzte Plätze',
    'Ticket wählen',
    '/tickets/kombi',
    150.00,
    true,
    3,
    'de'
  ),
  (
    'online-pass',
    'pass',
    '1-Monats Online-Pass',
    'Zugriff auf alle Filme für einen Monat.',
    'Pass',
    '#fbe4e4',
    '#d13e3e',
    'Nur für kurze Zeit',
    'Pass wählen',
    '/tickets/pass',
    39.00,
    true,
    4
    'de'
  )
ON CONFLICT (slug) DO UPDATE SET
  ticket_type = EXCLUDED.ticket_type,
  title = EXCLUDED.title,
  ticket_text = EXCLUDED.ticket_text,
  badge_text = EXCLUDED.badge_text,
  badge_bg_color = EXCLUDED.badge_bg_color,
  badge_text_color = EXCLUDED.badge_text_color,
  hint_text = EXCLUDED.hint_text,
  button_label = EXCLUDED.button_label,
  button_url = EXCLUDED.button_url,
  event_price = EXCLUDED.event_price,
  active = EXCLUDED.active,
  sort_order = EXCLUDED.sort_order,
  language = EXCLUDED.language,
  updated_at = now();

DELETE FROM media_ticket_features
WHERE ticket_id IN (SELECT id FROM media_tickets WHERE slug IN ('kino-ticket', 'online-ticket', 'combo-ticket', 'online-pass'));

INSERT INTO media_ticket_features (ticket_id, feature_text, sort_order)
VALUES
  ((SELECT id FROM media_tickets WHERE slug = 'kino-ticket'), 'Einlass an beiden Tagen', 1),
  ((SELECT id FROM media_tickets WHERE slug = 'kino-ticket'), 'Zugang zu allen Konzerten', 2),
  ((SELECT id FROM media_tickets WHERE slug = 'kino-ticket'), '1 kostenloses Begrüßungsgetränk', 3),
  ((SELECT id FROM media_tickets WHERE slug = 'online-ticket'), 'Zugriff auf 300+ Videos', 1),
  ((SELECT id FROM media_tickets WHERE slug = 'online-ticket'), '24/7 abrufbar', 2),
  ((SELECT id FROM media_tickets WHERE slug = 'online-ticket'), 'Zugang zur Online-Mediathek', 3),
  ((SELECT id FROM media_tickets WHERE slug = 'combo-ticket'), 'Beste aus beiden Welten', 1),
  ((SELECT id FROM media_tickets WHERE slug = 'combo-ticket'), 'Zugang zu allen Konzerten', 2),
  ((SELECT id FROM media_tickets WHERE slug = 'combo-ticket'), 'Zugang zur Online-Mediathek', 3),
  ((SELECT id FROM media_tickets WHERE slug = 'online-pass'), 'Alle Festival-Videos für 30 Tage', 1),
  ((SELECT id FROM media_tickets WHERE slug = 'online-pass'), 'Keine Vertragsbindung', 2),
  ((SELECT id FROM media_tickets WHERE slug = 'online-pass'), 'Sofortiger Zugriff', 3);

DELETE FROM media_ticket_price_phases
WHERE ticket_id IN (SELECT id FROM media_tickets WHERE slug IN ('kino-ticket', 'online-ticket', 'combo-ticket', 'online-pass'));

INSERT INTO media_ticket_price_phases (ticket_id, phase, start_at, end_at, current_price, price_note)
VALUES
  ((SELECT id FROM media_tickets WHERE slug = 'kino-ticket'), 'early', '2025-01-01', '2026-04-01', 34.30, 'bis zum 01.04.2026'),
  ((SELECT id FROM media_tickets WHERE slug = 'kino-ticket'), 'normal', '2026-04-02', '2026-06-30', 39.20, 'bis Eventstart'),
  ((SELECT id FROM media_tickets WHERE slug = 'kino-ticket'), 'event', '2026-07-01', NULL, 49.00, 'pro Person'),
  ((SELECT id FROM media_tickets WHERE slug = 'online-ticket'), 'early', '2025-01-01', '2026-04-01', 62.30, 'bis zum 01.04.2026'),
  ((SELECT id FROM media_tickets WHERE slug = 'online-ticket'), 'normal', '2026-04-02', '2026-06-30', 71.20, 'bis Eventstart'),
  ((SELECT id FROM media_tickets WHERE slug = 'online-ticket'), 'event', '2026-07-01', NULL, 89.00, 'pro Person'),
  ((SELECT id FROM media_tickets WHERE slug = 'combo-ticket'), 'early', '2025-01-01', '2026-04-01', 105.00, 'bis zum 01.04.2026'),
  ((SELECT id FROM media_tickets WHERE slug = 'combo-ticket'), 'normal', '2026-04-02', '2026-06-30', 120.00, 'bis Eventstart'),
  ((SELECT id FROM media_tickets WHERE slug = 'combo-ticket'), 'event', '2026-07-01', NULL, 150.00, 'pro Person'),
  ((SELECT id FROM media_tickets WHERE slug = 'online-pass'), 'early', '2025-01-01', '2026-04-01', 27.30, 'bis zum 01.04.2026'),
  ((SELECT id FROM media_tickets WHERE slug = 'online-pass'), 'normal', '2026-04-02', '2026-06-30', 31.20, 'bis Eventstart'),
  ((SELECT id FROM media_tickets WHERE slug = 'online-pass'), 'event', '2026-07-01', NULL, 39.00, 'pro Person');