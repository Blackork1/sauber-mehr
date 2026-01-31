import { getPageByCanonicalPath, getPageBySlug } from '../services/pageService.js';
import { getMediaTickets, getMediaVideos, getNewsArticles } from '../services/mediaService.js';
import { getPublicGalleryImages, getPublicGalleryVideos } from '../services/galleryService.js';
import { getSponsors } from '../services/sponsorService.js';
import { normalizeBlocks } from '../helpers/componentRegistry.js';
import { resolveLanguageKey } from '../helpers/language.js';

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

    const hasMediaVideos = blocks.some((block) => block.type === 'mediaVideos');
    const hasMediaTickets = blocks.some((block) => block.type === 'mediaTickets');
    const hasNewsArticles = blocks.some((block) => block.type === 'artikelSection');
    const hasGallery = blocks.some((block) => block.type === 'gallery');
    const hasSponsors = blocks.some((block) => block.type === 'sponsors');
    const languageKey = resolveLanguageKey({ locale: page.locale, path: page.canonical_path });

    const [mediaVideos, mediaTickets, newsArticles, galleryImages, galleryVideos, sponsors] = await Promise.all([
      hasMediaVideos ? getMediaVideos(pool, languageKey) : [],
      hasMediaTickets ? getMediaTickets(pool, languageKey) : [],
      hasNewsArticles ? getNewsArticles(pool, languageKey) : [],
      hasGallery ? getPublicGalleryImages(pool) : [],
      hasGallery ? getPublicGalleryVideos(pool) : [],
      hasSponsors ? getSponsors(pool, languageKey) : []
    ]);
    const hydratedTickets = hasMediaTickets
      ? mediaTickets.map((ticket) => ({
        ...ticket,
        purchase_url: ticket.button_url || `/checkout?ticketId=${ticket.id}&type=${ticket.ticket_type}`
      }))
      : [];
    // hreflang alternates automatisch aus i18n_group bauen
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
      mediaVideos,
      mediaTickets: hydratedTickets,
      newsArticles,
      galleryImages,
      galleryVideos,
      sponsors,

      // neu:
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),

      // für Navbar-Sprachwahl:
      translations
    });
  } catch (err) {
    return next(err);
  }
}
