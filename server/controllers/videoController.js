import { getPageByCanonicalPath } from '../services/pageService.js';
import { getMediaVideos } from '../services/mediaService.js';
import { resolveLanguageKey } from '../helpers/language.js';
import {
  buildMeta,
  buildSchemaGraph,
  absUrl,
  loadTranslations,
  safeJsonLd
} from '../helpers/pageMeta.js';

const DEFAULT_CATEGORIES = ['Alle Filme', 'Fokus', 'Featured', 'Dokumentar', 'Kurzfilm', 'Kinder'];

function getBlock(content = [], type) {
  if (!Array.isArray(content)) return null;
  return content.find((block) => block?.type === type) || null;
}

function getVideoPageSettings(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const block = getBlock(content, 'videoPage') || {};
  const categories = Array.isArray(block.categories) && block.categories.length
    ? block.categories
    : DEFAULT_CATEGORIES;

  return {
    heroMode: block.heroMode === 'manual' ? 'manual' : 'random',
    heroVideoId: block.heroVideoId || null,
    categories
  };
}

function pickRandomVideo(videos) {
  if (!videos.length) return null;
  const index = Math.floor(Math.random() * videos.length);
  return videos[index];
}

function resolveHeroVideo({ videos, settings }) {
  if (!videos.length) return null;
  if (settings.heroMode === 'manual' && settings.heroVideoId) {
    const match = videos.find((video) => String(video.id) === String(settings.heroVideoId));
    if (match) return match;
  }
  return pickRandomVideo(videos);
}

function buildCategoryMap({ videos, categories }) {
  return categories.map((category) => {
    const items = category === 'Alle Filme'
      ? videos
      : videos.filter((video) => video.category === category);
    return { category, items };
  });
}

function resolveOnlineTicketStatus(req) {
  return Boolean(
    req.session?.onlineTicket
    || req.session?.user?.onlineTicket
    || req.session?.user?.hasOnlineTicket
  );
}

function pickRandomVideos(videos, count) {
  if (!videos.length) return [];
  const shuffled = videos.slice();
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled.slice(0, count);
}

export async function renderVideoPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const path = req.path;
    const requestedVideoId = req.params?.videoId ? String(req.params.videoId) : null;
    const basePath = requestedVideoId ? path.replace(`/${requestedVideoId}`, '') : path;
    let page = await getPageByCanonicalPath(pool, path);
    if (!page && requestedVideoId) {
      page = await getPageByCanonicalPath(pool, basePath);
    }
    if (!page && basePath === '/video') {
      page = await getPageByCanonicalPath(pool, '/video-de');
    }
    if (!page) return next();

    const languageKey = resolveLanguageKey({ locale: page.locale, path: basePath });
    const videosRaw = await getMediaVideos(pool, languageKey);
    const regieBasePath = `/regie-${languageKey}`;
    const videos = videosRaw.map((video) => ({
      ...video,
      regie_url: video.regie_slug ? `${regieBasePath}/${video.regie_slug}` : null
    }));
    const settings = getVideoPageSettings(page);
    const requestedVideo = requestedVideoId
      ? videos.find((video) => String(video.id) === requestedVideoId)
      : null;
    const isDetailView = Boolean(requestedVideoId && requestedVideo);
    const heroVideo = isDetailView ? requestedVideo : resolveHeroVideo({ videos, settings });
    const categorySections = isDetailView
      ? [
        {
          category: 'Weitere Filme',
          items: pickRandomVideos(
            videos.filter((video) => String(video.id) !== String(heroVideo?.id)),
            3
          )
        }
      ]
      : buildCategoryMap({ videos, categories: settings.categories });
    const hasOnlineTicket = resolveOnlineTicketStatus(req);

    const translations = await loadTranslations(pool, page);
    const ticketsBasePath = `/tickets-${languageKey}`;
    const ticketPaths = {
      online: `${ticketsBasePath}?ticket=online`,
      kino: `${ticketsBasePath}?ticket=kino`
    };
    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks: [], meta });

    return res.render('pages/videos', {
      page,
      heroVideo,
      categorySections,
      hasOnlineTicket,
      isDetailView,
      basePath,
      ticketPaths,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}

export { DEFAULT_CATEGORIES };