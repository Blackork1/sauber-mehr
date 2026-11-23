import { getPageByCanonicalPath, getPageBySlug, listLeistungenSubpages } from '../services/pageService.js';
import { normalizeBlocks } from '../helpers/componentRegistry.js';
import { HOME_PREVIEW_VARIANTS } from '../content/homePreviews.js';

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

/**
 * Startseiten-Entwürfe (/home1, /home2, /home3).
 * Lädt die aktuelle Startseite aus der DB und ergänzt die neuen Sektionen
 * aus content/homePreviews.js. Die Seiten sind noindex, stehen nicht in der
 * Sitemap und verändern die echte Startseite nicht.
 */
export async function renderHomePreview(req, res, next) {
  try {
    const key = String(req.path || '').replace(/^\//, '').replace(/\/$/, '').toLowerCase();
    const variant = HOME_PREVIEW_VARIANTS[key];
    if (!variant) return next();

    const pool = req.app.get('db');
    const page = await getPageBySlug(pool, 'de');
    if (!page) return next();

    // Textanpassungen an bestehenden DB-Blöcken nur für die Vorschau
    // (auf der echten Startseite im Admin-Backend ändern)
    const baseBlocks = (Array.isArray(page.content) ? page.content : []).map((block) => {
      if (block?.type === 'angebote' && typeof block.description === 'string') {
        return { ...block, description: block.description.replace(/kleinen starken Team/g, 'starken Team') };
      }
      return block;
    });
    const merged = [];
    let heroInserted = false;
    let kontaktInserted = false;
    baseBlocks.forEach((block) => {
      merged.push(block);
      if (!heroInserted && block?.type === 'hero') {
        merged.push(...variant.afterHero);
        heroInserted = true;
      }
      if (!kontaktInserted && block?.type === 'kontaktformular') {
        merged.push(...variant.afterKontakt);
        kontaktInserted = true;
      }
    });
    if (!heroInserted) merged.unshift(...variant.afterHero);
    if (!kontaktInserted) merged.push(...variant.afterKontakt);

    const blocks = normalizeBlocks(merged);
    const servicePages = await listLeistungenSubpages(pool);
    const baseMeta = buildMeta({ page });
    const previewPath = `/${key}`;
    const meta = {
      ...baseMeta,
      title: `Entwurf ${variant.number} – ${baseMeta.title}`,
      robots: 'noindex, nofollow',
      canonical: absUrl(previewPath),
      og: { ...baseMeta.og, url: absUrl(previewPath) }
    };

    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.set('Cache-Control', 'no-store');

    return res.render('pages/home-preview', {
      page,
      blocks,
      meta,
      schemaGraphJson: '',
      translations: null,
      servicePages,
      previewKey: key,
      previewVariant: variant,
      previewVariants: Object.entries(HOME_PREVIEW_VARIANTS).map(([variantKey, entry]) => ({
        key: variantKey,
        number: entry.number,
        name: entry.name
      }))
    });
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
    const servicePages = await listLeistungenSubpages(pool);

    const translations = await loadTranslations(pool, page);
    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks, meta });

    return res.render('pages/page', {
      page,
      blocks,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations,
      servicePages
    });
  } catch (err) {
    return next(err);
  }
}
