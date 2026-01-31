const normalizeSlugBase = (value) => String(value || '')
  .toLowerCase()
  .replace(/ä/g, 'ae')
  .replace(/ö/g, 'oe')
  .replace(/ü/g, 'ue')
  .replace(/ß/g, 'ss')
  .replace(/\./g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

export const buildNewsSlug = (language, title) => {
  const prefix = language ? `/news-${language}` : '/news';
  const slugBase = normalizeSlugBase(title);
  return slugBase ? `${prefix}/${slugBase}` : prefix;
};

export const slugifyTitle = (title) => normalizeSlugBase(title);