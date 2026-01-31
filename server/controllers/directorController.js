import { resolveLanguageKey } from '../helpers/language.js';
import {
  absUrl,
  buildMeta,
  buildSchemaGraph,
  safeJsonLd
} from '../helpers/pageMeta.js';
import { getDirectorBySlug, getDirectorLocalesByDirectorId } from '../services/directorService.js';
import { getMediaVideosByDirectorId } from '../services/mediaService.js';

const LOCALE_MAP = {
  de: 'de-DE',
  en: 'en-US',
  ku: 'ku'
};

const buildDirectorPath = (languageKey, slug) => {
  const prefix = `/regie-${languageKey}`;
  return `${prefix}/${slug}`;
};

export async function renderDirectorPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const slug = String(req.params?.slug || '').trim();
    if (!slug) return next();
    const languageKey = resolveLanguageKey({ path: req.path });
    const director = await getDirectorBySlug(pool, { slug, locale: languageKey });
    if (!director) return next();

    const [videos, locales] = await Promise.all([
      getMediaVideosByDirectorId(pool, director.id, languageKey),
      getDirectorLocalesByDirectorId(pool, director.id)
    ]);

    const translations = locales.reduce((acc, locale) => {
      if (!locale?.slug || !locale?.locale) return acc;
      acc[locale.locale] = buildDirectorPath(locale.locale, locale.slug);
      return acc;
    }, {});

    const meta = buildMeta({
      page: {
        canonical_path: buildDirectorPath(languageKey, director.slug),
        meta_title: `Regie - ${director.name}`,
        meta_description: director.meta_description || '',
        title: `Regie - ${director.name}`,
        locale: LOCALE_MAP[languageKey] || LOCALE_MAP.de,
        og_type: 'profile',
        og_image: director.background_image_url || director.portrait_image_url || ''
      },
      alternates: [
        translations.de ? { hreflang: 'de-DE', href: absUrl(translations.de) } : null,
        translations.en ? { hreflang: 'en', href: absUrl(translations.en) } : null,
        translations.ku ? { hreflang: 'ku', href: absUrl(translations.ku) } : null
      ].filter(Boolean)
    });

    const schemaGraph = buildSchemaGraph({
      page: {
        canonical_path: buildDirectorPath(languageKey, director.slug),
        primary_image: director.background_image_url || director.portrait_image_url || ''
      },
      blocks: [],
      meta
    });

    return res.render('pages/director', {
      director,
      videos,
      languageKey,
      videoBasePath: `/video-${languageKey}`,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations: {
        de: translations.de || null,
        en: translations.en || null,
        ku: translations.ku || null
      }
    });
  } catch (err) {
    return next(err);
  }
}