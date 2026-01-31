import { getPageByCanonicalPath } from '../services/pageService.js';
import {
  getNewsArticleById,
  getNewsArticleBySlug,
  getNewsArticles,
  getNewsArticlesByGroupId
} from '../services/mediaService.js';
import {
  buildMeta,
  buildSchemaGraph,
  absUrl,
  loadTranslations,
  safeJsonLd
} from '../helpers/pageMeta.js';
import { buildNewsSlug } from '../helpers/newsSlug.js';

function pickRandomArticles(articles, count) {
  const shuffled = [...articles];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

function parseGalleryItems(rawGallery) {
  if (!rawGallery) return [];
  if (Array.isArray(rawGallery)) return rawGallery;
  if (typeof rawGallery === 'string') {
    try {
      const parsed = JSON.parse(rawGallery);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function splitParagraphs(text) {
  if (!text) return [];
  return String(text)
    .split(/\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

// function slugifyTitle(title) {
//   if (!title) return '';
//   return String(title)
//     .toLowerCase()
//     .replace(/ä/g, 'ae')
//     .replace(/ö/g, 'oe')
//     .replace(/ü/g, 'ue')
//     .replace(/ß/g, 'ss')
//     .replace(/[^a-z0-9]+/g, '-')
//     .replace(/^-+|-+$/g, '');
// }

function resolveNewsLanguage(page, path) {
  const locale = page?.locale ? String(page.locale).toLowerCase() : '';
  if (locale.startsWith('de')) return 'de';
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('ku')) return 'ku';
  if (path?.includes('-en')) return 'en';
  if (path?.includes('-ku')) return 'ku';
  return 'de';
}

function resolveLocaleFromLanguage(language) {
  if (language === 'en') return 'en-US';
  if (language === 'ku') return 'ku';
  return 'de-DE';
}

async function resolveArticleTranslations(pool, article) {
  if (!article?.news_group_id) return null;
  const group = await getNewsArticlesByGroupId(pool, article.news_group_id);
  if (!group.length) return null;
  return group.reduce((acc, row) => {
    if (row?.language && row?.slug) acc[row.language] = row.slug;
    return acc;
  }, {});
}


export async function renderNewsPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const path = req.path;
    let page = await getPageByCanonicalPath(pool, path);
    if (!page && path === '/news') {
      page = await getPageByCanonicalPath(pool, '/news-de');
    }
    if (!page) return next();

    const language = resolveNewsLanguage(page, path);
    const newsArticles = await getNewsArticles(pool, language);
    const heroArticles = pickRandomArticles(newsArticles, 5);
    const contentBlocks = Array.isArray(page.content) ? page.content : [];
    const overviewBlock = contentBlocks.find((block) => (
      block?.type === 'artikelSection' || block?.type === 'newsOverview'
    ));
    const newsletterBlock = contentBlocks.find((block) => block?.type === 'newsletter');

    const translations = await loadTranslations(pool, page);
    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks: [], meta });

    return res.render('pages/news', {
      page,
      heroArticles,
      newsArticles,
      overviewBlock,
      newsletterBlock,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}

export async function renderNewsArticle(req, res, next) {
  try {
    const pool = req.app.get('db');
    const rawId = String(req.params.id || '').trim();
    const rawSlug = String(req.params.slug || '').trim();
    const rawLang = String(req.params.lang || '').trim();
    const articleId = Number(rawId);
    console.log(rawLang);
    

    let article = null;
    let requestedById = false;
    if (rawId && Number.isFinite(articleId)) {
      article = await getNewsArticleById(pool, articleId);
      requestedById = true;
    } else if (rawSlug) {
      const slugCandidates = new Set();
      slugCandidates.add(req.path);
      slugCandidates.add(rawSlug);
      if (!rawSlug.startsWith('/')) {
        slugCandidates.add(`/${rawSlug}`);
      }
      if (rawLang) {
        slugCandidates.add(`/news-${rawLang}/${rawSlug}`);
      }
      for (const candidate of slugCandidates) {
        if (!candidate) continue;
        // eslint-disable-next-line no-await-in-loop
        article = await getNewsArticleBySlug(pool, candidate);
        if (article) break;
      }
    }
    if (!article) return next();
    if (article.display === false) return next();
    if (requestedById && article.slug) {
      return res.redirect(301, article.slug);
    }

    const galleryItems = parseGalleryItems(article.gallery);
    const bodyParagraphs = splitParagraphs(article.description_long || article.description_short);
    const canonicalSlug = article.slug || buildNewsSlug(article.language || 'de', article.title);
    const translations = await resolveArticleTranslations(pool, article);    

    const page = {
      canonical_path: canonicalSlug || `/news/${article.id}`,
      meta_title: article.title,
      meta_description: article.meta_description || article.description_short || '',
      og_image: article.title_image_url,
      og_type: 'article',
      locale: resolveLocaleFromLanguage(article.language),
      primary_image: article.title_image_url,
      content: []
    };

    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });
    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks: [], meta });

    return res.render('pages/news-article', {
      article,
      galleryItems,
      bodyParagraphs,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}