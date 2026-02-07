import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  createGalleryImage,
  createGalleryVideo,
  deleteGalleryImage,
  deleteGalleryVideo,
  findGalleryImageByName,
  findGalleryVideoByName,
  getGalleryImageById,
  getGalleryImages,
  getGalleryVideoById,
  getGalleryVideos,
  updateGalleryImageCategory,
  updateGalleryImageSortOrder,
  updateGalleryImageVisibility,
  updateGalleryVideoCategory,
  updateGalleryVideoSortOrder,
  updateGalleryVideoVisibility
} from '../services/galleryService.js';
import {
  processGalleryImageUpload,
  processGalleryVideoUpload
} from '../services/galleryUploadPipeline.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageUploadDir = path.join(__dirname, '..', '..', 'data', 'uploads', 'images');
const videoUploadDir = path.join(__dirname, '..', '..', 'data', 'uploads', 'videos');
const imagePublicPrefix = '/uploads/images';
const videoPublicPrefix = '/uploads/videos';

const normalizeString = (value) => {
  const trimmed = String(value ?? '').trim();
  return trimmed;
};

const normalizeBoolean = (value) => value === 'on' || value === 'true' || value === true;
const normalizeArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
};
const normalizeCanonicalPath = (value) => {
  const raw = normalizeString(value);
  if (!raw) return '/';
  if (raw === '/') return '/';
  return raw.startsWith('/') ? raw : `/${raw}`;
};

const normalizeAltValue = (value) => {
  const trimmed = String(value ?? '').trim();
  return trimmed;
};

const stripFileExtension = (value) => {
  if (!value) return '';
  return String(value).replace(/\.[^/.]+$/, '');
};

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const setNestedValue = (target, path, value) => {
  if (!path) return;
  const segments = String(path).split('.');
  let cursor = target;
  segments.forEach((segment, index) => {
    const isLast = index === segments.length - 1;
    const numeric = Number(segment);
    const isIndex = Number.isInteger(numeric) && String(numeric) === segment;
    if (isLast) {
      if (isIndex) {
        if (!Array.isArray(cursor)) return;
        cursor[numeric] = value;
      } else {
        cursor[segment] = value;
      }
      return;
    }
    const nextSegment = segments[index + 1];
    const nextNumeric = Number(nextSegment);
    const shouldBeArray = Number.isInteger(nextNumeric) && String(nextNumeric) === nextSegment;
    if (isIndex) {
      if (!Array.isArray(cursor)) return;
      cursor[numeric] = cursor[numeric] || (shouldBeArray ? [] : {});
      cursor = cursor[numeric];
      return;
    }
    if (!cursor[segment] || typeof cursor[segment] !== 'object') {
      cursor[segment] = shouldBeArray ? [] : {};
    }
    cursor = cursor[segment];
  });
};

const parseContentBlocks = (body) => {
  const order = safeJsonParse(body.content_block_order, []);
  const blockMap = {};
  const blocks = [];
  order.forEach((id) => {
    const type = normalizeString(body[`content_block_${id}_type`]);
    if (!type) return;
    const block = { type };
    blockMap[id] = block;
    blocks.push(block);
  });
  Object.entries(body).forEach(([key, rawValue]) => {
    const match = key.match(/^content_block_(.+?)__(.+)$/);
    if (!match) return;
    const [, id, path] = match;
    const block = blockMap[id];
    if (!block) return;
    if (path.endsWith('_gallery_id') || path.endsWith('_upload')) return;
    const value = Array.isArray(rawValue) ? rawValue[rawValue.length - 1] : rawValue;
    if (path === 'raw_json') {
      const parsed = safeJsonParse(value, null);
      if (parsed && typeof parsed === 'object') {
        blockMap[id] = { ...parsed, type: normalizeString(parsed.type) || block.type };
        const index = blocks.findIndex((entry) => entry === block);
        if (index >= 0) blocks[index] = blockMap[id];
      }
      return;
    }
    setNestedValue(block, path, normalizeString(value));
  });
  return { blocks, blockOrder: order, blockMap };
};

const isEmptyValue = (value) => {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return !value.trim();
  if (Array.isArray(value)) return value.every(isEmptyValue);
  if (typeof value === 'object') return Object.values(value).every(isEmptyValue);
  return false;
};

