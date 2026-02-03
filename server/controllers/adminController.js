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

const downloadToFile = async (url, targetPath) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Cloudflare download failed: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  await fs.promises.writeFile(targetPath, Buffer.from(arrayBuffer));
};

const compressImageWithCloudflare = async (sourcePath, targetPath) => {
  const accountId = process.env.CLOUDFLARE_IMAGES_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) return null;
  const uploadEndpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1`;
  const fileBuffer = await fs.promises.readFile(sourcePath);
  const form = new FormData();
  form.append('file', new Blob([fileBuffer]), path.basename(sourcePath));
  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`
    },
    body: form
  });
  const payload = await response.json();
  if (!response.ok || !payload?.success) {
    return null;
  }
  const variantUrl =
    payload?.result?.variants?.[0]
    || (process.env.CLOUDFLARE_IMAGES_DELIVERY_URL
      ? `${process.env.CLOUDFLARE_IMAGES_DELIVERY_URL}/${payload.result?.id}/public`
      : null);
  if (!variantUrl) return null;
  await downloadToFile(variantUrl, targetPath);
  return variantUrl;
};

const storeCompressedImageUpload = async (upload) => {
  if (!upload) return null;
  const targetPath = path.join(imageUploadDir, upload.filename);
  if (upload.path !== targetPath) {
    await fs.promises.rename(upload.path, targetPath);
  }
  await compressImageWithCloudflare(targetPath, targetPath);
  const stats = await fs.promises.stat(targetPath);
  return {
    localPath: `${imagePublicPrefix}/${upload.filename}`,
    sizeBytes: stats.size
  };
};

const safeJsonParse = (value, fallback) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
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
    image: normalizeString(body.home_hero_image)
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
      pages,
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

    const isHome = req.body.page_mode === 'home';
    const locale = normalizeString(req.body.locale);

    const resolveImageField = async ({
      upload,
      galleryId,
      currentUrl,
      altDe,
      altEn,
      currentAltDe,
      currentAltEn
    }) => {
      const normalizedCurrentUrl = normalizeString(currentUrl);
      const normalizedAltDe = normalizeAltValue(altDe) || normalizeAltValue(currentAltDe);
      const normalizedAltEn = normalizeAltValue(altEn) || normalizeAltValue(currentAltEn);
      const uploadEntry = Array.isArray(upload) ? upload[0] : upload;
      if (uploadEntry) {
        const stored = await storeCompressedImageUpload(uploadEntry);
        const fallbackAlt = stripFileExtension(uploadEntry.originalname || uploadEntry.filename);
        return {
          src: stored?.localPath || normalizedCurrentUrl,
          altDe: normalizedAltDe || fallbackAlt,
          altEn: normalizedAltEn || fallbackAlt
        };
      }
      const parsedGalleryId = Number(galleryId);
      if (Number.isFinite(parsedGalleryId) && parsedGalleryId > 0) {
        const image = await getGalleryImageById(pool, parsedGalleryId);
        if (image) {
          return {
            src: image.cloudinary_url || image.local_path || normalizedCurrentUrl,
            altDe: normalizeAltValue(image.alt_de) || normalizedAltDe,
            altEn: normalizeAltValue(image.alt_en) || normalizedAltEn
          };
        }
      }
      return {
        src: normalizedCurrentUrl,
        altDe: normalizedAltDe,
        altEn: normalizedAltEn
      };
    };

    if (isHome) {
      const heroImage = await resolveImageField({
        upload: req.files?.home_hero_image_upload,
        galleryId: req.body.home_hero_image_gallery_id,
        currentUrl: req.body.home_hero_image_current
      });
      if (heroImage?.src) {
        req.body.home_hero_image = heroImage.src;
      }

      for (const index of [1, 2, 3]) {
        const stepImage = await resolveImageField({
          upload: req.files?.[`home_kosten_step${index}_upload`],
          galleryId: req.body[`home_kosten_step${index}_gallery_id`],
          currentUrl: req.body[`home_kosten_step${index}_image_current`],
          altDe: req.body[`home_kosten_step${index}_alt_de`],
          altEn: req.body[`home_kosten_step${index}_alt_en`],
          currentAltDe: req.body[`home_kosten_step${index}_alt_current_de`],
          currentAltEn: req.body[`home_kosten_step${index}_alt_current_en`]
        });
        if (stepImage?.src) {
          req.body[`home_kosten_step${index}_image`] = stepImage.src;
        }
        req.body[`home_kosten_step${index}_alt_de`] = stepImage.altDe;
        req.body[`home_kosten_step${index}_alt_en`] = stepImage.altEn;
      }

      const imageText = await resolveImageField({
        upload: req.files?.home_imagetext_upload,
        galleryId: req.body.home_imagetext_gallery_id,
        currentUrl: req.body.home_imagetext_image_current,
        altDe: req.body.home_imagetext_alt_de,
        altEn: req.body.home_imagetext_alt_en,
        currentAltDe: req.body.home_imagetext_alt_current_de,
        currentAltEn: req.body.home_imagetext_alt_current_en
      });
      if (imageText?.src) {
        req.body.home_imagetext_image = imageText.src;
      }
      req.body.home_imagetext_alt_de = imageText.altDe;
      req.body.home_imagetext_alt_en = imageText.altEn;
    }
    const content = isHome
      ? buildHomeContent(req.body)
      : safeJsonParse(req.body.content_json, []);

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

const resolveLocalAssetPath = (absolutePath, baseDir, publicPrefix) => {
  if (!absolutePath) return null;
  const normalized = absolutePath.replace(baseDir, '').replace(/\\/g, '/');
  if (normalized.startsWith('/')) {
    return `${publicPrefix}${normalized}`;
  }
  return `${publicPrefix}/${normalized}`;
};

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
    const stored = await storeCompressedImageUpload(file);
    const fallbackAlt = stripFileExtension(file.originalname || file.filename);
    await createGalleryImage(pool, {
      filename: file.filename,
      originalName: file.originalname,
      localPath: stored?.localPath || `${imagePublicPrefix}/${file.filename}`,
      sizeBytes: stored?.sizeBytes || file.size,
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
    const localPath = resolveLocalAssetPath(file.path, videoUploadDir, videoPublicPrefix);
    await createGalleryVideo(pool, {
      filename: file.filename,
      originalName: file.originalname,
      localPath,
      sizeBytes: file.size,
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