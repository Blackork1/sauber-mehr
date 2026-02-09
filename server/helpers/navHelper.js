// helpers/navHelper.js
/**
 * Loads navigation + service subpages from DB and exposes them as res.locals.* for EJS.
 */
export function navbarMiddleware(pool) {
  return async (req, res, next) => {
    try {
      const path = req.path || '';
      const isEnglish = path.startsWith('/en') || path.endsWith('-en');
      const locale = isEnglish ? 'en-US' : 'de-DE';

      const { rows: navPagesRaw } = await pool.query(
        `SELECT title, nav_label, canonical_path, locale, show_in_nav, nav_order
         FROM pages
         WHERE display = true
           AND show_in_nav = true
           AND locale = $1
         ORDER BY nav_order NULLS LAST, title`,
        [locale]
      );

      const navPages = navPagesRaw.map((page) => ({
        ...page,
        label: page.nav_label || page.title
      }));

      const leistungenRoot = navPages.find((page) => (
        page.canonical_path === '/leistungen'
        || /^\/leistungen(?:-[a-z]{2})?$/.test(page.canonical_path || '')
      ));

      const leistungenRootPath = leistungenRoot?.canonical_path || '/leistungen';
      const { rows: navLeistungenRaw } = await pool.query(
        `SELECT title, nav_label, canonical_path, nav_order
         FROM pages
         WHERE display = true
           AND show_in_nav = true
           AND locale = $1
           AND canonical_path LIKE $2
           AND canonical_path <> $3
         ORDER BY nav_order NULLS LAST, title`,
        [locale, `${leistungenRootPath}/%`, leistungenRootPath]
      );

      res.locals.navPages = navPages;
      res.locals.navLeistungenSubpages = navLeistungenRaw.map((page) => ({
        ...page,
        label: page.nav_label || page.title
      }));
      res.locals.navLeistungenRootPath = leistungenRootPath;
    } catch (err) {
      console.error('⚠️ Fehler beim Laden der Navigation:', err);
      res.locals.navPages = [];
      res.locals.navLeistungenSubpages = [];
      res.locals.navLeistungenRootPath = '/leistungen';
    }

    next();
  };
}