const stripEmptyArrayItems = (value) => {
  if (Array.isArray(value)) {
    return value
      .map(stripEmptyArrayItems)
      .filter((entry) => !isEmptyValue(entry));
  }
  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, entry]) => {
      value[key] = stripEmptyArrayItems(entry);
    });
  }
  return value;
};

const resolveImageFieldSimple = async ({ upload, galleryId, currentUrl, alt, pool }) => {
  const normalizedCurrentUrl = normalizeString(currentUrl);
  const altValue = typeof alt === 'object' && alt !== null
    ? (alt.de || alt.en || '')
    : alt;
  const normalizedAlt = normalizeAltValue(altValue);
  const uploadEntry = Array.isArray(upload) ? upload[0] : upload;
  if (uploadEntry) {
    const fallbackAlt = stripFileExtension(uploadEntry.originalname || uploadEntry.filename);
    const baseName = normalizedAlt || fallbackAlt;
    const stored = await processGalleryImageUpload(uploadEntry, { baseName });
    const resolvedAlt = normalizedAlt || fallbackAlt;
    await createGalleryImage(pool, {
      filename: stored.filename,
      originalName: stored.originalName,
      localPath: stored.localPath,
      cloudinaryUrl: stored.cloudinaryUrl,
      cloudinaryPublicId: stored.cloudinaryPublicId,
      width: stored.width,
      height: stored.height,
      sizeBytes: stored.sizeBytes,
      altDe: resolvedAlt,
      altEn: resolvedAlt,
      showInGallery: true,
      galleryCategory: null
    });
    return {
      src: stored.localPath,
      alt: resolvedAlt
    };
  }
  const parsedGalleryId = Number(galleryId);
  if (Number.isFinite(parsedGalleryId) && parsedGalleryId > 0) {
    const image = await getGalleryImageById(pool, parsedGalleryId);
    if (image) {
      return {
        src: image.cloudinary_url || image.local_path || normalizedCurrentUrl,
        alt: normalizedAlt || normalizeAltValue(image.alt_de) || normalizeAltValue(image.alt_en)
      };
    }
  }
  return {
    src: normalizedCurrentUrl,
    alt: normalizedAlt
  };
};

const buildHomeContent = (body) => {
  const blocks = [];
  const heroEnabled = normalizeBoolean(body.home_hero_enabled);
  const hero = {
    type: 'hero',
    headline: normalizeString(body.home_hero_headline),
    subline: normalizeString(body.home_hero_subline),
    ctaLabel: normalizeString(body.home_hero_cta_label),
    ctaHref: normalizeString(body.home_hero_cta_href),
    image: normalizeString(body.home_hero_image),
    imageAlt: {
      de: normalizeAltValue(body.home_hero_alt_de)
        || normalizeAltValue(body.home_hero_alt),
      en: normalizeAltValue(body.home_hero_alt_en)
    }
  };
  if (heroEnabled && Object.values(hero).some((value) => value)) {
    blocks.push(hero);
  }

  const kostenEnabled = normalizeBoolean(body.home_kosten_enabled);
  const steps = [1, 2, 3]
    .map((index) => {
      const altDe = normalizeAltValue(body[`home_kosten_step${index}_alt_de`])
        || normalizeAltValue(body[`home_kosten_step${index}_alt`]);
      const altEn = normalizeAltValue(body[`home_kosten_step${index}_alt_en`]);
      return {
        title: normalizeString(body[`home_kosten_step${index}_title`]),
        imageUrl: normalizeString(body[`home_kosten_step${index}_image`]),
        imageAlt: {
          de: altDe,
          en: altEn
        }
      };
    })
    .filter((step) => step.title || step.imageUrl || step.imageAlt?.de || step.imageAlt?.en);
  const kosten = {
    type: 'kosten',
    headline: normalizeString(body.home_kosten_headline),
    subline: normalizeString(body.home_kosten_subline),
    leadText: normalizeString(body.home_kosten_lead),
    detailText: normalizeString(body.home_kosten_detail),
    primaryButton: {
      label: normalizeString(body.home_kosten_primary_label),
      href: normalizeString(body.home_kosten_primary_href)
    },
    secondaryButton: {
      label: normalizeString(body.home_kosten_secondary_label),
      href: normalizeString(body.home_kosten_secondary_href)
    },
    steps
  };
  if (kostenEnabled && Object.values(kosten).some((value) => value)) {
    blocks.push(kosten);
  }

  const imageTextEnabled = normalizeBoolean(body.home_imagetext_enabled);
  const imageText = {
    type: 'imageText',
    title: normalizeString(body.home_imagetext_title),
    text: normalizeString(body.home_imagetext_text),
    img: {
      src: normalizeString(body.home_imagetext_image),
      alt: {
        de: normalizeAltValue(body.home_imagetext_alt_de)
          || normalizeAltValue(body.home_imagetext_alt),
        en: normalizeAltValue(body.home_imagetext_alt_en)
      }
    }
  };
  if (imageTextEnabled && Object.values(imageText).some((value) => value)) {
    blocks.push(imageText);
  }

  const richTextEnabled = normalizeBoolean(body.home_richtext_enabled);
  const richText = {
    type: 'richText',
    title: normalizeString(body.home_richtext_title),
    html: normalizeString(body.home_richtext_html)
  };
  if (richTextEnabled && Object.values(richText).some((value) => value)) {
    blocks.push(richText);
  }

  const ctaEnabled = normalizeBoolean(body.home_cta_enabled);
  const cta = {
    type: 'cta',
    title: normalizeString(body.home_cta_title),
    text: normalizeString(body.home_cta_text),
    button: {
      label: normalizeString(body.home_cta_button_label),
      href: normalizeString(body.home_cta_button_href)
    }
  };
  if (ctaEnabled && Object.values(cta).some((value) => value)) {
    blocks.push(cta);
  }

  const faqEnabled = normalizeBoolean(body.home_faq_enabled);
  const faqItems = [1, 2, 3, 4]
    .map((index) => ({
      q: normalizeString(body[`home_faq_q${index}`]),
      a: normalizeString(body[`home_faq_a${index}`])
    }))
    .filter((item) => item.q || item.a);
  const faq = {
    type: 'faq',
    title: normalizeString(body.home_faq_title),
    items: faqItems
  };
  if (faqEnabled && Object.values(faq).some((value) => value)) {
    blocks.push(faq);
  }

  return blocks;
};

