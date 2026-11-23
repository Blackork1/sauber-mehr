import { getPageByCanonicalPath, getPageBySlug, listLeistungenSubpages } from '../services/pageService.js';
import { normalizeBlocks } from '../helpers/componentRegistry.js';
import { HOME_SECTIONS } from '../content/homePreviews.js';

import {
  absUrl,
  buildMeta,
  buildSchemaGraph,
  loadTranslations,
  safeJsonLd
} from '../helpers/pageMeta.js';

/**
 * Startseite: Blöcke aus der DB (Slug 'de') plus die neuen Sektionen aus
 * content/homePreviews.js (Über uns + Werte nach dem Hero, Bewertungen +
 * Referenzen nach dem Kontaktformular).
 */
export async function renderHome(req, res, next) {
  try {
    const pool = req.app.get('db');
    const page = await getPageBySlug(pool, 'de');
    if (!page) return next();
    return renderPage({ ...page, content: composeHomeContent(page.content) }, req, res, next);
  } catch (err) {
    return next(err);
  }
}

function composeHomeContent(content) {
  const baseBlocks = (Array.isArray(content) ? content : []).map((block) => {
    // „kleinen starken Team“ → „starken Team“ (bis der DB-Text im Admin angepasst ist)
    if (block?.type === 'angebote' && typeof block.description === 'string') {
      return { ...block, description: block.description.replace(/kleinen starken Team/g, 'starken Team') };
    }
    return block;
  });
  const hasType = (type) => baseBlocks.some((block) => block?.type === type);
  // Falls die neuen Blöcke später direkt in der DB gepflegt werden, nicht doppelt einfügen
  const afterHero = HOME_SECTIONS.afterHero.filter((block) => !hasType(block.type));
  const afterKontakt = HOME_SECTIONS.afterKontakt.filter((block) => !hasType(block.type));

  const merged = [];
  let heroInserted = false;
  let kontaktInserted = false;
  baseBlocks.forEach((block) => {
    merged.push(block);
    if (!heroInserted && block?.type === 'hero') {
      merged.push(...afterHero);
      heroInserted = true;
    }
    if (!kontaktInserted && block?.type === 'kontaktformular') {
      merged.push(...afterKontakt);
      kontaktInserted = true;
    }
  });
  if (!heroInserted) merged.unshift(...afterHero);
  if (!kontaktInserted) merged.push(...afterKontakt);
  return merged;
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
