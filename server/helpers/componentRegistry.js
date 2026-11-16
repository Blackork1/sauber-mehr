/**
 * Strict mapping of allowed block types to EJS partials.
 * This prevents "include path injection" when blocks come from the DB.
 */
export const COMPONENT_REGISTRY = {
  hero: 'hero',
  kosten: 'kosten',
  richText: 'richText',
  cta: 'cta',
  imageText: 'imageText',
  imageSlider: 'imageSlider',
  bereiche: 'bereiche',
  leistungenCards: 'leistungenCards',
  shootingGallery: 'shootingGallery',
  faq: 'faq',
  angebote: 'angebote',
  mitgliedschaften: 'mitgliedschaften',
  kontaktformular: 'kontaktformular',
  kontaktseite: 'kontaktseite',
  teamAbout: 'teamAbout',
  specialCards: 'specialCards',
  ueberUns: 'ueberUns',
  werte: 'werte',
  bewertungen: 'bewertungen',
  referenzen: 'referenzen',
};

export function normalizeBlocks(blocks = []) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    const type = String(b?.type || '').trim();
    const view = COMPONENT_REGISTRY[type] ? COMPONENT_REGISTRY[type] : '_unknown';
    return { ...b, type, view };
  });
}
