/**
 * Strict mapping of allowed block types to EJS partials.
 * This prevents "include path injection" when blocks come from the DB.
 */
export const COMPONENT_REGISTRY = {
  hero: 'hero',
  richText: 'richText',
  cta: 'cta',
  imageText: 'imageText',
  faq: 'faq',
  mediaVideos: 'mediaVideos',
  mediaTickets: 'mediaTickets',
  artikelSection: 'artikelSection',
  welcome: 'welcome',
  videoPage: 'videoPage',
  ticketsHero: 'ticketsHero',
  ticketsSection: 'ticketsSection',
  donation: 'donation',
  gallery: 'gallery',
  rahmenplan: 'rahmenplan',
  sponsorHero: 'sponsorHero',
  sponsors: 'sponsors'
};

export function normalizeBlocks(blocks = []) {
  if (!Array.isArray(blocks)) return [];
  return blocks.map((b) => {
    const type = String(b?.type || '').trim();
    const view = COMPONENT_REGISTRY[type] ? COMPONENT_REGISTRY[type] : '_unknown';
    return { ...b, type, view };
  });
}
