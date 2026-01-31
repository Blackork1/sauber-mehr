import { getPageByCanonicalPath } from '../services/pageService.js';
import { normalizeBlocks } from '../helpers/componentRegistry.js';
import { getMediaTickets, getMediaVideos } from '../services/mediaService.js';
import { getTicketPageSettings, getTicketVisibility } from '../services/ticketPageService.js';
import { resolveLanguageKey } from '../helpers/language.js';
import {
  absUrl,
  buildMeta,
  buildSchemaGraph,
  loadTranslations,
  safeJsonLd
} from '../helpers/pageMeta.js';

export async function renderTicketPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const path = req.path;
    let page = await getPageByCanonicalPath(pool, path);
    if (!page && path === '/tickets') {
      page = await getPageByCanonicalPath(pool, '/tickets-de');
    }
    if (!page) return next();

    const blocks = normalizeBlocks(page.content || []);
    const languageKey = resolveLanguageKey({ locale: page.locale, path: page.canonical_path });
    const normalizeChoice = (value) => {
      const choice = String(value || '').toLowerCase();
      if (choice === 'online' || choice === 'kino') return choice;
      return null;
    };
    const requestedChoice = normalizeChoice(
      req.query?.ticket ?? req.query?.choice ?? req.query?.tab
    );
    const blocksWithChoice = requestedChoice
      ? blocks.map((block) => {
        if (block.view !== 'ticketsHero' && block.view !== 'ticketsSection') return block;
        return { ...block, defaultChoice: requestedChoice };
      })
      : blocks;
    const [mediaTickets, mediaVideos, ticketSettings, ticketVisibility, translations] = await Promise.all([
      getMediaTickets(pool, languageKey),
      getMediaVideos(pool, languageKey),
      getTicketPageSettings(pool, languageKey),
      getTicketVisibility(pool, languageKey),
      loadTranslations(pool, page)
    ]);

    const visibilityMap = ticketVisibility || {};
    const defaultVisibility = (ticket) => ({
      showOnline: ['online', 'combo'].includes(ticket.ticket_type),
      showKino: ['kino', 'combo'].includes(ticket.ticket_type)
    });

    const visibleTickets = mediaTickets.filter((ticket) => {
      const visibility = visibilityMap[ticket.id] || defaultVisibility(ticket);
      return visibility.showOnline || visibility.showKino;
    }).map((ticket) => ({
      ...ticket,
      purchase_url: ticket.button_url || `/checkout?ticketId=${ticket.id}&type=${ticket.ticket_type}`
    }));
    const selectTickets = (ticketType) =>
      visibleTickets.filter((ticket) => {
        const visibility = visibilityMap[ticket.id] || defaultVisibility(ticket);
        if (ticketType === 'online') return visibility.showOnline;
        return visibility.showKino;
      });

    const pickVideoById = (videos, id) => videos.find((video) => video.id === id) || null;
    const resolveFeaturedVideo = (section) => {
      const config = ticketSettings?.[section];
      if (!config) return null;
      if (config.featuredMode === 'manual' && config.featuredVideoId) {
        return pickVideoById(mediaVideos, Number(config.featuredVideoId));
      }
      if (!mediaVideos.length) return null;
      const randomIndex = Math.floor(Math.random() * mediaVideos.length);
      return mediaVideos[randomIndex];
    };

    const placeholderImage = '/images/placeholder-festival.webp';
    const metaLabelMap = {
      de: { language: 'Sprache', director: 'Regie', production: 'Produktion', duration: 'Laufzeit' },
      en: { language: 'Language', director: 'Director', production: 'Production', duration: 'Duration' },
      ku: { language: 'Ziman', director: 'Rêjî', production: 'Çêkirin', duration: 'Dirêjî' }
    };
    const metaLabels = metaLabelMap[languageKey] || metaLabelMap.de;

    const buildVideoMeta = (video) => {
      if (!video) return [];
      const meta = [];
      if (video.published_at) {
        meta.push(new Date(video.published_at).getFullYear().toString());
      }
      if (Array.isArray(video.languages) && video.languages.length) {
        meta.push(`${metaLabels.language}: ${video.languages.join(', ')}`);
      }
      if (video.regie) meta.push(`${metaLabels.director}: ${video.regie}`);
      if (video.production) meta.push(`${metaLabels.production}: ${video.production}`);
      if (video.duration) meta.push(`${metaLabels.duration}: ${video.duration}`);
      return meta;
    };

    const buildScenes = (video) => {
      if (!video || !Array.isArray(video.other_images)) {
        return [];
      }
      const scenes = video.other_images.filter(Boolean);
      if (!scenes.length) return [];
      return scenes.map((src, index) => ({
        src,
        alt: `${video.title || 'Szene'} ${index + 1}`
      }));
    };

    const buildVideoCards = (ids) => {
      const selected = Array.isArray(ids) && ids.length
        ? ids.map((id) => pickVideoById(mediaVideos, Number(id))).filter(Boolean)
        : [];
      return selected.map((video) => ({
        title: video.title || '',
        image: video.thumbnail_url || video.other_images?.[0] || placeholderImage
      }));
    };

    const kinoFeaturedVideo = resolveFeaturedVideo('kino');
    const onlineFeaturedVideo = resolveFeaturedVideo('online');

    const actionLabelMap = {
      de: {
        onlinePrimary: 'Onlineticket kaufen',
        onlineSecondary: 'Zum Kinoticket',
        kinoPrimary: 'Kinoticket kaufen',
        kinoSecondary: 'Zum Onlinepass'
      },
      en: {
        onlinePrimary: 'Buy online ticket',
        onlineSecondary: 'Go to cinema ticket',
        kinoPrimary: 'Buy cinema ticket',
        kinoSecondary: 'Go to online pass'
      },
      ku: {
        onlinePrimary: 'Bilêta online bikire',
        onlineSecondary: 'Bo bilêta sînemayê',
        kinoPrimary: 'Bilêta sînemayê bikire',
        kinoSecondary: 'Bo online-pass'
      }
    };
    const actionLabels = actionLabelMap[languageKey] || actionLabelMap.de;
    const ticketPath = `/tickets-${languageKey}`;
    const onlinePath = `/online-pass-${languageKey}`;

    const placeholderText = {
      de: 'Sobald Videos veröffentlicht sind, erscheint hier eine Auswahl.',
      en: 'As soon as videos are published, a selection will appear here.',
      ku: 'Dema ku vîdyoyan were weşandin, li vir hilbijartinek dê xuya bibe.'
    };
    const placeholderHeadline = {
      de: 'Noch kein Video verfügbar',
      en: 'No video available yet',
      ku: 'Hîn vîdyo tune ye'
    };
    const placeholderDescription = placeholderText[languageKey] || placeholderText.de;
    const placeholderTitle = placeholderHeadline[languageKey] || placeholderHeadline.de;

    const ticketShowcase = {
      kino: {
        tickets: selectTickets('kino'),
        heroImage: {
          src: ticketSettings?.kino?.heroImageSrc || '',
          alt: ticketSettings?.kino?.heroImageAlt || ''
        },
        featured: kinoFeaturedVideo
          ? {
            title: kinoFeaturedVideo.title || '',
            image: kinoFeaturedVideo.thumbnail_url || kinoFeaturedVideo.other_images?.[0] || placeholderImage,
            meta: buildVideoMeta(kinoFeaturedVideo),
            description: kinoFeaturedVideo.description_short || kinoFeaturedVideo.description || '',
            tag: 'KINO',
            actions: [
              { label: actionLabels.kinoPrimary, url: ticketPath },
              { label: actionLabels.kinoSecondary, url: onlinePath, variant: 'secondary' }
            ]
          }
          : {
            title: placeholderTitle,
            image: placeholderImage,
            meta: [],
            description: placeholderDescription,
            tag: 'KINO',
            actions: [
              { label: actionLabels.kinoPrimary, url: ticketPath },
              { label: actionLabels.kinoSecondary, url: onlinePath, variant: 'secondary' }
            ]
          },
        scenes: buildScenes(kinoFeaturedVideo),
        nowPlaying: buildVideoCards(ticketSettings?.kino?.nowPlayingIds),
        upcoming: buildVideoCards(ticketSettings?.kino?.upcomingIds),
        upcomingDate: ticketSettings?.kino?.upcomingDate || ''
      },
      online: {
        tickets: selectTickets('online'),
        heroImage: {
          src: ticketSettings?.online?.heroImageSrc || '',
          alt: ticketSettings?.online?.heroImageAlt || ''
        },
        featured: onlineFeaturedVideo
          ? {
            title: onlineFeaturedVideo.title || '',
            image: onlineFeaturedVideo.thumbnail_url || onlineFeaturedVideo.other_images?.[0] || placeholderImage,
            meta: buildVideoMeta(onlineFeaturedVideo),
            description: onlineFeaturedVideo.description_short || onlineFeaturedVideo.description || '',
            tag: 'ONLINE',
            actions: [
              { label: actionLabels.onlinePrimary, url: onlinePath },
              { label: actionLabels.onlineSecondary, url: ticketPath, variant: 'secondary' }
            ]
          }
          : {
            title: placeholderTitle,
            image: placeholderImage,
            meta: [],
            description: placeholderDescription,
            tag: 'ONLINE',
            actions: [
              { label: actionLabels.onlinePrimary, url: onlinePath },
              { label: actionLabels.onlineSecondary, url: ticketPath, variant: 'secondary' }
            ]
          },
        scenes: buildScenes(onlineFeaturedVideo),
        videos: buildVideoCards(ticketSettings?.online?.videoIds),
        allVideos: mediaVideos
      }
    };


    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks: blocksWithChoice, meta });

    return res.render('pages/ticket', {
      page,
      blocks: blocksWithChoice,
      mediaTickets: visibleTickets,
      ticketShowcase,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}