const buildLeistungenContent = (body) => {
  const blocks = [];

  const heroEnabled = normalizeBoolean(body.leistungen_hero_enabled);
  const hero = {
    type: 'hero',
    headline: normalizeString(body.leistungen_hero_headline),
    subline: normalizeString(body.leistungen_hero_subline),
    ctaLabel: normalizeString(body.leistungen_hero_cta_label),
    ctaHref: normalizeString(body.leistungen_hero_cta_href),
    image: normalizeString(body.leistungen_hero_image),
    imageAlt: {
      de: normalizeAltValue(body.leistungen_hero_alt_de)
        || normalizeAltValue(body.leistungen_hero_alt),
      en: normalizeAltValue(body.leistungen_hero_alt_en)
    }
  };
  if (heroEnabled && Object.values(hero).some((value) => value)) {
    blocks.push(hero);
  }

  const kostenEnabled = normalizeBoolean(body.leistungen_kosten_enabled);
  const kostenSteps = [1, 2, 3]
    .map((index) => {
      const altDe = normalizeAltValue(body[`leistungen_kosten_step${index}_alt_de`])
        || normalizeAltValue(body[`leistungen_kosten_step${index}_alt`]);
      const altEn = normalizeAltValue(body[`leistungen_kosten_step${index}_alt_en`]);
      return {
        title: normalizeString(body[`leistungen_kosten_step${index}_title`]),
        imageUrl: normalizeString(body[`leistungen_kosten_step${index}_image`]),
        imageAlt: {
          de: altDe,
          en: altEn
        }
      };
    })
    .filter((step) => step.title || step.imageUrl || step.imageAlt?.de || step.imageAlt?.en);
  const kosten = {
    type: 'kosten',
    headline: normalizeString(body.leistungen_kosten_headline),
    description: normalizeString(body.leistungen_kosten_description),
    subheading: normalizeString(body.leistungen_kosten_subheading),
    subline: normalizeString(body.leistungen_kosten_subline),
    leadText: normalizeString(body.leistungen_kosten_lead),
    detailText: normalizeString(body.leistungen_kosten_detail),
    primaryButton: {
      label: normalizeString(body.leistungen_kosten_primary_label),
      href: normalizeString(body.leistungen_kosten_primary_href)
    },
    secondaryButton: {
      label: normalizeString(body.leistungen_kosten_secondary_label),
      href: normalizeString(body.leistungen_kosten_secondary_href)
    },
    steps: kostenSteps
  };
  if (kostenEnabled && Object.values(kosten).some((value) => value)) {
    blocks.push(kosten);
  }

  const kontaktEnabled = normalizeBoolean(body.leistungen_kontakt_enabled);
  const serviceList = normalizeArray(body.leistungen_services)
    .map((value) => normalizeString(value))
    .filter((value) => value)
    .slice(0, 8);
  const kontakt = {
    type: 'kontaktformular',
    layout: 'services',
    action: normalizeString(body.leistungen_kontakt_action) || '/contact',
    sideTitle: normalizeString(body.leistungen_kontakt_side_title),
    sideDescription: normalizeString(body.leistungen_kontakt_side_description),
    sideSubheading: normalizeString(body.leistungen_kontakt_side_subheading),
    services: serviceList
  };
  if (kontaktEnabled && Object.values(kontakt).some((value) => value)) {
    blocks.push(kontakt);
  }

  const bereicheEnabled = normalizeBoolean(body.leistungen_bereiche_enabled);
  const bereicheSlides = [1, 2, 3, 4]
    .map((index) => {
      const title = normalizeString(body[`leistungen_bereiche_slide${index}_title`]);
      const imageSrc = normalizeString(body[`leistungen_bereiche_slide${index}_image`]);
      const link = normalizeString(body[`leistungen_bereiche_slide${index}_link`]);
      if (!title && !imageSrc && !link) return null;
      return {
        title,
        link,
        image: {
          src: imageSrc,
          alt: title
        }
      };
    })
    .filter(Boolean);
  const bereiche = {
    type: 'bereiche',
    title: normalizeString(body.leistungen_bereiche_title),
    description: normalizeString(body.leistungen_bereiche_description),
    slider: {
      slides: bereicheSlides
    }
  };
  if (bereicheEnabled && Object.values(bereiche).some((value) => value)) {
    blocks.push(bereiche);
  }

  const faqEnabled = normalizeBoolean(body.leistungen_faq_enabled);
  const faqQuestions = normalizeArray(body.leistungen_faq_q).map((value) => normalizeString(value));
  const faqAnswers = normalizeArray(body.leistungen_faq_a).map((value) => normalizeString(value));
  const faqItems = faqQuestions
    .map((question, index) => ({
      q: question,
      a: faqAnswers[index] || ''
    }))
    .filter((item) => item.q || item.a)
    .slice(0, 8);
  const faq = {
    type: 'faq',
    title: normalizeString(body.leistungen_faq_title),
    description: normalizeString(body.leistungen_faq_description),
    button: {
      label: normalizeString(body.leistungen_faq_button_label),
      href: normalizeString(body.leistungen_faq_button_href)
    },
    items: faqItems
  };
  if (faqEnabled && Object.values(faq).some((value) => value)) {
    blocks.push(faq);
  }

  return blocks;
};

