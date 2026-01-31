import { getPageByCanonicalPath } from '../services/pageService.js';
import { normalizeBlocks } from '../helpers/componentRegistry.js';
import {
  buildMeta,
  buildSchemaGraph,
  absUrl,
  loadTranslations,
  safeJsonLd
} from '../helpers/pageMeta.js';

export async function renderRahmenplanPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const path = req.path;
    let page = await getPageByCanonicalPath(pool, path);
    if (!page && path === '/rahmenplan') {
      page = await getPageByCanonicalPath(pool, '/rahmenplan-de');
    }
    if (!page) return next();

    const blocks = normalizeBlocks(page.content || []);

    const translations = await loadTranslations(pool, page);
    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks, meta });

    return res.render('pages/rahmenplan', {
      page,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}