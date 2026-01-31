export async function getTicketPageSettings(pool, locale) {
  const { rows } = await pool.query(
    `SELECT locale,
            section,
            hero_image_src,
            hero_image_alt,
            featured_mode,
            featured_video_id,
            video_ids,
            now_playing_ids,
            upcoming_ids,
            upcoming_date
     FROM ticket_page_settings
     WHERE locale = $1`,
    [locale]
  );

  const settings = rows.reduce(
    (acc, row) => {
      acc[row.section] = {
        heroImageSrc: row.hero_image_src || '',
        heroImageAlt: row.hero_image_alt || '',
        featuredMode: row.featured_mode === 'manual' ? 'manual' : 'random',
        featuredVideoId: row.featured_video_id || null,
        videoIds: Array.isArray(row.video_ids) ? row.video_ids : [],
        nowPlayingIds: Array.isArray(row.now_playing_ids) ? row.now_playing_ids : [],
        upcomingIds: Array.isArray(row.upcoming_ids) ? row.upcoming_ids : [],
        upcomingDate: row.upcoming_date || ''
      };
      return acc;
    },
    { kino: null, online: null }
  );

  return {
    kino: settings.kino || {
      heroImageSrc: '',
      heroImageAlt: '',
      featuredMode: 'random',
      featuredVideoId: null,
      videoIds: [],
      nowPlayingIds: [],
      upcomingIds: [],
      upcomingDate: ''
    },
    online: settings.online || {
      heroImageSrc: '',
      heroImageAlt: '',
      featuredMode: 'random',
      featuredVideoId: null,
      videoIds: [],
      nowPlayingIds: [],
      upcomingIds: [],
      upcomingDate: ''
    }
  };
}

export async function getTicketVisibility(pool, locale) {
  const { rows } = await pool.query(
    `SELECT ticket_id, show_online, show_kino
     FROM ticket_page_ticket_visibility
     WHERE locale = $1`,
    [locale]
  );

  return rows.reduce((acc, row) => {
    acc[row.ticket_id] = {
      showOnline: row.show_online,
      showKino: row.show_kino
    };
    return acc;
  }, {});
}

export async function upsertTicketPageSettings(pool, locale, section, data) {
  await pool.query(
    `INSERT INTO ticket_page_settings (
        locale,
        section,
        hero_image_src,
        hero_image_alt,
        featured_mode,
        featured_video_id,
        video_ids,
        now_playing_ids,
        upcoming_ids,
        upcoming_date
      )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     ON CONFLICT (locale, section)
     DO UPDATE SET
        hero_image_src = EXCLUDED.hero_image_src,
        hero_image_alt = EXCLUDED.hero_image_alt,
        featured_mode = EXCLUDED.featured_mode,
        featured_video_id = EXCLUDED.featured_video_id,
        video_ids = EXCLUDED.video_ids,
        now_playing_ids = EXCLUDED.now_playing_ids,
        upcoming_ids = EXCLUDED.upcoming_ids,
        upcoming_date = EXCLUDED.upcoming_date`,
    [
      locale,
      section,
      data.heroImageSrc || '',
      data.heroImageAlt || '',
      data.featuredMode === 'manual' ? 'manual' : 'random',
      data.featuredVideoId || null,
      data.videoIds || [],
      data.nowPlayingIds || [],
      data.upcomingIds || [],
      data.upcomingDate || ''
    ]
  );
}

export async function upsertTicketVisibility(pool, locale, ticketId, data) {
  await pool.query(
    `INSERT INTO ticket_page_ticket_visibility (locale, ticket_id, show_online, show_kino)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (locale, ticket_id)
     DO UPDATE SET
        show_online = EXCLUDED.show_online,
        show_kino = EXCLUDED.show_kino`,
    [
      locale,
      ticketId,
      data.showOnline,
      data.showKino
    ]
  );
}