const getNewsletterSubscriptions = async (pool) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, newsletter_articles, newsletter_videos, newsletter_language, created_at
       FROM newsletter_subscriptions
       ORDER BY created_at DESC, id DESC`
    );
    return rows;
  } catch {
    return [];
  }
};

export async function getAdminPanel(req, res, next) {
  try {
    const pool = req.app.get('db');
    const { rows: pages } = await pool.query(
      `SELECT id, slug, canonical_path, title, meta_title, meta_description, nav, show_in_nav, nav_label,
              nav_order, display, locale, i18n_group, content
       FROM pages
       ORDER BY nav_order NULLS LAST, title`
    );
    const isHomePage = (page) => page?.canonical_path === '/' || page?.slug === 'de' || page?.slug === 'home';
    const pagesOrdered = Array.isArray(pages) ? [...pages] : [];
    const homeIndex = pagesOrdered.findIndex(isHomePage);
    if (homeIndex > -1) {
      const [homePage] = pagesOrdered.splice(homeIndex, 1);
      pagesOrdered.unshift(homePage);
    }

    const isLeistungenSubpage = (page) =>
      page?.canonical_path?.startsWith('/leistungen/')
      && page?.canonical_path !== '/leistungen';
    const leistungenSubpages = pagesOrdered.filter(isLeistungenSubpage);
    const pageTabs = pagesOrdered.filter((page) => !isLeistungenSubpage(page));
    const requestedSubpageId = Number(req.query.subpageId);
    const selectedLeistungenSubpage =
      leistungenSubpages.find((page) => page.id === requestedSubpageId)
      || leistungenSubpages[0]
      || null;

    const [galleryImages, galleryVideos, newsletterSubscriptions] = await Promise.all([
      getGalleryImages(pool),
      getGalleryVideos(pool),
      getNewsletterSubscriptions(pool)
    ]);

    res.render('admin/index', {
      meta: {
        title: 'Admin Backend – Sauber Mehr',
        description: 'Admin Backend für Sauber Mehr',
        locale: 'de-DE'
      },
      schemaGraphJson: '',
      pages: pageTabs,
      leistungenSubpages,
      selectedLeistungenSubpage,
      galleryImages,
      galleryVideos,
      newsletterSubscriptions,
      adminUser: req.session?.user || null,
      query: req.query
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const pageId = Number(req.params.id);
    const { rows } = await pool.query(
      'SELECT id, canonical_path, slug FROM pages WHERE id = $1',
      [pageId]
    );
    const page = rows[0];
    if (!page) {
      return res.redirect('/adminbackend?nav=pages&error=missing');
    }

    const usesBlocks = req.body.page_mode === 'blocks';
    const locale = normalizeString(req.body.locale);

    let pageContent = [];
    if (usesBlocks) {
      const { blocks, blockOrder, blockMap } = parseContentBlocks(req.body);

      for (const blockId of blockOrder) {
        const block = blockMap[blockId];
        if (!block) continue;
        if (block.type === 'hero') {
          const fieldBase = `content_block_${blockId}__image`;
          const resolved = await resolveImageFieldSimple({
            upload: req.files?.[`${fieldBase}_upload`],
            galleryId: req.body[`${fieldBase}_gallery_id`],
            currentUrl: block.image,
            alt: block.imageAlt,
            pool
          });
          if (resolved.src) block.image = resolved.src;
          if (resolved.alt) block.imageAlt = resolved.alt;
          const galleryItems = Array.isArray(block.gallery) ? block.gallery : [];
          for (let index = 0; index < galleryItems.length; index += 1) {
            const galleryFieldBase = `content_block_${blockId}__gallery.${index}.src`;
            const resolvedGallery = await resolveImageFieldSimple({
              upload: req.files?.[`${galleryFieldBase}_upload`],
              galleryId: req.body[`${galleryFieldBase}_gallery_id`],
              currentUrl: galleryItems[index]?.src,
              alt: galleryItems[index]?.alt,
              pool
            });
            galleryItems[index] = galleryItems[index] || {};
            if (resolvedGallery.src) galleryItems[index].src = resolvedGallery.src;
            if (resolvedGallery.alt) galleryItems[index].alt = resolvedGallery.alt;
          }
          block.gallery = galleryItems;
        }
        if (block.type === 'kosten') {
          const steps = Array.isArray(block.steps) ? block.steps : [];
          for (let index = 0; index < steps.length; index += 1) {
            const fieldBase = `content_block_${blockId}__steps.${index}.imageUrl`;
            const resolved = await resolveImageFieldSimple({
              upload: req.files?.[`${fieldBase}_upload`],
              galleryId: req.body[`${fieldBase}_gallery_id`],
              currentUrl: steps[index]?.imageUrl,
              alt: steps[index]?.imageAlt,
              pool
            });
            if (resolved.src) steps[index].imageUrl = resolved.src;
            if (resolved.alt) steps[index].imageAlt = resolved.alt;
          }
          block.steps = steps;
        }
        if (block.type === 'imageSlider') {
          const slides = Array.isArray(block.slides) ? block.slides : [];
          for (let index = 0; index < slides.length; index += 1) {
            const fieldBase = `content_block_${blockId}__slides.${index}.image.src`;
            const resolved = await resolveImageFieldSimple({
              upload: req.files?.[`${fieldBase}_upload`],
              galleryId: req.body[`${fieldBase}_gallery_id`],
              currentUrl: slides[index]?.image?.src,
              alt: slides[index]?.image?.alt,
              pool
            });
            slides[index].image = slides[index].image || {};
            if (resolved.src) slides[index].image.src = resolved.src;
            if (resolved.alt) slides[index].image.alt = resolved.alt;
          }
          block.slides = slides;
        }

        if (block.type === 'imageText') {
          const fieldBase = `content_block_${blockId}__img.src`;
          const resolved = await resolveImageFieldSimple({
            upload: req.files?.[`${fieldBase}_upload`],
            galleryId: req.body[`${fieldBase}_gallery_id`],
            currentUrl: block?.img?.src,
            alt: block?.img?.alt,
            pool
          });
          block.img = block.img || {};
          if (resolved.src) block.img.src = resolved.src;
          if (resolved.alt) block.img.alt = resolved.alt;
        }

        if (block.type === 'angebote') {
          const cards = Array.isArray(block.cards) ? block.cards : [];
          for (let index = 0; index < cards.length; index += 1) {
            const fieldBase = `content_block_${blockId}__cards.${index}.imageUrl`;
            const resolved = await resolveImageFieldSimple({
              upload: req.files?.[`${fieldBase}_upload`],
              galleryId: req.body[`${fieldBase}_gallery_id`],
              currentUrl: cards[index]?.imageUrl,
              alt: cards[index]?.imageAlt,
              pool
            });
            if (resolved.src) cards[index].imageUrl = resolved.src;
            if (resolved.alt) cards[index].imageAlt = resolved.alt;
          }
          block.cards = cards;
        }

        if (block.type === 'teamAbout') {
          const teamMembers = Array.isArray(block.teamMembers) ? block.teamMembers : [];
          for (let index = 0; index < teamMembers.length; index += 1) {
            const fieldBase = `content_block_${blockId}__teamMembers.${index}.image.src`;
            const resolved = await resolveImageFieldSimple({
              upload: req.files?.[`${fieldBase}_upload`],
              galleryId: req.body[`${fieldBase}_gallery_id`],
              currentUrl: teamMembers[index]?.image?.src,
              alt: teamMembers[index]?.image?.alt,
              pool
            });
            teamMembers[index].image = teamMembers[index].image || {};
            if (resolved.src) teamMembers[index].image.src = resolved.src;
            if (resolved.alt) teamMembers[index].image.alt = resolved.alt;
          }
          block.teamMembers = teamMembers;
        }

        if (block.type === 'specialCards') {
          const cards = Array.isArray(block.cards) ? block.cards : [];
          for (let index = 0; index < cards.length; index += 1) {
            const fieldBase = `content_block_${blockId}__cards.${index}.icon.src`;
            const resolved = await resolveImageFieldSimple({
              upload: req.files?.[`${fieldBase}_upload`],
              galleryId: req.body[`${fieldBase}_gallery_id`],
              currentUrl: cards[index]?.icon?.src,
              alt: cards[index]?.icon?.alt,
              pool
            });
            cards[index].icon = cards[index].icon || {};
            if (resolved.src) cards[index].icon.src = resolved.src;
            if (resolved.alt) cards[index].icon.alt = resolved.alt;
          }
          block.cards = cards;
        }

        if (block.type === 'bereiche') {
          const imageFieldBase = `content_block_${blockId}__image.src`;
          const resolvedImage = await resolveImageFieldSimple({
            upload: req.files?.[`${imageFieldBase}_upload`],
            galleryId: req.body[`${imageFieldBase}_gallery_id`],
            currentUrl: block?.image?.src,
            alt: block?.image?.alt,
            pool
          });
          if (resolvedImage.src || resolvedImage.alt) {
            block.image = block.image || {};
            if (resolvedImage.src) block.image.src = resolvedImage.src;
            if (resolvedImage.alt) block.image.alt = resolvedImage.alt;
          }
          const slides = Array.isArray(block?.slider?.slides) ? block.slider.slides : [];
          for (let index = 0; index < slides.length; index += 1) {
            const fieldBase = `content_block_${blockId}__slider.slides.${index}.image.src`;
            const resolved = await resolveImageFieldSimple({
              upload: req.files?.[`${fieldBase}_upload`],
              galleryId: req.body[`${fieldBase}_gallery_id`],
              currentUrl: slides[index]?.image?.src,
              alt: slides[index]?.image?.alt,
              pool
            });
            slides[index].image = slides[index].image || {};
            if (resolved.src) slides[index].image.src = resolved.src;
            if (resolved.alt) slides[index].image.alt = resolved.alt;
          }
          block.slider = block.slider || {};
          block.slider.slides = slides;
        }


        if (block.type === 'kontaktseite') {
          const resolveOptionImages = async (cardKey) => {
            const options = Array.isArray(block?.[cardKey]?.options) ? block[cardKey].options : [];
            for (let index = 0; index < options.length; index += 1) {
              const fieldBase = `content_block_${blockId}__${cardKey}.options.${index}.imageUrl`;
              const resolved = await resolveImageFieldSimple({
                upload: req.files?.[`${fieldBase}_upload`],
                galleryId: req.body[`${fieldBase}_gallery_id`],
                currentUrl: options[index]?.imageUrl,
                alt: options[index]?.imageAlt,
                pool
              });
              if (resolved.src) options[index].imageUrl = resolved.src;
              if (resolved.alt) options[index].imageAlt = resolved.alt;
            }
            block[cardKey] = block[cardKey] || {};
            block[cardKey].options = options;
          };

          await resolveOptionImages('startCard');
          await resolveOptionImages('areaACard');
          await resolveOptionImages('areaBCard');
          await resolveOptionImages('sectorCard');
          await resolveOptionImages('contactMethodCard');
        }
      }

      pageContent = blocks.map((block) => stripEmptyArrayItems(block));
    }
    const content = usesBlocks ? pageContent : safeJsonParse(req.body.content_json, []);

    const slug = normalizeString(req.body.slug);
    const canonicalPath = normalizeCanonicalPath(req.body.canonical_path);
    const title = normalizeString(req.body.title);
    const metaTitle = normalizeString(req.body.meta_title);
    const metaDescription = normalizeString(req.body.meta_description);
    const navLabel = normalizeString(req.body.nav_label);
    const navOrder = Number(req.body.nav_order);
    const i18nGroup = normalizeString(req.body.i18n_group);

    await pool.query(
      `UPDATE pages
       SET slug = $1,
           canonical_path = $2,
           title = $3,
           meta_title = $4,
           meta_description = $5,
           nav = $6,
           show_in_nav = $7,
           nav_label = $8,
           nav_order = $9,
           display = $10,
           locale = $11,
           i18n_group = $12,
           content = $13
       WHERE id = $14`,
      [
        slug,
        canonicalPath,
        title,
        metaTitle || null,
        metaDescription || null,
        normalizeBoolean(req.body.nav),
        normalizeBoolean(req.body.show_in_nav),
        navLabel || null,
        Number.isFinite(navOrder) ? navOrder : 0,
        normalizeBoolean(req.body.display),
        locale || 'de-DE',
        i18nGroup || null,
        JSON.stringify(content),
        pageId
      ]
    );

    return res.redirect(`/adminbackend?nav=pages&tab=page-${pageId}&saved=1`);
  } catch (err) {
    return next(err);
  }
}

export async function createLeistungenSubpage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const timestamp = Date.now();
    const slug = `leistungen-unterseite-${timestamp}`;
    const canonicalPath = `/leistungen/${slug}`;
    const content = [
      {
        type: 'hero',
        layout: 'leistungen-detail',
        headline: '',
        subline: '',
        gallery: [{}, {}, {}]
      },
      {
        type: 'kontaktformular',
        layout: 'services',
        services: []
      },
      {
        type: 'kosten'
      },
      {
        type: 'bereiche',
        layout: 'single',
        image: {}
      },
      {
        type: 'leistungenCards'
      },
      {
        type: 'faq'
      }
    ];

    const { rows } = await pool.query(
      `INSERT INTO pages (slug, canonical_path, title, meta_title, meta_description, content, nav, show_in_nav, display, locale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id`,
      [
        slug,
        canonicalPath,
        'Neue Leistung',
        null,
        null,
        JSON.stringify(content),
        false,
        false,
        false,
        'de-DE'
      ]
    );
    const pageId = rows[0]?.id;
    return res.redirect(`/adminbackend?nav=pages&tab=leistungen-subpages&subpageId=${pageId}`);
  } catch (err) {
    return next(err);
  }
}

export async function createGalleryImageAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const file = req.files?.gallery_image_file;
    if (!file) {
      return res.redirect('/adminbackend?nav=gallery&error=gallery-missing-image');
    }
    const duplicate = await findGalleryImageByName(pool, file.originalname);
    if (duplicate) {
      return res.redirect('/adminbackend?nav=gallery&error=gallery-duplicate-image');
    }
    const fallbackAlt = stripFileExtension(file.originalname || file.filename);
    const baseName = normalizeAltValue(req.body.gallery_image_alt_de) || fallbackAlt;
    const stored = await processGalleryImageUpload(file, { baseName });
    await createGalleryImage(pool, {
      filename: stored.filename,
      originalName: file.originalname,
      localPath: stored.localPath,
      cloudinaryUrl: stored.cloudinaryUrl,
      cloudinaryPublicId: stored.cloudinaryPublicId,
      sizeBytes: stored.sizeBytes,
      width: stored.width,
      height: stored.height,
      altDe: normalizeAltValue(req.body.gallery_image_alt_de) || fallbackAlt,
      altEn: normalizeAltValue(req.body.gallery_image_alt_en) || fallbackAlt,
      showInGallery: true,
      galleryCategory: normalizeString(req.body.gallery_image_category) || null
    });
    return res.redirect('/adminbackend?nav=gallery');
  } catch (err) {
    return next(err);
  }
}

export async function createGalleryVideoAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const file = req.files?.gallery_video_file;
    if (!file) {
      return res.redirect('/adminbackend?nav=gallery&error=gallery-missing-video');
    }
    const duplicate = await findGalleryVideoByName(pool, file.originalname);
    if (duplicate) {
      return res.redirect('/adminbackend?nav=gallery&error=gallery-duplicate-video');
    }
    const stored = await processGalleryVideoUpload(file);
    await createGalleryVideo(pool, {
      filename: stored.filename,
      originalName: file.originalname,
      localPath: stored.localPath,
      cloudinaryUrl: stored.cloudinaryUrl,
      cloudinaryPublicId: stored.cloudinaryPublicId,
      sizeBytes: stored.sizeBytes,
      width: stored.width,
      height: stored.height,
      altDe: normalizeString(req.body.gallery_video_alt_de),
      altEn: normalizeString(req.body.gallery_video_alt_en),
      showInGallery: true,
      galleryCategory: normalizeString(req.body.gallery_video_category) || null
    });
    return res.redirect('/adminbackend?nav=gallery');
  } catch (err) {
    return next(err);
  }
}

export async function deleteGalleryImageAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const id = Number(req.params.id);
    const image = await getGalleryImageById(pool, id);
    if (image?.local_path) {
      const localPath = image.local_path.startsWith(`${imagePublicPrefix}/`)
        ? path.join(imageUploadDir, image.local_path.replace(`${imagePublicPrefix}/`, ''))
        : (image.local_path.startsWith('/')
          ? path.join(__dirname, '..', 'public', image.local_path.replace(/^\//, ''))
          : image.local_path);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
    await deleteGalleryImage(pool, id);
    return res.redirect('/adminbackend?nav=gallery');
  } catch (err) {
    return next(err);
  }
}

export async function deleteGalleryVideoAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const id = Number(req.params.id);
    const video = await getGalleryVideoById(pool, id);
    if (video?.local_path) {
      const localPath = video.local_path.startsWith(`${videoPublicPrefix}/`)
        ? path.join(videoUploadDir, video.local_path.replace(`${videoPublicPrefix}/`, ''))
        : (video.local_path.startsWith('/')
          ? path.join(__dirname, '..', 'public', video.local_path.replace(/^\//, ''))
          : video.local_path);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }
    await deleteGalleryVideo(pool, id);
    return res.redirect('/adminbackend?nav=gallery');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryVisibilityAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const images = req.body.images || {};
    const videos = req.body.videos || {};
    const imageCategories = req.body.image_categories || {};
    const videoCategories = req.body.video_categories || {};

    await Promise.all(
      Object.entries(images).map(([key, value]) => {
        const id = Number(key.replace('id_', ''));
        return updateGalleryImageVisibility(pool, id, normalizeBoolean(value));
      })
    );

    await Promise.all(
      Object.entries(videos).map(([key, value]) => {
        const id = Number(key.replace('id_', ''));
        return updateGalleryVideoVisibility(pool, id, normalizeBoolean(value));
      })
    );

    await Promise.all(
      Object.entries(imageCategories).map(([key, value]) => {
        const id = Number(key.replace('id_', ''));
        return updateGalleryImageCategory(pool, id, normalizeString(value));
      })
    );

    await Promise.all(
      Object.entries(videoCategories).map(([key, value]) => {
        const id = Number(key.replace('id_', ''));
        return updateGalleryVideoCategory(pool, id, normalizeString(value));
      })
    );

    return res.redirect('/adminbackend?nav=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryImageSortAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const order = safeJsonParse(req.body.order, []);
    await updateGalleryImageSortOrder(pool, order);
    return res.redirect('/adminbackend?nav=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryVideoSortAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const order = safeJsonParse(req.body.order, []);
    await updateGalleryVideoSortOrder(pool, order);
    return res.redirect('/adminbackend?nav=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}