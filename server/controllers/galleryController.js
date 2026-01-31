import { getPageByCanonicalPath } from '../services/pageService.js';
import { getPublicGalleryImages, getPublicGalleryVideos } from '../services/galleryService.js';
import { buildMeta, buildSchemaGraph, absUrl, loadTranslations, safeJsonLd } from '../helpers/pageMeta.js';

function extractGalleryBlock(content) {
  if (!Array.isArray(content)) return { headline: '', text: '' };
  const block = content.find((item) => item?.type === 'gallery') || {};
  return {
    headline: block.headline || '',
    text: block.text || ''
  };
}

export async function renderGallery(req, res, next) {
  try {
    const pool = req.app.get('db');
    const path = req.path;
    let page = await getPageByCanonicalPath(pool, path);
    if (!page && path === '/gallery') {
      page = await getPageByCanonicalPath(pool, '/gallery-de');
    }
    if (!page) return next();

    const [galleryImages, galleryVideos] = await Promise.all([
      getPublicGalleryImages(pool),
      getPublicGalleryVideos(pool)
    ]);

    const translations = await loadTranslations(pool, page);
    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks: [], meta });
    const galleryBlock = extractGalleryBlock(page.content);

    return res.render('pages/gallery', {
      page,
      galleryBlock,
      galleryImages,
      galleryVideos,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}