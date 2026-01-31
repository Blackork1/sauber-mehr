const SITE = {
  name: 'Kurdisches Filmfestival',
  baseUrl: 'https://kurdisches-filmfestival.de',
  defaultLocale: 'de-DE',
  defaultOgImage: {
    url: 'https://kurdisches-filmfestival.de/images/og-default.jpg',
    width: 1200,
    height: 630,
    alt: 'Kurdisches Filmfestival'
  },
  organization: {
    id: 'https://kurdisches-filmfestival.de/#organization',
    name: 'Kurdisches Filmfestival',
    url: 'https://kurdisches-filmfestival.de/',
    logo: {
      url: 'https://kurdisches-filmfestival.de/images/logo.png',
      width: 545,
      height: 545
    },
    sameAs: [
      'https://www.facebook.com/KurdischesFilmfestival',
      'https://www.instagram.com/kurdisches.filmfestival/',
      'https://x.com/Filmfestkurdi'
    ]
  }
};

function stripTags(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function pagePathFromSlug(slug) {
  if (slug === 'de') return '/de';
  if (slug === 'en') return '/en';
  if (slug === 'ku') return '/ku';
  return `/${slug}`;
}

export function absUrl(pathOrUrl) {
  if (!pathOrUrl) return '';
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return SITE.baseUrl.replace(/\/$/, '') + (pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`);
}

export function safeJsonLd(obj) {
  return JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

export function buildMeta({ page, alternates = [] }) {
  const canonical = absUrl(page.canonical_path || pagePathFromSlug(page.slug));

  const title = page.meta_title || page.title || SITE.name;
  const description = page.meta_description || '';

  const robots = page.noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const locale = page.locale || SITE.defaultLocale;

  const ogImage = page.og_image
    ? { url: absUrl(page.og_image), width: 1200, height: 630, alt: title }
    : { ...SITE.defaultOgImage, alt: title };

  return {
    title,
    description,
    robots,
    canonical,
    locale,
    alternates,
    og: {
      type: page.og_type || 'website',
      site_name: SITE.name,
      url: canonical,
      title,
      description,
      image: ogImage
    }
  };
}

export function buildSchemaGraph({ page, blocks, meta }) {
  const url = meta.canonical;
  const websiteId = SITE.baseUrl + '/#website';
  const orgId = SITE.organization.id;

  const graph = [];

  graph.push({
    '@type': 'Organization',
    '@id': orgId,
    name: SITE.organization.name,
    url: SITE.organization.url,
    logo: {
      '@type': 'ImageObject',
      url: SITE.organization.logo.url,
      width: SITE.organization.logo.width,
      height: SITE.organization.logo.height
    },
    sameAs: SITE.organization.sameAs
  });

  graph.push({
    '@type': 'WebSite',
    '@id': websiteId,
    url: SITE.baseUrl + '/',
    name: SITE.name,
    publisher: { '@id': orgId },
    inLanguage: meta.locale
  });

  graph.push({
    '@type': 'WebPage',
    '@id': url + '#webpage',
    url,
    name: meta.title,
    description: meta.description,
    isPartOf: { '@id': websiteId },
    about: { '@id': orgId },
    inLanguage: meta.locale,
    ...(page.primary_image
      ? {
        primaryImageOfPage: {
          '@type': 'ImageObject',
          url: absUrl(page.primary_image)
        }
      }
      : {})
  });

  const faqBlock = Array.isArray(page.content)
    ? page.content.find((block) => block?.type === 'faq' && Array.isArray(block?.items) && block.items.length)
    : null;

  if (faqBlock) {
    graph.push({
      '@type': 'FAQPage',
      '@id': url + '#faq',
      mainEntity: faqBlock.items
        .filter((item) => item?.q && item?.a)
        .map((item) => ({
          '@type': 'Question',
          name: stripTags(item.q),
          acceptedAnswer: { '@type': 'Answer', text: stripTags(item.a) }
        }))
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

export async function loadTranslations(pool, page) {
  if (!page.i18n_group) return null;

  const { rows } = await pool.query(
    'SELECT slug, canonical_path, locale FROM pages WHERE i18n_group=$1 AND display=true',
    [page.i18n_group]
  );

  const byLocale = {};
  for (const row of rows) {
    byLocale[row.locale] = row.canonical_path || pagePathFromSlug(row.slug);
  }

  return {
    de: byLocale['de-DE'] || byLocale['de'] || null,
    en: byLocale['en-US'] || byLocale['en'] || null,
    ku: byLocale['ku'] || null
  };
}