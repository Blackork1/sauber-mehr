// helpers/navHelper.js
/**
 * Loads pages + industries from DB and exposes them as res.locals.* for EJS.
 */
export function navbarMiddleware(pool) {
  return async (req, res, next) => {
    try {
      const path = req.path || '';
      const isEnglish = path.startsWith('/en') || path.endsWith('-en');
      const locale = isEnglish ? 'en-US' : 'de-DE';
      const [{ rows: pages }, { rows: industries }] = await Promise.all([
        pool.query(`
          SELECT title, slug, canonical_path, locale, show_in_nav, nav_order
          FROM pages
          WHERE display = true
          AND show_in_nav = true
          AND locale = $1
          ORDER BY nav_order, title
          `, [locale]),
        pool.query(`
          SELECT slug, name
          FROM industries
          ORDER BY name
          `)
      ]);

      res.locals.navPages = pages;
      res.locals.navIndustries = industries.map((i) => ({ name: i.name, slug: i.slug }));
    } catch (err) {
      console.error('⚠️ Fehler beim Laden der Navbar-Seiten:', err);
      res.locals.navPages = [];
      res.locals.navIndustries = [];
    }
    next();
  };
}
