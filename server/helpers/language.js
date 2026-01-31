export function resolveLanguageKey({ locale, path } = {}) {
  const normalizedLocale = (locale || '').toLowerCase();
  if (normalizedLocale.startsWith('de')) return 'de';
  if (normalizedLocale.startsWith('en')) return 'en';
  if (normalizedLocale.startsWith('ku')) return 'ku';

  if (path) {
    if (path.startsWith('/en') || path.endsWith('-en') || path.includes('-en/')) return 'en';
    if (path.startsWith('/ku') || path.endsWith('-ku') || path.includes('-ku/')) return 'ku';
  }

  return 'de';
}