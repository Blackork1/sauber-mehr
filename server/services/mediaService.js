export async function getMediaVideos(pool, language, options = {}) {
  const filters = [];
  const params = [];
  const localeJoin = language ? '$1' : 'media_videos.language';
  if (language) {
    params.push(language);
    filters.push(`media_videos.language = $${params.length}`);
  }
  if (!options.includeHidden) {
    filters.push('media_videos.display = TRUE');
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT media_videos.id,
            media_videos.media_group_id,
            media_videos.title,
            media_videos.description,
            media_videos.description_short,
            media_videos.category,
            media_videos.duration,
            media_videos.thumbnail_url,
            media_videos.video_url,
            media_videos.other_images,
            media_videos.regie,
            media_videos.regie_id,
            media_videos.production,
            media_videos.languages,
            media_videos.language,
            media_videos.display,
            media_videos.published_at,
            director_locales.name AS director_name,
            director_locales.slug AS director_slug
      FROM media_videos
     LEFT JOIN director_locales
       ON director_locales.director_id = media_videos.regie_id
       AND director_locales.locale = ${localeJoin}
     ${whereClause}
     ORDER BY published_at DESC`,
    params
  );

  return rows.map((row) => ({
    ...row,
    regie: row.director_name || row.regie,
    regie_slug: row.director_slug || null
  }));
}

export async function getMediaVideoGroups(pool) {
  const { rows } = await pool.query(
    `SELECT media_videos.id,
            media_videos.media_group_id,
            media_videos.title,
            media_videos.description,
            media_videos.description_short,
            media_videos.category,
            media_videos.duration,
            media_videos.thumbnail_url,
            media_videos.video_url,
            media_videos.other_images,
            media_videos.regie,
            media_videos.regie_id,
            media_videos.production,
            media_videos.languages,
            media_videos.language,
            media_videos.display,
            media_videos.published_at,
            director_locales.name AS director_name,
            director_locales.slug AS director_slug
      FROM media_videos
     LEFT JOIN director_locales
       ON director_locales.director_id = media_videos.regie_id
       AND director_locales.locale = media_videos.language
     ORDER BY published_at DESC, id DESC`
  );
  return rows.map((row) => ({
    ...row,
    regie: row.director_name || row.regie,
    regie_slug: row.director_slug || null
  }));
}

export async function getMediaVideosByGroupId(pool, mediaGroupId) {
  if (!mediaGroupId) return [];
  const { rows } = await pool.query(
    `SELECT media_videos.id,
            media_videos.media_group_id,
            media_videos.title,
            media_videos.description,
            media_videos.description_short,
            media_videos.category,
            media_videos.duration,
            media_videos.thumbnail_url,
            media_videos.video_url,
            media_videos.other_images,
            media_videos.regie,
            media_videos.regie_id,
            media_videos.production,
            media_videos.languages,
            media_videos.language,
            media_videos.display,
            media_videos.published_at,
            director_locales.name AS director_name,
            director_locales.slug AS director_slug
     FROM media_videos
     LEFT JOIN director_locales
       ON director_locales.director_id = media_videos.regie_id
       AND director_locales.locale = media_videos.language
     WHERE media_group_id = $1
     ORDER BY published_at DESC, id DESC`,
    [mediaGroupId]
  );
  return rows.map((row) => ({
    ...row,
    regie: row.director_name || row.regie,
    regie_slug: row.director_slug || null
  }));
}

export async function getMediaVideosByDirectorId(pool, directorId, language, options = {}) {
  if (!directorId) return [];
  const filters = ['media_videos.regie_id = $1'];
  const params = [directorId];
  const localeJoin = language ? `$${params.length + 1}` : 'media_videos.language';
  if (language) {
    params.push(language);
    filters.push(`media_videos.language = $${params.length}`);
  }
  if (!options.includeHidden) {
    params.push(true);
    filters.push(`media_videos.display = $${params.length}`);
  }
  const whereClause = `WHERE ${filters.join(' AND ')}`;

  const { rows } = await pool.query(
    `SELECT media_videos.id,
            media_videos.media_group_id,
            media_videos.title,
            media_videos.description,
            media_videos.description_short,
            media_videos.category,
            media_videos.duration,
            media_videos.thumbnail_url,
            media_videos.video_url,
            media_videos.other_images,
            media_videos.regie,
            media_videos.regie_id,
            media_videos.production,
            media_videos.languages,
            media_videos.language,
            media_videos.display,
            media_videos.published_at,
            director_locales.name AS director_name,
            director_locales.slug AS director_slug
     FROM media_videos
     LEFT JOIN director_locales
       ON director_locales.director_id = media_videos.regie_id
       AND director_locales.locale = ${localeJoin}
     ${whereClause}
     ORDER BY published_at DESC`,
    params
  );

  return rows.map((row) => ({
    ...row,
    regie: row.director_name || row.regie,
    regie_slug: row.director_slug || null
  }));
}

export async function getNextMediaVideoGroupId(pool) {
  const { rows } = await pool.query("SELECT nextval('media_video_group_id_seq') AS id");
  return rows[0]?.id || null;
}

export async function createMediaVideo(pool, data) {
  const { rows } = await pool.query(
    `INSERT INTO media_videos (
      media_group_id,
      title,
      description,
      description_short,
      category,
      duration,
      thumbnail_url,
      video_url,
      other_images,
      regie,
      regie_id,
      production,
      languages,
      language,
      display
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
    [
      data.mediaGroupId,
      data.title,
      data.description,
      data.descriptionShort,
      data.category,
      data.duration,
      data.thumbnailUrl,
      data.videoUrl,
      JSON.stringify(data.otherImages || []),
      data.regie,
      data.regieId || null,
      data.production,
      data.languages || [],
      data.language,
      data.display
    ]
  );
  return rows[0] || null;
}

export async function updateMediaVideo(pool, id, data) {
  const { rows } = await pool.query(
    `UPDATE media_videos
     SET title = $1,
         description = $2,
         description_short = $3,
         category = $4,
         duration = $5,
         thumbnail_url = $6,
         video_url = $7,
         other_images = $8,
         regie = $9,
         regie_id = $10,
         production = $11,
         languages = $12,
         language = $13,
         display = $14,
         media_group_id = $15
     WHERE id = $16
     RETURNING id`,
    [
      data.title,
      data.description,
      data.descriptionShort,
      data.category,
      data.duration,
      data.thumbnailUrl,
      data.videoUrl,
      JSON.stringify(data.otherImages || []),
      data.regie,
      data.regieId || null,
      data.production,
      data.languages || [],
      data.language,
      data.display,
      data.mediaGroupId,
      id
    ]
  );
  return rows[0] || null;
}

export async function updateMediaVideoVisibility(pool, mediaGroupId, languages = [], display) {
  if (!mediaGroupId || !languages.length) return null;
  const { rows } = await pool.query(
    `UPDATE media_videos
     SET display = $1
     WHERE media_group_id = $2
     AND language = ANY($3::text[])
     RETURNING id`,
    [display, mediaGroupId, languages]
  );
  return rows;
}

export async function deleteMediaVideosByGroup(pool, mediaGroupId, languages = []) {
  if (!mediaGroupId || !languages.length) return null;
  const { rows } = await pool.query(
    `DELETE FROM media_videos
     WHERE media_group_id = $1
     AND language = ANY($2::text[])
     RETURNING id`,
    [mediaGroupId, languages]
  );
  return rows;
}

export async function getMediaTicketGroups(pool) {
  const { rows } = await pool.query(
    `SELECT id,
            COALESCE(media_group_id, id) AS media_group_id,
            slug,
            ticket_type,
            title,
            ticket_text,
            badge_text,
            badge_bg_color,
            badge_text_color,
            hint_text,
            button_label,
            button_url,
            event_price,
            active,
            sort_order,
            language
     FROM media_tickets
     ORDER BY sort_order ASC, id ASC`
  );
  return rows;
}

export async function getMediaTicketsByGroupId(pool, mediaGroupId) {
  if (!mediaGroupId) return [];
  const { rows: tickets } = await pool.query(
    `SELECT id,
            COALESCE(media_group_id, id) AS media_group_id,
            slug,
            ticket_type,
            title,
            ticket_text,
            badge_text,
            badge_bg_color,
            badge_text_color,
            hint_text,
            button_label,
            button_url,
            event_price,
            active,
            sort_order,
            language
     FROM media_tickets
     WHERE COALESCE(media_group_id, id) = $1
     ORDER BY sort_order ASC, id ASC`,
    [mediaGroupId]
  );

  const ticketIds = tickets.map((ticket) => ticket.id).filter(Boolean);
  if (!ticketIds.length) return [];

  const [{ rows: features }, { rows: phases }] = await Promise.all([
    pool.query(
      `SELECT id,
              ticket_id,
              feature_text,
              sort_order
       FROM media_ticket_features
       WHERE ticket_id = ANY($1::int[])
       ORDER BY sort_order ASC, id ASC`,
      [ticketIds]
    ),
    pool.query(
      `SELECT id,
              ticket_id,
              phase,
              start_at,
              end_at,
              current_price,
              price_note
       FROM media_ticket_price_phases
       WHERE ticket_id = ANY($1::int[])
       ORDER BY start_at ASC NULLS LAST, id ASC`,
      [ticketIds]
    )
  ]);

  const featuresByTicket = features.reduce((acc, feature) => {
    if (!acc[feature.ticket_id]) acc[feature.ticket_id] = [];
    acc[feature.ticket_id].push(feature);
    return acc;
  }, {});

  const phasesByTicket = phases.reduce((acc, phase) => {
    if (!acc[phase.ticket_id]) acc[phase.ticket_id] = [];
    acc[phase.ticket_id].push(phase);
    return acc;
  }, {});

  return tickets.map((ticket) => ({
    ...ticket,
    features: featuresByTicket[ticket.id] || [],
    phases: phasesByTicket[ticket.id] || []
  }));
}

export async function getNextMediaTicketGroupId(pool) {
  const { rows } = await pool.query("SELECT nextval('media_ticket_group_id_seq') AS id");
  return rows[0]?.id || null;
}

export async function createMediaTicket(pool, data) {
  const { rows } = await pool.query(
    `INSERT INTO media_tickets (
      media_group_id,
      slug,
      ticket_type,
      title,
      ticket_text,
      badge_text,
      badge_bg_color,
      badge_text_color,
      hint_text,
      button_label,
      button_url,
      event_price,
      active,
      sort_order,
      language
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
    [
      data.mediaGroupId,
      data.slug,
      data.ticketType,
      data.title,
      data.ticketText,
      data.badgeText,
      data.badgeBgColor,
      data.badgeTextColor,
      data.hintText,
      data.buttonLabel,
      data.buttonUrl,
      data.eventPrice,
      data.active,
      data.sortOrder,
      data.language
    ]
  );
  return rows[0] || null;
}

export async function updateMediaTicket(pool, id, data) {
  const { rows } = await pool.query(
    `UPDATE media_tickets
     SET slug = $1,
         ticket_type = $2,
         title = $3,
         ticket_text = $4,
         badge_text = $5,
         badge_bg_color = $6,
         badge_text_color = $7,
         hint_text = $8,
         button_label = $9,
         button_url = $10,
         event_price = $11,
         active = $12,
         sort_order = $13,
         language = $14,
         media_group_id = $15
     WHERE id = $16
     RETURNING id`,
    [
      data.slug,
      data.ticketType,
      data.title,
      data.ticketText,
      data.badgeText,
      data.badgeBgColor,
      data.badgeTextColor,
      data.hintText,
      data.buttonLabel,
      data.buttonUrl,
      data.eventPrice,
      data.active,
      data.sortOrder,
      data.language,
      data.mediaGroupId,
      id
    ]
  );
  return rows[0] || null;
}

export async function updateMediaTicketVisibility(pool, mediaGroupId, languages = [], active) {
  if (!mediaGroupId || !languages.length) return null;
  const { rows } = await pool.query(
    `UPDATE media_tickets
     SET active = $1
     WHERE COALESCE(media_group_id, id) = $2
     AND language = ANY($3::text[])
     RETURNING id`,
    [active, mediaGroupId, languages]
  );
  return rows;
}

export async function deleteMediaTicketsByGroup(pool, mediaGroupId, languages = []) {
  if (!mediaGroupId || !languages.length) return null;
  const { rows } = await pool.query(
    `DELETE FROM media_tickets
     WHERE COALESCE(media_group_id, id) = $1
     AND language = ANY($2::text[])
     RETURNING id`,
    [mediaGroupId, languages]
  );
  return rows;
}

export async function getMediaTickets(pool, language) {
  const params = [];
  let ticketFilter = 'WHERE active = true';
  if (language) {
    params.push(language);
    ticketFilter += ` AND language = $${params.length}`;
  }

  const featureParams = [];
  let featureFilter = '';
  if (language) {
    featureParams.push(language);
    featureFilter = `WHERE ticket_id IN (SELECT id FROM media_tickets WHERE active = true AND language = $1)`;
  }

  const phaseParams = [];
  let phaseFilter = '';
  if (language) {
    phaseParams.push(language);
    phaseFilter = `WHERE ticket_id IN (SELECT id FROM media_tickets WHERE active = true AND language = $1)`;
  }

  const [{ rows: tickets }, { rows: features }, { rows: phases }] = await Promise.all([
    pool.query(
      `SELECT id,
              slug,
              ticket_type,
              title,
              ticket_text,
              badge_text,
              badge_bg_color,
              badge_text_color,
              hint_text,
              button_label,
              button_url,
              event_price,
              sort_order,
              language
       FROM media_tickets
       ${ticketFilter}
       ORDER BY sort_order ASC, id ASC`,
      params
    ),
    pool.query(
      `SELECT id,
              ticket_id,
              feature_text,
              sort_order
       FROM media_ticket_features
       ${featureFilter}
       ORDER BY sort_order ASC, id ASC`,
      featureParams
    ),
    pool.query(
      `SELECT id,
              ticket_id,
              phase,
              start_at,
              end_at,
              current_price,
              price_note
       FROM media_ticket_price_phases
       ${phaseFilter}
       ORDER BY start_at ASC NULLS LAST, id ASC`,
      phaseParams
    )
  ]);

  const featuresByTicket = features.reduce((acc, feature) => {
    if (!acc[feature.ticket_id]) acc[feature.ticket_id] = [];
    acc[feature.ticket_id].push(feature);
    return acc;
  }, {});

  const phasesByTicket = phases.reduce((acc, phase) => {
    if (!acc[phase.ticket_id]) acc[phase.ticket_id] = [];
    acc[phase.ticket_id].push(phase);
    return acc;
  }, {});

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const resolvePhase = (phaseList = []) => {
    if (!phaseList.length) return null;
    const active = phaseList.find((phase) => {
      const start = phase.start_at ? new Date(phase.start_at) : null;
      const end = phase.end_at ? new Date(phase.end_at) : null;
      if (start && today < start) return false;
      if (end && today > end) return false;
      return true;
    });
    return active || phaseList[phaseList.length - 1];
  };

  return tickets.map((ticket) => {
    const ticketFeatures = featuresByTicket[ticket.id] || [];
    const ticketPhases = phasesByTicket[ticket.id] || [];
    const activePhase = resolvePhase(ticketPhases);
    return {
      ...ticket,
      features: ticketFeatures,
      pricing: activePhase
    };
  });
}

export async function getMediaTicketById(pool, id) {
  if (!id) return null;
  const { rows } = await pool.query(
    `SELECT id,
            slug,
            ticket_type,
            title,
            ticket_text,
            badge_text,
            badge_bg_color,
            badge_text_color,
            hint_text,
            button_label,
            button_url,
            event_price,
            sort_order,
            language
     FROM media_tickets
     WHERE id = $1`,
    [id]
  );

  if (!rows[0]) return null;
  const ticket = rows[0];

  const { rows: phases } = await pool.query(
    `SELECT id,
            ticket_id,
            phase,
            start_at,
            end_at,
            current_price,
            price_note
     FROM media_ticket_price_phases
     WHERE ticket_id = $1
     ORDER BY start_at ASC NULLS LAST, id ASC`,
    [ticket.id]
  );

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const active = phases.find((phase) => {
    const start = phase.start_at ? new Date(phase.start_at) : null;
    const end = phase.end_at ? new Date(phase.end_at) : null;
    if (start && today < start) return false;
    if (end && today > end) return false;
    return true;
  }) || phases[phases.length - 1];

  return {
    ...ticket,
    pricing: active || null
  };
}

export async function getPrimaryTicketByType(pool, ticketType, language) {
  const params = [ticketType];
  let filter = 'WHERE active = true AND ticket_type = $1';
  if (language) {
    params.push(language);
    filter += ` AND language = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT id,
            slug,
            ticket_type,
            title,
            event_price,
            language
     FROM media_tickets
     ${filter}
     ORDER BY sort_order ASC, id ASC
     LIMIT 1`,
    params
  );
  if (!rows[0]) return null;
  return getMediaTicketById(pool, rows[0].id);
}

export async function getNewsArticles(pool, language, options = {}) {
  const filters = [];
  const params = [];
  if (language) {
    params.push(language);
    filters.push(`language = $${params.length}`);
  }
  if (!options.includeHidden) {
    filters.push('display = TRUE');
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const { rows } = await pool.query(
    `SELECT id,
            news_group_id,
            title,
            h1_title,
            meta_description,
            description_short,
            description_long,
            title_image_url,
            title_media_type,
            h2_title,
            article_text,
            body_title,
            gallery,
            language,
            slug,
            display,
            published_at,
            created_at
     FROM news_articles
     ${whereClause}
     ORDER BY published_at DESC`,
    params
  );

  return rows;
}

export async function getAllMediaTickets(pool, language) {
  const params = [];
  let ticketFilter = '';
  if (language) {
    params.push(language);
    ticketFilter = `WHERE language = $${params.length}`;
  }

  const { rows: tickets } = await pool.query(
    `SELECT id,
            media_group_id,
            slug,
            ticket_type,
            title,
            ticket_text,
            badge_text,
            badge_bg_color,
            badge_text_color,
            hint_text,
            button_label,
            button_url,
            event_price,
            active,
            sort_order,
            language
     FROM media_tickets
     ${ticketFilter}
     ORDER BY sort_order ASC, id ASC`,
    params
  );

  return tickets;
}


export async function getNewsArticleById(pool, id) {
  const { rows } = await pool.query(
    `SELECT id,
            news_group_id,
            title,
            h1_title,
            meta_description,
            description_short,
            description_long,
            title_image_url,
            title_media_type,
            h2_title,
            article_text,
            body_title,
            gallery,
            language,
            slug,
            display,
            published_at,
            created_at
     FROM news_articles
     WHERE id = $1`,
    [id]
  );

  return rows[0] || null;
}

export async function getNewsArticleBySlug(pool, slug, options = {}) {
  if (!slug) return null;
  const filters = ['slug = $1'];
  if (!options.includeHidden) {
    filters.push('display = TRUE');
  }
  const { rows } = await pool.query(
    `SELECT id,
            news_group_id,
            title,
            h1_title,
            meta_description,
            description_short,
            description_long,
            title_image_url,
            title_media_type,
            h2_title,
            article_text,
            body_title,
            gallery,
            language,
            slug,
            display,
            published_at,
            created_at
     FROM news_articles
     WHERE ${filters.join(' AND ')}`,
    [slug]
  );

  return rows[0] || null;
}

export async function getNewsArticleGroups(pool) {
  const { rows } = await pool.query(
    `SELECT id,
            news_group_id,
            title,
            h1_title,
            meta_description,
            description_short,
            description_long,
            title_image_url,
            title_media_type,
            h2_title,
            article_text,
            body_title,
            gallery,
            language,
            slug,
            display,
            published_at,
            created_at
     FROM news_articles
     ORDER BY published_at DESC, id DESC`
  );
  return rows;
}

export async function getNewsArticlesByGroupId(pool, newsGroupId) {
  if (!newsGroupId) return [];
  const { rows } = await pool.query(
    `SELECT id,
            news_group_id,
            title,
            h1_title,
            meta_description,
            description_short,
            description_long,
            title_image_url,
            title_media_type,
            h2_title,
            article_text,
            body_title,
            gallery,
            language,
            slug,
            display,
            published_at,
            created_at
     FROM news_articles
     WHERE news_group_id = $1
     ORDER BY published_at DESC, id DESC`,
    [newsGroupId]
  );
  return rows;
}

export async function getNextNewsGroupId(pool) {
  const { rows } = await pool.query("SELECT nextval('news_group_id_seq') AS id");
  return rows[0]?.id || null;
}

export async function createNewsArticle(pool, data) {
  const { rows } = await pool.query(
    `INSERT INTO news_articles (
      news_group_id,
      title,
      h1_title,
      meta_description,
      description_short,
      description_long,
      title_image_url,
      title_media_type,
      h2_title,
      article_text,
      body_title,
      gallery,
      language,
      slug,
      display
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    RETURNING id`,
    [
      data.newsGroupId,
      data.title,
      data.h1Title,
      data.metaDescription,
      data.descriptionShort,
      data.descriptionLong,
      data.titleImageUrl,
      data.titleMediaType,
      data.h2Title,
      data.articleText,
      data.bodyTitle,
      JSON.stringify(data.gallery || []),
      data.language,
      data.slug,
      data.display
    ]
  );

  return rows[0] || null;
}

export async function updateNewsArticle(pool, id, data) {
  const { rows } = await pool.query(
    `UPDATE news_articles
     SET title = $1,
         h1_title = $2,
         meta_description = $3,
         description_short = $4,
         description_long = $5,
         title_image_url = $6,
         title_media_type = $7,
         h2_title = $8,
         article_text = $9,
         body_title = $10,
         gallery = $11,
         language = $12,
         slug = $13,
         display = $14,
         news_group_id = $15
     WHERE id = $16
     RETURNING id`,
    [
      data.title,
      data.h1Title,
      data.metaDescription,
      data.descriptionShort,
      data.descriptionLong,
      data.titleImageUrl,
      data.titleMediaType,
      data.h2Title,
      data.articleText,
      data.bodyTitle,
      JSON.stringify(data.gallery || []),
      data.language,
      data.slug,
      data.display,
      data.newsGroupId,
      id
    ]
  );

  return rows[0] || null;
}

export async function updateNewsArticleVisibility(pool, newsGroupId, languages = [], display) {
  if (!newsGroupId || !languages.length) return null;
  const { rows } = await pool.query(
    `UPDATE news_articles
     SET display = $1
     WHERE news_group_id = $2
     AND language = ANY($3::text[])
     RETURNING id`,
    [display, newsGroupId, languages]
  );
  return rows;
}

export async function deleteNewsArticlesByGroup(pool, newsGroupId, languages = []) {
  if (!newsGroupId || !languages.length) return null;
  const { rows } = await pool.query(
    `DELETE FROM news_articles
     WHERE news_group_id = $1
     AND language = ANY($2::text[])
     RETURNING id`,
    [newsGroupId, languages]
  );
  return rows;
}