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
  faq: 'faq',
  angebote: 'angebote',
};

export function normalizeBlocks(blocks = []) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    const type = String(b?.type || '').trim();
    const view = COMPONENT_REGISTRY[type] ? COMPONENT_REGISTRY[type] : '_unknown';
    return { ...b, type, view };
  });
}
