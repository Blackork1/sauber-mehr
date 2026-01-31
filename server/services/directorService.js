export async function getDirectorsWithLocales(pool) {
  const { rows } = await pool.query(
    `SELECT directors.id,
            director_locales.locale,
            director_locales.name,
            director_locales.slug,
            director_locales.meta_description,
            director_locales.description,
            director_locales.background_image_url,
            director_locales.portrait_image_url,
            director_locales.display,
            directors.created_at
     FROM directors
     LEFT JOIN director_locales
       ON director_locales.director_id = directors.id
     ORDER BY directors.id DESC, director_locales.locale ASC`
  );

  const directors = new Map();
  rows.forEach((row) => {
    if (!directors.has(row.id)) {
      directors.set(row.id, {
        id: row.id,
        created_at: row.created_at,
        locales: {}
      });
    }
    if (row.locale) {
      directors.get(row.id).locales[row.locale] = {
        name: row.name,
        slug: row.slug,
        meta_description: row.meta_description,
        description: row.description,
        background_image_url: row.background_image_url,
        portrait_image_url: row.portrait_image_url,
        display: row.display
      };
    }
  });

  return Array.from(directors.values());
}

export async function getDirectorBySlug(pool, { slug, locale, includeHidden = false } = {}) {
  if (!slug || !locale) return null;
  const params = [slug, locale];
  const filters = [
    'director_locales.slug = $1',
    'director_locales.locale = $2'
  ];
  if (!includeHidden) {
    params.push(true);
    filters.push(`director_locales.display = $${params.length}`);
  }
  const whereClause = `WHERE ${filters.join(' AND ')}`;

  const { rows } = await pool.query(
    `SELECT directors.id,
            director_locales.locale,
            director_locales.name,
            director_locales.slug,
            director_locales.meta_description,
            director_locales.description,
            director_locales.background_image_url,
            director_locales.portrait_image_url,
            director_locales.display
     FROM directors
     JOIN director_locales
       ON director_locales.director_id = directors.id
     ${whereClause}
     LIMIT 1`,
    params
  );

  return rows[0] || null;
}

export async function getDirectorLocalesByDirectorId(pool, directorId) {
  if (!directorId) return [];
  const { rows } = await pool.query(
    `SELECT director_id,
            locale,
            name,
            slug,
            meta_description,
            description,
            background_image_url,
            portrait_image_url,
            display
     FROM director_locales
     WHERE director_id = $1
     ORDER BY locale ASC`,
    [directorId]
  );
  return rows;
}

export async function getDirectorOptions(pool) {
  const { rows } = await pool.query(
    `SELECT director_id,
            locale,
            name
     FROM director_locales
     ORDER BY name ASC`
  );
  return rows;
}

export async function createDirector(pool, { locales = [] } = {}) {
  const { rows } = await pool.query(
    'INSERT INTO directors DEFAULT VALUES RETURNING id'
  );
  const director = rows[0] || null;
  if (director?.id && Array.isArray(locales)) {
    for (const localeData of locales) {
      await upsertDirectorLocale(pool, director.id, localeData);
    }
  }
  return director;
}

export async function upsertDirectorLocale(pool, directorId, data) {
  await pool.query(
    `INSERT INTO director_locales (
      director_id,
      locale,
      name,
      slug,
      meta_description,
      description,
      background_image_url,
      portrait_image_url,
      display
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    ON CONFLICT (director_id, locale)
    DO UPDATE SET name = EXCLUDED.name,
                  slug = EXCLUDED.slug,
                  meta_description = EXCLUDED.meta_description,
                  description = EXCLUDED.description,
                  background_image_url = EXCLUDED.background_image_url,
                  portrait_image_url = EXCLUDED.portrait_image_url,
                  display = EXCLUDED.display`,
    [
      directorId,
      data.locale,
      data.name,
      data.slug,
      data.metaDescription || null,
      data.description || null,
      data.backgroundImageUrl || null,
      data.portraitImageUrl || null,
      data.display !== false
    ]
  );
}

export async function deleteDirector(pool, directorId) {
  await pool.query('DELETE FROM directors WHERE id = $1', [directorId]);
}