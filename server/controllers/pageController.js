import { getPageByCanonicalPath, getPageBySlug } from '../services/pageService.js';
import { normalizeBlocks } from '../helpers/componentRegistry.js';

import {
  absUrl,
  buildMeta,
  buildSchemaGraph,
  loadTranslations,
  safeJsonLd
} from '../helpers/pageMeta.js';

export async function renderHome(req, res, next) {
  return renderBySlugInternal('de', req, res, next);
}

export async function renderBySlug(req, res, next) {
  const slug = String(req.params.slug || '').trim();
  return renderBySlugInternal(slug, req, res, next);
}

export async function renderByCanonicalPath(req, res, next) {
  try {
    const pool = req.app.get('db');
    const path = req.path;
    const page = await getPageByCanonicalPath(pool, path);
    if (!page) return next();
    return renderPage(page, req, res, next);
  } catch (err) {
    return next(err);
  }
}

async function renderBySlugInternal(slug, req, res, next) {
  try {
    const pool = req.app.get('db');
    const page = await getPageBySlug(pool, slug);
    if (!page) return next();
    return renderPage(page, req, res, next);
  } catch (err) {
    return next(err);
  }
}

async function renderPage(page, req, res, next) {
  try {
    const pool = req.app.get('db');
    const blocks = normalizeBlocks(page.content || []);

    const translations = await loadTranslations(pool, page);
    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks, meta });

    return res.render('pages/page', {
      page,
      blocks,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}
