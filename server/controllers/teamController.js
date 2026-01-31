import { getPageByCanonicalPath } from '../services/pageService.js';
import { getTeamMembers } from '../services/teamService.js';
import { resolveLanguageKey } from '../helpers/language.js';
import {
  buildMeta,
  buildSchemaGraph,
  absUrl,
  loadTranslations,
  safeJsonLd
} from '../helpers/pageMeta.js';

function getBlock(content = [], type) {
  if (!Array.isArray(content)) return null;
  return content.find((block) => block?.type === type) || null;
}

function getTeamPageContent(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const hero = getBlock(content, 'hero') || {};
  const about = getBlock(content, 'teamAbout') || {};

  return {
    headline: hero.headline || page?.title || '',
    subline: hero.subline || '',
    aboutHeadline: about.headline || '',
    aboutText: about.text || ''
  };
}

export async function renderTeamPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const path = req.path;
    let page = await getPageByCanonicalPath(pool, path);
    if (!page && path === '/team') {
      page = await getPageByCanonicalPath(pool, '/team-de');
    }
    if (!page) return next();

    const languageKey = resolveLanguageKey({ locale: page.locale, path: page.canonical_path });
    const teamMembers = await getTeamMembers(pool, { onlyDisplayed: true, locale: languageKey });
    const teamContent = getTeamPageContent(page);

    const translations = await loadTranslations(pool, page);
    const alternates = [];
    if (translations?.de) alternates.push({ hreflang: 'de-DE', href: absUrl(translations.de) });
    if (translations?.en) alternates.push({ hreflang: 'en', href: absUrl(translations.en) });
    if (translations?.ku) alternates.push({ hreflang: 'ku', href: absUrl(translations.ku) });

    const meta = buildMeta({ page, alternates });
    const schemaGraph = buildSchemaGraph({ page, blocks: [], meta });

    return res.render('pages/team', {
      page,
      teamMembers,
      teamContent,
      meta,
      schemaGraphJson: safeJsonLd(schemaGraph),
      translations
    });
  } catch (err) {
    return next(err);
  }
}