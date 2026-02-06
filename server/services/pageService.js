/**
 * DB abstraction for "pages" (DB-first rendering).
 */
export async function getPageBySlug(pool, slug) {
  const { rows } = await pool.query(
    `SELECT id, slug, canonical_path, locale, i18n_group, title, meta_title, meta_description, content, nav, display, created_at, updated_at
     FROM pages
     WHERE slug = $1 AND display = true
     LIMIT 1`,
    [slug]
  );
  return rows[0] || null;
}

export async function getPageByCanonicalPath(pool, path) {
  const { rows } = await pool.query(
    `SELECT id, slug, canonical_path, locale, i18n_group, title, meta_title, meta_description, content, nav, display, created_at, updated_at
     FROM pages
     WHERE canonical_path = $1 AND display = true
     LIMIT 1`,
    [path]
  );
  return rows[0] || null;
}


export async function listNavPages(pool) {
  const { rows } = await pool.query(
    `SELECT title, slug, canonical_path, locale, show_in_nav
     FROM pages
     WHERE display = true
     ORDER BY nav_order NULLS LAST, title`
  );
  return rows;
}


export async function listLeistungenSubpages(pool) {
  const { rows } = await pool.query(
    `SELECT id, slug, canonical_path, title, meta_title, meta_description, content
     FROM pages
     WHERE display = true
       AND canonical_path LIKE '/leistungen/%'
       AND canonical_path <> '/leistungen'
     ORDER BY title`
  );
  return rows;
}