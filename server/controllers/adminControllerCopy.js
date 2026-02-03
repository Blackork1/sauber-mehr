import fs from 'fs/promises';
import path from 'path';
import {
  createTeamMember,
  deleteTeamMember,
  getTeamMembersWithLocales,
  updateTeamMemberBase,
  upsertTeamMemberLocale,
  updateTeamMemberLocaleDisplay
} from '../services/teamService.js';
import {
  createSponsor,
  deleteSponsor,
  getSponsors,
  updateSponsor
} from '../services/sponsorService.js';
import {
  createDirector,
  deleteDirector,
  getDirectorLocalesByDirectorId,
  getDirectorOptions,
  getDirectorsWithLocales,
  upsertDirectorLocale
} from '../services/directorService.js';
import {
  createNewsArticle,
  createMediaVideo,
  createMediaTicket,
  deleteNewsArticlesByGroup,
  deleteMediaTicketsByGroup,
  getAllMediaTickets,
  getMediaTicketGroups,
  getMediaTicketsByGroupId,
  getMediaVideoGroups,
  getMediaVideosByGroupId,
  getNewsArticleGroups,
  getNewsArticlesByGroupId,
  getNextMediaTicketGroupId,
  getNextMediaVideoGroupId,
  getNextNewsGroupId,
  updateMediaTicket,
  updateMediaTicketVisibility,
  updateMediaVideo,
  updateMediaVideoVisibility,
  deleteMediaVideosByGroup,
  updateNewsArticle,
  updateNewsArticleVisibility
} from '../services/mediaService.js';
import {
  getTicketPageSettings,
  getTicketVisibility,
  upsertTicketPageSettings,
  upsertTicketVisibility
} from '../services/ticketPageService.js';
import {
  createOnlineAccessCodeAdmin,
  deleteOnlineAccessCode,
  getOnlineAccessCodes,
  getTicketOrdersAdminOverview
} from '../services/ticketOrderService.js';
import {
  getDonationById,
  getDonationsAdminOverview
} from '../services/donationService.js';
import {
  getStandardKinoTicket,
  upsertStandardKinoTicket
} from '../services/standardKinoTicketService.js';
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
import { buildNewsSlug, slugifyTitle } from '../helpers/newsSlug.js';
import { sendNewsletterMail } from '../services/mailService.js';
import { generateDonationReceiptPdf } from '../services/donationReceiptService.js';

function stripTags(html = '') {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeVisibilityValue(value) {
  if (Array.isArray(value)) {
    return value.includes('1');
  }
  return value === '1';
}

function normalizeVisibilityKey(key) {
  const normalized = String(key || '');
  if (normalized.startsWith('id_')) {
    return normalized.slice(3);
  }
  return normalized;
}

function normalizeGalleryCategory(value) {
  const normalized = String(value || '').trim();
  const allowed = new Set(['films', 'events', 'moments']);
  if (!normalized || !allowed.has(normalized)) return null;
  return normalized;
}

function normalizeSortIds(value) {
  const list = parseJsonList(value);
  const ids = list
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry) && entry > 0);
  return ids;
}

function buildSortedOrderIds(requestedIds = [], items = []) {
  const itemMap = new Map(items.map((item) => [String(item.id), item]));
  const used = new Set();
  const normalized = [];
  requestedIds.forEach((id) => {
    const key = String(id);
    if (!itemMap.has(key) || used.has(key)) return;
    used.add(key);
    normalized.push(key);
  });
  items.forEach((item) => {
    const key = String(item.id);
    if (used.has(key)) return;
    used.add(key);
    normalized.push(key);
  });
  const visible = [];
  const hidden = [];
  normalized.forEach((id) => {
    const item = itemMap.get(id);
    if (!item) return;
    if (item.show_in_gallery) {
      visible.push(id);
    } else {
      hidden.push(id);
    }
  });
  return [...visible, ...hidden];
}

function resolveLocaleFromSlug(slug = '') {
  const match = String(slug).toLowerCase().match(/-(de|en|ku)$/);
  return match ? match[1] : null;
}

function resolveLocaleFromPage(page) {
  return resolveLocaleKey(page?.locale) || resolveLocaleFromSlug(page?.slug);
}

function buildTicketOrderOverview({ orders = [], attendees = [], accessCodes = [] }) {
  const attendeeMap = attendees.reduce((acc, attendee) => {
    if (!attendee.order_id) return acc;
    if (!acc[attendee.order_id]) acc[attendee.order_id] = [];
    acc[attendee.order_id].push(attendee);
    return acc;
  }, {});
  const accessCodeMap = accessCodes.reduce((acc, code) => {
    if (!code.order_id) return acc;
    if (!acc[code.order_id]) acc[code.order_id] = [];
    acc[code.order_id].push(code);
    return acc;
  }, {});

  return orders.map((order) => ({
    ...order,
    attendees: attendeeMap[order.id] || [],
    accessCodes: accessCodeMap[order.id] || []
  }));
}

async function getNewsletterSettings(pool) {
  const { rows } = await pool.query(
    'SELECT footer_html, footer_logo_url, footer_logo_alt FROM newsletter_settings ORDER BY id LIMIT 1'
  );
  return rows[0] || { footer_html: '', footer_logo_url: '', footer_logo_alt: '' };
}

function normalizeContentValue(content) {
  if (Array.isArray(content)) return content;
  if (typeof content === 'string') {
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch (error) {
      return [];
    }
  }
  if (content && typeof content === 'object') return [content];
  return [];
}

function getBlock(content, type) {
  if (!Array.isArray(content)) return null;
  return content.find((block) => block?.type === type) || null;
}

function ensureBlock(content, type, defaults = {}) {
  if (!Array.isArray(content)) return null;
  let block = content.find((item) => item?.type === type);
  if (!block) {
    block = { type, ...defaults };
    content.push(block);
  }
  return block;
}

function filterContentByTypes(content, allowedTypes = []) {
  if (!Array.isArray(content)) return [];
  const allowed = new Set(allowedTypes);
  return content.filter((block) => allowed.has(block?.type));
}

function upsertHero(content, data) {
  const block = ensureBlock(content, 'hero', { headline: '', subline: '', focus: '' });
  block.headline = data.h1 || '';
  block.subline = data.date || '';
  block.focus = data.focus || '';
}

function upsertRichText(content, description) {
  const block = ensureBlock(content, 'richText', { html: '' });
  const cleanText = String(description || '').trim();
  if (!cleanText) {
    block.html = '';
    return;
  }
  const paragraphs = cleanText
    .split(/\r?\n+/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
  block.html = paragraphs.map((paragraph) => `<p>${paragraph}</p>`).join('');
}

function upsertSection(content, type, data) {
  const block = ensureBlock(content, type, { headline: '', text: '' });
  block.headline = data.title || '';
  block.text = data.description || '';
}

function upsertGallerySection(content, data) {
  const block = ensureBlock(content, 'gallery', { headline: '', text: '' });
  block.headline = data.headline || '';
  block.text = data.text || '';
}

function upsertTicketsSection(content, data) {
  const hasMediaTickets = Boolean(getBlock(content, 'mediaTickets'));
  const hasImageText = Boolean(getBlock(content, 'imageText'));
  if (hasImageText && !hasMediaTickets) {
    const block = ensureBlock(content, 'imageText', { title: '', text: '', img: { src: '', alt: '' } });
    block.title = data.title || '';
    block.text = data.description || '';
    return;
  }
  upsertSection(content, 'mediaTickets', data);
}

function upsertTicketsHeroKino(content, data) {
  const block = ensureBlock(content, 'ticketsHero', {
    defaultChoice: 'online',
    tabs: [
      { key: 'online', label: 'Online-Pass' },
      { key: 'kino', label: 'Kino-Ticket' }
    ],
    online: {},
    kino: {}
  });
  const kino = block.kino || {};
  block.kino = {
    ...kino,
    title: data.title || '',
    text: data.text || ''
  };
}

function upsertTicketsSectionKino(content, data) {
  const block = ensureBlock(content, 'ticketsSection', {
    defaultChoice: 'online',
    online: {},
    kino: {}
  });
  const kino = block.kino || {};
  block.kino = {
    ...kino,
    headline: data.headline || '',
    text: data.text || ''
  };
}

const DEFAULT_DONATION_AMOUNTS = [25, 50, 75, 100];

function normalizeDonationAmounts(amounts = []) {
  const normalized = [];
  for (let index = 0; index < 5; index += 1) {
    const defaults = DEFAULT_DONATION_AMOUNTS[index];
    const existing = amounts?.[index] || {};
    const rawValue = existing?.value ?? defaults ?? '';
    const parsedValue = Number(rawValue);
    const hasValue = Number.isFinite(parsedValue);
    normalized.push({
      value: hasValue ? parsedValue : '',
      enabled: typeof existing.enabled === 'boolean' ? existing.enabled : Boolean(defaults)
    });
  }
  return normalized;
}

function groupNewsArticles(rows = []) {
  const groups = new Map();
  rows.forEach((row) => {
    const groupId = row.media_group_id || row.id;
    if (!groupId) return;
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        articles: {}
      });
    }
    const group = groups.get(groupId);
    group.articles[row.language] = row;
  });
  return Array.from(groups.values());
}

function groupMediaVideos(rows = []) {
  const groups = new Map();
  rows.forEach((row) => {
    const groupId = row.media_group_id;
    if (!groupId) return;
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        videos: {}
      });
    }
    const group = groups.get(groupId);
    group.videos[row.language] = row;
  });
  return Array.from(groups.values());
}

function groupMediaTickets(rows = []) {
  const groups = new Map();
  rows.forEach((row) => {
    const groupId = row.media_group_id;
    if (!groupId) return;
    if (!groups.has(groupId)) {
      groups.set(groupId, {
        id: groupId,
        tickets: {}
      });
    }
    const group = groups.get(groupId);
    group.tickets[row.language] = row;
  });
  return Array.from(groups.values());
}

function parseDateInput(value) {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateNote(date) {
  if (!date) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear());
  return `${day}.${month}.${year}`;
}

function addDays(date, amount) {
  if (!date) return null;
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function buildTicketPricePhases({ eventPrice, preOrderPercent, preOrderEnd, earlyPercent, earlyEnd }) {
  const phases = [];
  const preOrderPrice = Number((eventPrice * (1 - preOrderPercent / 100)).toFixed(2));
  phases.push({
    phase: 'preorder',
    startAt: null,
    endAt: preOrderEnd,
    currentPrice: preOrderPrice,
    priceNote: preOrderEnd ? `gültig bis ${formatDateNote(preOrderEnd)}` : ''
  });

  let regularStart = addDays(preOrderEnd, 1);
  if (Number.isFinite(earlyPercent) && earlyEnd) {
    const earlyPrice = Number((eventPrice * (1 - earlyPercent / 100)).toFixed(2));
    phases.push({
      phase: 'early',
      startAt: addDays(preOrderEnd, 1),
      endAt: earlyEnd,
      currentPrice: earlyPrice,
      priceNote: earlyEnd ? `gültig bis ${formatDateNote(earlyEnd)}` : ''
    });
    regularStart = addDays(earlyEnd, 1);
  }

  phases.push({
    phase: 'event',
    startAt: regularStart,
    endAt: null,
    currentPrice: Number(eventPrice.toFixed(2)),
    priceNote: 'pro Person'
  });

  return phases;
}

async function replaceTicketFeatures(pool, ticketId, features = []) {
  await pool.query('DELETE FROM media_ticket_features WHERE ticket_id = $1', [ticketId]);
  if (!features.length) return;
  const inserts = features.map((feature, index) => ({
    text: feature,
    sortOrder: index + 1
  }));
  for (const feature of inserts) {
    await pool.query(
      `INSERT INTO media_ticket_features (ticket_id, feature_text, sort_order)
       VALUES ($1, $2, $3)`,
      [ticketId, feature.text, feature.sortOrder]
    );
  }
}

async function replaceTicketPricePhases(pool, ticketId, phases = []) {
  await pool.query('DELETE FROM media_ticket_price_phases WHERE ticket_id = $1', [ticketId]);
  if (!phases.length) return;
  for (const phase of phases) {
    await pool.query(
      `INSERT INTO media_ticket_price_phases (
        ticket_id,
        phase,
        start_at,
        end_at,
        current_price,
        price_note
      )
      VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        ticketId,
        phase.phase,
        phase.startAt ? phase.startAt.toISOString().slice(0, 10) : null,
        phase.endAt ? phase.endAt.toISOString().slice(0, 10) : null,
        phase.currentPrice,
        phase.priceNote
      ]
    );
  }
}

function upsertDonation(content, data) {
  const block = ensureBlock(content, 'donation', {
    headline: '',
    description: '',
    amountTitle: '',
    customLabel: '',
    customPlaceholder: '',
    personalTitle: '',
    firstNameLabel: '',
    lastNameLabel: '',
    emailLabel: '',
    submitLabel: '',
    closingText: '',
    amounts: [],
    locale: ''
  });
  block.headline = data.headline || '';
  block.description = data.description || '';
  block.amountTitle = data.amountTitle || '';
  block.customLabel = data.customLabel || '';
  block.customPlaceholder = data.customPlaceholder || '';
  block.personalTitle = data.personalTitle || '';
  block.firstNameLabel = data.firstNameLabel || '';
  block.lastNameLabel = data.lastNameLabel || '';
  block.emailLabel = data.emailLabel || '';
  block.submitLabel = data.submitLabel || '';
  block.closingText = data.closingText || '';
  block.amounts = Array.isArray(data.amounts) ? data.amounts.slice(0, 5) : [];
  block.locale = data.locale || block.locale || '';
}

function upsertTeamAbout(content, data) {
  const block = ensureBlock(content, 'teamAbout', { headline: '', text: '' });
  block.headline = data.headline || '';
  block.text = data.text || '';
}

function upsertSponsorHero(content, data) {
  const block = ensureBlock(content, 'sponsorHero', { title: '', subtitle: '' });
  block.title = data.title || '';
  block.subtitle = data.subtitle || '';
}

function upsertSponsorsSection(content, data) {
  const block = ensureBlock(content, 'sponsors', { headline: '', text: '' });
  block.headline = data.headline || '';
  block.text = data.text || '';
}

const WELCOME_LINK_DEFAULTS = [
  { href: '#news', label: 'News' },
  { href: '#online-tickets', label: 'Online-Tickets' },
  { href: '#kino-tickets', label: 'Kino-Tickets' },
  { href: '#programm', label: 'Programm' }
];

const VIDEO_CATEGORY_DEFAULTS = ['Alle Filme', 'Fokus', 'Featured', 'Dokumentar', 'Kurzfilm', 'Kinder'];

function mergeWelcomeLinks(existingLinks = []) {
  return WELCOME_LINK_DEFAULTS.map((defaults, index) => {
    const existing = existingLinks[index] || {};
    return {
      href: existing.href || defaults.href,
      label: existing.label || defaults.label,
      enabled: typeof existing.enabled === 'boolean' ? existing.enabled : true
    };
  });
}

function upsertWelcome(content, data) {
  const block = ensureBlock(content, 'welcome', {
    headline: '',
    links: mergeWelcomeLinks([]),
    media: { src: '', type: '' }
  });
  const baseLinks = mergeWelcomeLinks(block.links || []);
  const updatedLinks = baseLinks.map((link, index) => ({
    href: link.href,
    label: data.links?.[index]?.label ?? '',
    enabled: data.links?.[index]?.enabled ?? false
  }));
  block.headline = data.headline || '';
  block.links = updatedLinks;
  if (data.media) {
    block.media = data.media;
    block.video = data.media.type === 'video' ? { src: data.media.src } : { src: '' };
  } else if (block.video?.src && !block.media?.src) {
    block.media = { src: block.video.src, type: 'video' };
  }
}


function upsertFaq(content, items) {
  const block = ensureBlock(content, 'faq', { items: [] });
  block.items = items;
}

function upsertVideoPage(content, data) {
  const block = ensureBlock(content, 'videoPage', {
    heroMode: 'random',
    heroVideoId: '',
    categories: [...VIDEO_CATEGORY_DEFAULTS]
  });
  block.heroMode = data.heroMode === 'manual' ? 'manual' : 'random';
  block.heroVideoId = data.heroVideoId || '';
  block.categories = Array.isArray(data.categories) && data.categories.length
    ? data.categories
    : [...VIDEO_CATEGORY_DEFAULTS];
}

function parseVideoCategories(value) {
  const raw = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return raw.length ? raw : [...VIDEO_CATEGORY_DEFAULTS];
}

function parseIdList(value) {
  if (!value) return [];
  const ids = Array.isArray(value) ? value : [value];
  return ids
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
}

function parseCommaList(value) {
  if (!value) return [];
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function isUploadAllowed(upload, allow) {
  if (!upload) return false;
  const mime = upload.mimetype || '';
  const type = mime.startsWith('image/') ? 'image' : (mime.startsWith('video/') ? 'video' : '');
  return Boolean(type && allow.includes(type));
}

async function moveUploadToMediaFolder(upload, type) {
  const publicDir = path.resolve(upload.path, '..', '..');
  const targetDir = path.join(
    publicDir,
    type === 'image' ? 'images' : 'video',
    'uploads'
  );
  await fs.mkdir(targetDir, { recursive: true });
  const targetPath = path.join(targetDir, upload.filename);
  if (upload.path !== targetPath) {
    await fs.rename(upload.path, targetPath);
  }
  return {
    targetPath,
    localPath: `/${type === 'image' ? 'images' : 'video'}/uploads/${upload.filename}`
  };
}

async function storeMediaUpload(upload, cloudinary, pool, { allow = ['image', 'video'], alt, showInGallery = false } = {}) {
  if (!upload) return null;
  const mime = upload.mimetype || '';
  const type = mime.startsWith('image/') ? 'image' : (mime.startsWith('video/') ? 'video' : '');
  if (!type || !allow.includes(type)) return null;

  if (pool) {
    const nameCandidates = [upload.originalname, upload.filename]
      .map((name) => String(name || '').trim())
      .filter(Boolean);
    for (const name of nameCandidates) {
      const existing = type === 'image'
        ? await findGalleryImageByName(pool, name)
        : await findGalleryVideoByName(pool, name);
      if (existing) {
        await fs.unlink(upload.path).catch(() => { });
        return {
          src: existing.cloudinary_url || existing.local_path,
          type,
          localPath: existing.local_path
        };
      }
    }
  }

  const { targetPath, localPath } = await moveUploadToMediaFolder(upload, type);
  const uploadOptions = {
    resource_type: type,
    folder: `uploads/${type === 'image' ? 'images' : 'videos'}`,
    quality: 'auto'
  };
  if (type === 'image') {
    uploadOptions.fetch_format = 'auto';
  }

  let uploadResult = null;
  try {
    uploadResult = await cloudinary.uploader.upload(targetPath, uploadOptions);
  } catch (error) {
    uploadResult = null;
  }
  const cloudinaryUrl = uploadResult?.secure_url || '';
  const cloudinaryPublicId = uploadResult?.public_id || '';

  if (pool) {
    const altText = String(alt || upload.originalname || upload.filename || '').trim();
    const baseData = {
      filename: upload.filename,
      originalName: upload.originalname,
      localPath,
      cloudinaryUrl: cloudinaryUrl || null,
      cloudinaryPublicId: cloudinaryPublicId || null,
      width: uploadResult?.width || null,
      height: uploadResult?.height || null,
      sizeBytes: upload.size,
      altDe: altText,
      altEn: altText,
      altKu: altText,
      showInGallery
    };
    if (type === 'image') {
      await createGalleryImage(pool, baseData);
    } else {
      await createGalleryVideo(pool, baseData);
    }
  }
  return {
    src: cloudinaryUrl || localPath,
    type,
    localPath
  };
}

async function resolveGallerySelection(pool, { imageId, videoId }) {
  const video = Number.isFinite(videoId) && videoId > 0
    ? await getGalleryVideoById(pool, videoId)
    : null;
  if (video) {
    return {
      src: video.cloudinary_url || video.local_path,
      type: 'video'
    };
  }
  const image = Number.isFinite(imageId) && imageId > 0
    ? await getGalleryImageById(pool, imageId)
    : null;
  if (image) {
    return {
      src: image.cloudinary_url || image.local_path,
      type: 'image'
    };
  }
  return null;
}

function defaultTicketVisibility(ticket) {
  return {
    showOnline: ['online', 'combo'].includes(ticket.ticket_type),
    showKino: ['kino', 'combo'].includes(ticket.ticket_type)
  };
}

function buildVideoPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const block = getBlock(content, 'videoPage') || {};
  const categories = Array.isArray(block.categories) && block.categories.length
    ? block.categories
    : [...VIDEO_CATEGORY_DEFAULTS];

  return {
    heroMode: block.heroMode === 'manual' ? 'manual' : 'random',
    heroVideoId: block.heroVideoId || '',
    categories
  };
}

function parseFaqEntries(entries) {
  return entries
    .map(({ question, answer }) => ({ q: question, a: answer }))
    .filter((item) => item.q || item.a);
}

function resolveLocaleKey(locale = '') {
  const normalized = locale.toLowerCase();
  if (normalized.startsWith('de')) return 'de';
  if (normalized.startsWith('en')) return 'en';
  if (normalized.startsWith('ku')) return 'ku';
  return null;
}

function parseJsonList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeMediaUrlList(items = []) {
  if (!Array.isArray(items)) return [];
  return items
    .map((item) => (typeof item === 'string' ? item : item?.url))
    .filter(Boolean);
}

function normalizeUploads(upload) {
  if (!upload) return [];
  return Array.isArray(upload) ? upload : [upload];
}

function buildLocaleData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const hero = getBlock(content, 'hero') || {};
  const richText = getBlock(content, 'richText') || {};
  const welcome = getBlock(content, 'welcome') || {};
  const news = getBlock(content, 'artikelSection') || {};
  const videos = getBlock(content, 'mediaVideos') || {};
  const tickets = getBlock(content, 'mediaTickets') || getBlock(content, 'imageText') || {};
  const faq = getBlock(content, 'faq') || { items: [] };
  const faqItems = Array.isArray(faq.items) ? faq.items : [];
  const welcomeLinks = mergeWelcomeLinks(Array.isArray(welcome.links) ? welcome.links : []);
  const welcomeMedia = welcome.media || {};
  const legacyVideo = welcome.video || {};

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    h1: hero.headline || '',
    date: hero.subline || '',
    focus: hero.focus || '',
    description: stripTags(richText.html || ''),
    welcome: {
      headline: welcome.headline || '',
      mediaSrc: welcomeMedia.src || legacyVideo.src || '',
      mediaType: welcomeMedia.type || '',
      links: welcomeLinks.map((link) => ({
        label: link.label || '',
        enabled: link.enabled !== false
      }))
    },
    news: {
      title: news.headline || '',
      description: news.text || ''
    },
    videos: {
      title: videos.headline || '',
      description: videos.text || ''
    },
    tickets: {
      title: tickets.headline || tickets.title || '',
      description: tickets.text || ''
    },
    faq: faqItems.map((item) => ({
      question: item?.q || '',
      answer: item?.a || ''
    }))
  };
}

function buildBasicPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const hero = getBlock(content, 'hero') || {};
  const richText = getBlock(content, 'richText') || {};
  const faq = getBlock(content, 'faq') || { items: [] };
  const faqItems = Array.isArray(faq.items) ? faq.items : [];

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    h1: hero.headline || '',
    subline: hero.subline || '',
    focus: hero.focus || '',
    description: stripTags(richText.html || ''),
    faq: faqItems.map((item) => ({
      question: item?.q || '',
      answer: item?.a || ''
    }))
  };
}

function buildDonationPageData(page) {
  const content = normalizeContentValue(page?.content);
  const donationBlock = getBlock(content, 'donation');
  const donation = donationBlock || content.find((block) => {
    if (!block || typeof block !== 'object' || block.type === 'donation') return false;
    return 'headline' in block
      || 'amountTitle' in block
      || 'personalTitle' in block
      || 'amounts' in block;
  }) || {};

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    headline: donation.headline || '',
    description: donation.description || '',
    amountTitle: donation.amountTitle || '',
    customLabel: donation.customLabel || '',
    customPlaceholder: donation.customPlaceholder || '',
    personalTitle: donation.personalTitle || '',
    firstNameLabel: donation.firstNameLabel || '',
    lastNameLabel: donation.lastNameLabel || '',
    emailLabel: donation.emailLabel || '',
    submitLabel: donation.submitLabel || '',
    closingText: donation.closingText || '',
    amounts: normalizeDonationAmounts(donation.amounts || [])
  };
}

function buildGalleryPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const gallery = getBlock(content, 'gallery') || {};

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    headline: gallery.headline || '',
    text: gallery.text || ''
  };
}

function buildRahmenplanPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const block = getBlock(content, 'rahmenplan') || {};
  const downloads = Array.isArray(block.downloads) ? block.downloads : [];

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    headline: block.headline || '',
    shortText: block.shortText || '',
    longText: block.longText || '',
    posterSrc: block.poster?.src || '',
    posterAlt: block.poster?.alt || '',
    downloads: downloads.map((item) => ({
      label: item?.label || '',
      url: item?.url || ''
    }))
  };
}

function buildTicketsPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const hero = getBlock(content, 'ticketsHero') || {};
  const section = getBlock(content, 'ticketsSection') || {};
  const kinoHero = hero.kino || {};
  const kinoSection = section.kino || {};
  const faq = getBlock(content, 'faq') || { items: [] };
  const faqItems = Array.isArray(faq.items) ? faq.items : [];

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    h1: kinoHero.title || '',
    subline: kinoHero.text || '',
    focus: kinoSection.headline || '',
    description: kinoSection.text || '',
    faq: faqItems.map((item) => ({
      question: item?.q || '',
      answer: item?.a || ''
    }))
  };
}

function buildTeamPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const hero = getBlock(content, 'hero') || {};
  const about = getBlock(content, 'teamAbout') || {};

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    headline: hero.headline || '',
    subline: hero.subline || '',
    aboutHeadline: about.headline || '',
    aboutText: about.text || ''
  };
}

function buildSponsorPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const hero = getBlock(content, 'sponsorHero') || {};

  return {
    title: page?.title || '',
    metaTitle: page?.meta_title || '',
    meta: page?.meta_description || '',
    heroTitle: hero.title || page?.title || ''
  };
}

function buildNewsPageData(page) {
  const content = Array.isArray(page?.content) ? page.content : [];
  const overview = getBlock(content, 'newsOverview') || getBlock(content, 'artikelSection') || {};
  const newsletter = getBlock(content, 'newsletter') || {};

  return {
    title: page?.title || '',
    meta: page?.meta_description || '',
    overview: {
      headline: overview.headline || '',
      text: overview.text || '',
      buttonLabel: overview.buttonLabel || overview.button_label || ''
    },
    newsletter: {
      headline: newsletter.headline || '',
      text: newsletter.text || '',
      placeholder: newsletter.placeholder || '',
      buttonLabel: newsletter.buttonLabel || newsletter.button_label || '',
      imageSrc: newsletter.image?.src || newsletter.image?.url || newsletter.image_url || '',
      imageAlt: newsletter.image?.alt || newsletter.image_alt || ''
    }
  };
}

function buildFaqEntries(body, localeKey) {
  const entries = [];
  for (let i = 1; i <= 5; i += 1) {
    entries.push({
      question: String(body[`${localeKey}_faq_q${i}`] || '').trim(),
      answer: String(body[`${localeKey}_faq_a${i}`] || '').trim()
    });
  }
  return parseFaqEntries(entries);
}

function buildPrefixedFaqEntries(body, localeKey, prefix) {
  const entries = [];
  for (let i = 1; i <= 5; i += 1) {
    entries.push({
      question: String(body[`${localeKey}_${prefix}_faq_q${i}`] || '').trim(),
      answer: String(body[`${localeKey}_${prefix}_faq_a${i}`] || '').trim()
    });
  }
  return parseFaqEntries(entries);
}

function upsertNewsOverview(content, data) {
  const block = ensureBlock(content, 'newsOverview', { headline: '', text: '', buttonLabel: '' });
  block.headline = data.headline || '';
  block.text = data.text || '';
  block.buttonLabel = data.buttonLabel || '';
}

function upsertNewsletter(content, data) {
  const block = ensureBlock(content, 'newsletter', {
    headline: '',
    text: '',
    placeholder: '',
    buttonLabel: '',
    image: { src: '', alt: '' }
  });
  block.headline = data.headline || '';
  block.text = data.text || '';
  block.placeholder = data.placeholder || '';
  block.buttonLabel = data.buttonLabel || '';
  block.image = {
    src: data.imageSrc || '',
    alt: data.imageAlt || ''
  };
}

function upsertRahmenplan(content, data) {
  const block = ensureBlock(content, 'rahmenplan', {
    headline: '',
    shortText: '',
    longText: '',
    poster: { src: '', alt: '' },
    downloads: []
  });
  block.headline = data.headline || '';
  block.shortText = data.shortText || '';
  block.longText = data.longText || '';
  block.poster = {
    src: data.posterSrc || '',
    alt: data.posterAlt || ''
  };
  block.downloads = Array.isArray(data.downloads) ? data.downloads : [];
}

function resolveLocalAssetPath(localPath) {
  const trimmed = String(localPath || '').replace(/^\/+/, '');
  return path.join(process.cwd(), 'public', trimmed);
}


async function fetchPagesByGroup(pool, group) {
  const { rows } = await pool.query(
    'SELECT id, slug, locale, title, meta_title, meta_description, content FROM pages WHERE i18n_group = $1 ORDER BY locale',
    [group]
  );
  return rows;
}

async function fetchDonationPages(pool) {
  const groups = ['spenden', 'donation', 'spende'];
  for (const group of groups) {
    const rows = await fetchPagesByGroup(pool, group);
    if (rows.length) return rows;
  }
  const { rows } = await pool.query(
    'SELECT id, slug, locale, title, meta_description, content FROM pages WHERE slug = ANY($1) ORDER BY slug',
    [['spende-de', 'spende-en', 'spende-ku']]
  );
  return rows;
}

function mapPagesByLocale(rows = []) {
  return rows.reduce(
    (acc, row) => {
      const localeKey = resolveLocaleFromPage(row);
      if (localeKey) acc[localeKey] = row;
      return acc;
    },
    { de: {}, en: {}, ku: {} }
  );
}

export async function getAdminPanel(req, res, next) {
  try {
    const pool = req.app.get('db');
    const homeRows = await fetchPagesByGroup(pool, 'home');
    const newsRows = await fetchPagesByGroup(pool, 'news');
    let videoRows = await fetchPagesByGroup(pool, 'video');
    if (!videoRows.length) {
      videoRows = await fetchPagesByGroup(pool, 'videos');
    }
    let ticketsRows = await fetchPagesByGroup(pool, 'tickets');
    let onlineRows = await fetchPagesByGroup(pool, 'online-pass');
    const donationRows = await fetchDonationPages(pool);
    const teamRows = await fetchPagesByGroup(pool, 'team');
    const galleryRows = await fetchPagesByGroup(pool, 'gallery');
    const sponsorRows = await fetchPagesByGroup(pool, 'sponsor');
    const rahmenplanRows = await fetchPagesByGroup(pool, 'rahmenplan');

    const { rows: videoOptions } = await pool.query(
      'SELECT id, title, language FROM media_videos ORDER BY published_at DESC, id DESC'
    );

    const [ticketOptionsDe, ticketOptionsEn, ticketOptionsKu] = await Promise.all([
      getAllMediaTickets(pool, 'de'),
      getAllMediaTickets(pool, 'en'),
      getAllMediaTickets(pool, 'ku')
    ]);

    const [ticketSettingsDe, ticketSettingsEn, ticketSettingsKu] = await Promise.all([
      getTicketPageSettings(pool, 'de'),
      getTicketPageSettings(pool, 'en'),
      getTicketPageSettings(pool, 'ku')
    ]);

    const [ticketVisibilityDe, ticketVisibilityEn, ticketVisibilityKu] = await Promise.all([
      getTicketVisibility(pool, 'de'),
      getTicketVisibility(pool, 'en'),
      getTicketVisibility(pool, 'ku')
    ]);

    const homeByLocale = mapPagesByLocale(homeRows);
    const newsByLocale = mapPagesByLocale(newsRows);
    const videoByLocale = mapPagesByLocale(videoRows);
    const ticketsByLocale = mapPagesByLocale(ticketsRows);
    const onlineByLocale = mapPagesByLocale(onlineRows);
    const donationByLocale = mapPagesByLocale(donationRows);
    const teamByLocale = mapPagesByLocale(teamRows);
    const galleryByLocale = mapPagesByLocale(galleryRows);
    const sponsorByLocale = mapPagesByLocale(sponsorRows);
    const rahmenplanByLocale = mapPagesByLocale(rahmenplanRows);

    const sponsors = await getSponsors(pool);

    const [
      teamMembers,
      directors,
      directorOptions,
      galleryImages,
      galleryVideos,
      newsArticleRows,
      mediaVideoRows,
      mediaTicketRows,
      onlineAccessCodes,
      ticketOrdersOverview,
      donations,
      standardKinoTicket,
      newsletterSubscriptionsResult,
      newsletterSettings
    ] = await Promise.all([
      getTeamMembersWithLocales(pool),
      getDirectorsWithLocales(pool),
      getDirectorOptions(pool),
      getGalleryImages(pool),
      getGalleryVideos(pool),
      getNewsArticleGroups(pool),
      getMediaVideoGroups(pool),
      getMediaTicketGroups(pool),
      getOnlineAccessCodes(pool),
      getTicketOrdersAdminOverview(pool),
      getDonationsAdminOverview(pool),
      getStandardKinoTicket(pool),
      pool.query(
        `SELECT id, email, wants_news, wants_video, active, language, token, created_at
         FROM newsletter_subscriptions
         ORDER BY created_at DESC`
      ),
      getNewsletterSettings(pool)
    ]);
    const newsletterSubscriptions = newsletterSubscriptionsResult.rows || [];
    const newsArticleGroups = groupNewsArticles(newsArticleRows);
    const selectedNewsGroupId = Number(req.query?.newsGroupId);
    const selectedNewsGroup = Number.isFinite(selectedNewsGroupId)
      ? newsArticleGroups.find((group) => Number(group.id) === selectedNewsGroupId)
      : null;
    const mediaVideoGroups = groupMediaVideos(mediaVideoRows);
    const selectedMediaGroupId = Number(req.query?.mediaGroupId);
    const selectedMediaGroup = Number.isFinite(selectedMediaGroupId)
      ? mediaVideoGroups.find((group) => Number(group.id) === selectedMediaGroupId)
      : null;
    const mediaTicketGroups = groupMediaTickets(mediaTicketRows);
    const selectedDirectorId = Number(req.query?.directorId);
    const selectedDirector = Number.isFinite(selectedDirectorId)
      ? directors.find((director) => Number(director.id) === selectedDirectorId)
      : null;
    const selectedTicketGroupId = Number(req.query?.ticketGroupId);
    const selectedTicketGroupRows = Number.isFinite(selectedTicketGroupId)
      ? await getMediaTicketsByGroupId(pool, selectedTicketGroupId)
      : [];
    const selectedTicketGroup = selectedTicketGroupRows.length
      ? {
        id: selectedTicketGroupId,
        tickets: selectedTicketGroupRows.reduce((acc, ticket) => {
          acc[ticket.language] = ticket;
          return acc;
        }, {})
      }
      : null;
    const ticketOrders = buildTicketOrderOverview(ticketOrdersOverview);
    const videoOptionsByLocale = videoOptions.reduce((acc, video) => {
      const key = video.language || 'de';
      if (!acc[key]) acc[key] = [];
      acc[key].push(video);
      return acc;
    }, {});

    const directorOptionsByLocale = directorOptions.reduce((acc, director) => {
      const key = director.locale || 'de';
      if (!acc[key]) acc[key] = [];
      acc[key].push(director);
      return acc;
    }, {});

    const ticketOptionsByLocale = {
      de: ticketOptionsDe,
      en: ticketOptionsEn,
      ku: ticketOptionsKu
    };

    const ticketSettingsByLocale = {
      de: ticketSettingsDe,
      en: ticketSettingsEn,
      ku: ticketSettingsKu
    };

    const ticketVisibilityByLocale = {
      de: ticketVisibilityDe,
      en: ticketVisibilityEn,
      ku: ticketVisibilityKu
    };

    return res.render('admin/index', {
      meta: { title: 'Admin Bereich', description: 'Admin Bereich', locale: 'de-DE' },
      schemaGraphJson: '',
      homePageData: {
        de: buildLocaleData(homeByLocale.de),
        en: buildLocaleData(homeByLocale.en),
        ku: buildLocaleData(homeByLocale.ku)
      },
      newsPageData: {
        de: buildNewsPageData(newsByLocale.de),
        en: buildNewsPageData(newsByLocale.en),
        ku: buildNewsPageData(newsByLocale.ku)
      },
      videoPageData: {
        de: buildVideoPageData(videoByLocale.de),
        en: buildVideoPageData(videoByLocale.en),
        ku: buildVideoPageData(videoByLocale.ku)
      },
      videoMetaData: {
        de: buildBasicPageData(videoByLocale.de),
        en: buildBasicPageData(videoByLocale.en),
        ku: buildBasicPageData(videoByLocale.ku)
      },
      ticketsPageData: {
        de: buildTicketsPageData(ticketsByLocale.de),
        en: buildTicketsPageData(ticketsByLocale.en),
        ku: buildTicketsPageData(ticketsByLocale.ku)
      },
      onlineTicketsPageData: {
        de: buildBasicPageData(onlineByLocale.de),
        en: buildBasicPageData(onlineByLocale.en),
        ku: buildBasicPageData(onlineByLocale.ku)
      },
      teamPageData: {
        de: buildTeamPageData(teamByLocale.de),
        en: buildTeamPageData(teamByLocale.en),
        ku: buildTeamPageData(teamByLocale.ku)
      },
      donationPageData: {
        de: buildDonationPageData(donationByLocale.de),
        en: buildDonationPageData(donationByLocale.en),
        ku: buildDonationPageData(donationByLocale.ku)
      },
      galleryPageData: {
        de: buildGalleryPageData(galleryByLocale.de),
        en: buildGalleryPageData(galleryByLocale.en),
        ku: buildGalleryPageData(galleryByLocale.ku)
      },
      sponsorPageData: {
        de: buildSponsorPageData(sponsorByLocale.de),
        en: buildSponsorPageData(sponsorByLocale.en),
        ku: buildSponsorPageData(sponsorByLocale.ku)
      },
      rahmenplanPageData: {
        de: buildRahmenplanPageData(rahmenplanByLocale.de),
        en: buildRahmenplanPageData(rahmenplanByLocale.en),
        ku: buildRahmenplanPageData(rahmenplanByLocale.ku)
      },
      videoOptionsByLocale,
      ticketOptionsByLocale,
      ticketSettingsByLocale,
      ticketVisibilityByLocale,
      teamMembers,
      sponsors,
      galleryImages,
      galleryVideos,
      directors,
      directorOptionsByLocale,
      adminUser: req.session.user,
      newsArticleGroups,
      selectedNewsGroup,
      mediaVideoGroups,
      selectedMediaGroup,
      selectedDirector,
      mediaTicketGroups,
      selectedTicketGroup,
      onlineAccessCodes,
      ticketOrders,
      donations,
      standardKinoTicket,
      newsletterSubscriptions,
      newsletterSettings,
      query: req.query
    });
  } catch (err) {
    return next(err);
  }
}

export async function createOnlineAccessCodeAdminAction(req, res, next) {
  try {
    const pool = req.app.get('db');
    const email = String(req.body?.email || '').trim().toLowerCase();
    const orderInput = String(req.body?.order_id || '').trim();
    const orderId = orderInput ? Number(orderInput) : null;

    if (!email) {
      return res.redirect('/adminbackend?nav=tickets&ticketsTab=onlineaccess&error=online-access&missing=email');
    }
    if (orderInput && !Number.isFinite(orderId)) {
      return res.redirect('/adminbackend?nav=tickets&ticketsTab=onlineaccess&error=online-access&missing=order_id');
    }

    await createOnlineAccessCodeAdmin(pool, {
      orderId,
      email
    });

    return res.redirect('/adminbackend?nav=tickets&ticketsTab=onlineaccess&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function deleteOnlineAccessCodeAdminAction(req, res, next) {
  try {
    const pool = req.app.get('db');
    const codeId = Number(req.params.id);
    if (!Number.isFinite(codeId)) {
      return res.redirect('/adminbackend?nav=tickets&ticketsTab=onlineaccess&error=online-access&missing=code');
    }
    await deleteOnlineAccessCode(pool, codeId);
    return res.redirect('/adminbackend?nav=tickets&ticketsTab=onlineaccess&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createGalleryImageAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const upload = req.files?.gallery_image_file;
    if (!upload) return res.redirect('/adminbackend?error=gallery-image');

    const existing = await findGalleryImageByName(pool, upload.originalname || upload.filename);
    if (existing) {
      await fs.unlink(upload.path).catch(() => { });
      return res.redirect('/adminbackend?tab=gallery&error=gallery-duplicate-image');
    }

    const altDe = String(req.body?.gallery_image_alt_de || '').trim();
    const altEn = String(req.body?.gallery_image_alt_en || '').trim();
    const altKu = String(req.body?.gallery_image_alt_ku || '').trim();
    if (!altDe || !altEn || !altKu) {
      return res.redirect('/adminbackend?tab=gallery&error=gallery-image-alt');
    }

    let uploadResult = null;
    try {
      uploadResult = await cloudinary.uploader.upload(upload.path, {
        resource_type: 'image',
        folder: 'gallery/images',
        quality: 'auto',
        fetch_format: 'auto'
      });
    } catch (error) {
      uploadResult = null;
    }

    await createGalleryImage(pool, {
      filename: upload.filename,
      originalName: upload.originalname,
      localPath: `/images/uploads/${upload.filename}`,
      cloudinaryUrl: uploadResult?.secure_url || null,
      cloudinaryPublicId: uploadResult?.public_id || null,
      width: uploadResult?.width || null,
      height: uploadResult?.height || null,
      sizeBytes: upload.size,
      altDe,
      altEn,
      altKu
    });

    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createGalleryVideoAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const upload = req.files?.gallery_video_file;
    if (!upload) return res.redirect('/adminbackend?error=gallery-video');

    const existing = await findGalleryVideoByName(pool, upload.originalname || upload.filename);
    if (existing) {
      await fs.unlink(upload.path).catch(() => { });
      return res.redirect('/adminbackend?tab=gallery&error=gallery-duplicate-video');
    }

    const altDe = String(req.body?.gallery_video_alt_de || '').trim();
    const altEn = String(req.body?.gallery_video_alt_en || '').trim();
    const altKu = String(req.body?.gallery_video_alt_ku || '').trim();
    if (!altDe || !altEn || !altKu) {
      return res.redirect('/adminbackend?tab=gallery&error=gallery-video-alt');
    }

    let uploadResult = null;
    try {
      uploadResult = await cloudinary.uploader.upload(upload.path, {
        resource_type: 'video',
        folder: 'gallery/videos',
        quality: 'auto'
      });
    } catch (error) {
      uploadResult = null;
    }

    await createGalleryVideo(pool, {
      filename: upload.filename,
      originalName: upload.originalname,
      localPath: `/video/uploads/${upload.filename}`,
      cloudinaryUrl: uploadResult?.secure_url || null,
      cloudinaryPublicId: uploadResult?.public_id || null,
      width: uploadResult?.width || null,
      height: uploadResult?.height || null,
      sizeBytes: upload.size,
      altDe,
      altEn,
      altKu
    });

    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function deleteGalleryImageAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const imageId = Number(req.params.id);
    if (!Number.isFinite(imageId)) {
      return res.redirect('/adminbackend?tab=gallery&error=gallery-image-delete');
    }
    const image = await getGalleryImageById(pool, imageId);
    if (!image) return res.redirect('/adminbackend?tab=gallery&error=gallery-image-missing');

    if (image.cloudinary_public_id) {
      await cloudinary.uploader.destroy(image.cloudinary_public_id, {
        resource_type: 'image',
        invalidate: true
      });
    }
    await fs.unlink(resolveLocalAssetPath(image.local_path)).catch(() => { });
    await deleteGalleryImage(pool, imageId);

    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function deleteGalleryVideoAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const videoId = Number(req.params.id);
    if (!Number.isFinite(videoId)) {
      return res.redirect('/adminbackend?tab=gallery&error=gallery-video-delete');
    }
    const video = await getGalleryVideoById(pool, videoId);
    if (!video) return res.redirect('/adminbackend?tab=gallery&error=gallery-video-missing');

    if (video.cloudinary_public_id) {
      await cloudinary.uploader.destroy(video.cloudinary_public_id, {
        resource_type: 'video',
        invalidate: true
      });
    }
    await fs.unlink(resolveLocalAssetPath(video.local_path)).catch(() => { });
    await deleteGalleryVideo(pool, videoId);

    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryVisibilityAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const imagesInput = req.body?.images && typeof req.body.images === 'object' ? req.body.images : {};
    const videosInput = req.body?.videos && typeof req.body.videos === 'object' ? req.body.videos : {};
    const imageCategoriesInput = req.body?.image_categories && typeof req.body.image_categories === 'object'
      ? req.body.image_categories
      : {};
    const videoCategoriesInput = req.body?.video_categories && typeof req.body.video_categories === 'object'
      ? req.body.video_categories
      : {};
    const [images, videos] = await Promise.all([
      getGalleryImages(pool),
      getGalleryVideos(pool)
    ]);
    const imageMap = new Map(images.map((image) => [String(image.id), image.show_in_gallery]));
    const videoMap = new Map(videos.map((video) => [String(video.id), video.show_in_gallery]));
    const imageCategoryMap = new Map(images.map((image) => [String(image.id), image.gallery_category]));
    const videoCategoryMap = new Map(videos.map((video) => [String(video.id), video.gallery_category]));
    const updates = [];

    for (const [rawId, value] of Object.entries(imagesInput)) {
      const id = normalizeVisibilityKey(rawId);
      if (!imageMap.has(id)) continue;
      const showInGallery = normalizeVisibilityValue(value);
      if (showInGallery !== imageMap.get(id)) {
        updates.push(updateGalleryImageVisibility(pool, Number(id), showInGallery));
      }
    }

    for (const [rawId, value] of Object.entries(videosInput)) {
      const id = normalizeVisibilityKey(rawId);
      if (!videoMap.has(id)) continue;
      const showInGallery = normalizeVisibilityValue(value);
      if (showInGallery !== videoMap.get(id)) {
        updates.push(updateGalleryVideoVisibility(pool, Number(id), showInGallery));
      }
    }

    for (const [rawId, value] of Object.entries(imageCategoriesInput)) {
      const id = normalizeVisibilityKey(rawId);
      if (!imageCategoryMap.has(id)) continue;
      const category = normalizeGalleryCategory(value);
      if (category && category !== imageCategoryMap.get(id)) {
        updates.push(updateGalleryImageCategory(pool, Number(id), category));
      }
    }

    for (const [rawId, value] of Object.entries(videoCategoriesInput)) {
      const id = normalizeVisibilityKey(rawId);
      if (!videoCategoryMap.has(id)) continue;
      const category = normalizeGalleryCategory(value);
      if (category && category !== videoCategoryMap.get(id)) {
        updates.push(updateGalleryVideoCategory(pool, Number(id), category));
      }
    }

    if (updates.length) {
      await Promise.all(updates);
    }

    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryImageSortAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const requestedIds = normalizeSortIds(req.body?.order);
    const images = await getGalleryImages(pool);
    const orderedIds = buildSortedOrderIds(requestedIds, images);
    if (orderedIds.length) {
      await updateGalleryImageSortOrder(pool, orderedIds);
    }
    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryVideoSortAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const requestedIds = normalizeSortIds(req.body?.order);
    const videos = await getGalleryVideos(pool);
    const orderedIds = buildSortedOrderIds(requestedIds, videos);
    if (orderedIds.length) {
      await updateGalleryVideoSortOrder(pool, orderedIds);
    }
    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryImageVisibilityAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const imageId = Number(req.params.id);
    if (!Number.isFinite(imageId)) {
      return res.redirect('/adminbackend?tab=gallery&error=gallery-image-visibility');
    }
    const showInGallery = normalizeVisibilityValue(req.body?.show_in_gallery);
    await updateGalleryImageVisibility(pool, imageId, showInGallery);
    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryVideoVisibilityAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const videoId = Number(req.params.id);
    if (!Number.isFinite(videoId)) {
      return res.redirect('/adminbackend?tab=gallery&error=gallery-video-visibility');
    }
    const showInGallery = normalizeVisibilityValue(req.body?.show_in_gallery);
    await updateGalleryVideoVisibility(pool, videoId, showInGallery);
    return res.redirect('/adminbackend?tab=gallery&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateHomePage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['home']
    );

    const localeMap = {
      'de-DE': 'de',
      'de': 'de',
      'en-US': 'en',
      'en': 'en',
      'ku': 'ku'
    };

    const uploadedMediaByLocale = {};
    const galleryMediaByLocale = {};
    for (const localeKey of ['de', 'en', 'ku']) {
      const upload = req.files?.[`${localeKey}_welcome_media`];
      if (upload) {
        const storedMedia = await storeMediaUpload(upload, cloudinary, pool);
        if (storedMedia) {
          uploadedMediaByLocale[localeKey] = {
            src: storedMedia.src,
            type: storedMedia.type
          };
        }
      }

      const imageId = Number(req.body?.[`${localeKey}_welcome_gallery_image_id`]);
      const videoId = Number(req.body?.[`${localeKey}_welcome_gallery_video_id`]);
      if ((Number.isFinite(imageId) && imageId > 0) || (Number.isFinite(videoId) && videoId > 0)) {
        galleryMediaByLocale[localeKey] = await resolveGallerySelection(pool, { imageId, videoId });
      }
    }

    for (const page of rows) {
      const localeKey = localeMap[page.locale];
      if (!localeKey) continue;

      const title = String(req.body?.[`${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`${localeKey}_meta`] || '').trim();
      const h1 = String(req.body?.[`${localeKey}_h1`] || '').trim();
      const date = String(req.body?.[`${localeKey}_date`] || '').trim();
      const focus = String(req.body?.[`${localeKey}_focus`] || '').trim();
      const description = String(req.body?.[`${localeKey}_description`] || '').trim();

      const newsTitle = String(req.body?.[`${localeKey}_news_title`] || '').trim();
      const newsDescription = String(req.body?.[`${localeKey}_news_description`] || '').trim();
      const videosTitle = String(req.body?.[`${localeKey}_videos_title`] || '').trim();
      const videosDescription = String(req.body?.[`${localeKey}_videos_description`] || '').trim();
      const ticketsTitle = String(req.body?.[`${localeKey}_tickets_title`] || '').trim();
      const ticketsDescription = String(req.body?.[`${localeKey}_tickets_description`] || '').trim();
      const welcomeHeadline = String(req.body?.[`${localeKey}_welcome_headline`] || '').trim();
      const welcomeLinks = [];
      for (let i = 1; i <= 4; i += 1) {
        welcomeLinks.push({
          label: String(req.body?.[`${localeKey}_welcome_link${i}_label`] || '').trim(),
          enabled: req.body?.[`${localeKey}_welcome_link${i}_enabled`] === 'on'
        });
      }

      const faqEntries = buildFaqEntries(req.body || {}, localeKey);

      const content = Array.isArray(page.content) ? [...page.content] : [];

      upsertHero(content, { h1, date, focus });
      upsertRichText(content, description);
      upsertWelcome(content, {
        headline: welcomeHeadline,
        links: welcomeLinks,
        media: uploadedMediaByLocale[localeKey] || galleryMediaByLocale[localeKey] || null
      });
      upsertSection(content, 'artikelSection', { title: newsTitle, description: newsDescription });
      upsertSection(content, 'mediaVideos', { title: videosTitle, description: videosDescription });
      upsertTicketsSection(content, { title: ticketsTitle, description: ticketsDescription });
      upsertFaq(content, faqEntries);

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }
    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateNewsPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['news']
    );

    const uploadedNewsletterImages = {};
    const galleryNewsletterImages = {};
    for (const localeKey of ['de', 'en', 'ku']) {
      const upload = req.files?.[`news_${localeKey}_newsletter_image_file`];
      if (upload) {
        const storedMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
        if (storedMedia?.type === 'image') {
          uploadedNewsletterImages[localeKey] = storedMedia.src;
        }
      }

      const galleryImageId = Number(req.body?.[`news_${localeKey}_newsletter_gallery_image_id`]);
      if (Number.isFinite(galleryImageId) && galleryImageId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryImageId);
        galleryNewsletterImages[localeKey] = galleryImage?.cloudinary_url || galleryImage?.local_path || '';
      }
    }

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`news_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`news_${localeKey}_meta`] || '').trim();
      const overviewHeadline = String(req.body?.[`news_${localeKey}_overview_headline`] || '').trim();
      const overviewText = String(req.body?.[`news_${localeKey}_overview_text`] || '').trim();
      const overviewButtonLabel = String(req.body?.[`news_${localeKey}_overview_button`] || '').trim();

      const newsletterHeadline = String(req.body?.[`news_${localeKey}_newsletter_headline`] || '').trim();
      const newsletterText = String(req.body?.[`news_${localeKey}_newsletter_text`] || '').trim();
      const newsletterPlaceholder = String(req.body?.[`news_${localeKey}_newsletter_placeholder`] || '').trim();
      const newsletterButton = String(req.body?.[`news_${localeKey}_newsletter_button`] || '').trim();
      const newsletterImageAlt = String(req.body?.[`news_${localeKey}_newsletter_image_alt`] || '').trim();

      const content = Array.isArray(page.content) ? [...page.content] : [];
      const existingNewsletter = getBlock(content, 'newsletter');
      const existingNewsletterImage = existingNewsletter?.image?.src
        || existingNewsletter?.image?.url
        || existingNewsletter?.image_url
        || '';
      const newsletterImage = uploadedNewsletterImages[localeKey]
        || galleryNewsletterImages[localeKey]
        || existingNewsletterImage;
      upsertNewsOverview(content, {
        headline: overviewHeadline,
        text: overviewText,
        buttonLabel: overviewButtonLabel
      });
      upsertNewsletter(content, {
        headline: newsletterHeadline,
        text: newsletterText,
        placeholder: newsletterPlaceholder,
        buttonLabel: newsletterButton,
        imageSrc: newsletterImage,
        imageAlt: newsletterImageAlt
      });

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateRahmenplanPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['rahmenplan']
    );

    const posterByLocale = {};
    for (const localeKey of ['de', 'en', 'ku']) {
      const upload = req.files?.[`rahmenplan_${localeKey}_poster_file`];
      if (upload) {
        const storedMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
        if (storedMedia?.src) {
          posterByLocale[localeKey] = {
            src: storedMedia.src,
            alt: upload.originalname || upload.filename || ''
          };
        }
      }

      const galleryImageId = Number(req.body?.[`rahmenplan_${localeKey}_poster_gallery_image_id`]);
      if (!posterByLocale[localeKey] && Number.isFinite(galleryImageId) && galleryImageId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryImageId);
        posterByLocale[localeKey] = {
          src: galleryImage?.cloudinary_url || galleryImage?.local_path || '',
          alt: galleryImage?.alt_text_de || galleryImage?.alt_text_en || galleryImage?.alt_text_ku || ''
        };
      }
    }

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`rahmenplan_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`rahmenplan_${localeKey}_meta`] || '').trim();
      const headline = String(req.body?.[`rahmenplan_${localeKey}_headline`] || '').trim();
      const shortText = String(req.body?.[`rahmenplan_${localeKey}_short_text`] || '').trim();
      const longText = String(req.body?.[`rahmenplan_${localeKey}_long_text`] || '').trim();

      const content = Array.isArray(page.content) ? [...page.content] : [];
      const existingBlock = getBlock(content, 'rahmenplan') || {};
      const existingPoster = existingBlock?.poster || {};

      const downloads = [];
      const indexSet = new Set();
      Object.keys(req.body || {}).forEach((key) => {
        const match = key.match(new RegExp(`^rahmenplan_${localeKey}_download_(?:label|url)_(\\d+)$`));
        if (match) indexSet.add(Number(match[1]));
      });
      Object.keys(req.files || {}).forEach((key) => {
        const match = key.match(new RegExp(`^rahmenplan_${localeKey}_download_file_(\\d+)$`));
        if (match) indexSet.add(Number(match[1]));
      });
      Array.from(indexSet)
        .filter(Number.isFinite)
        .sort((a, b) => a - b)
        .forEach((index) => {
          const label = String(req.body?.[`rahmenplan_${localeKey}_download_label_${index}`] || '').trim();
          const existingUrl = String(req.body?.[`rahmenplan_${localeKey}_download_url_${index}`] || '').trim();
          const upload = req.files?.[`rahmenplan_${localeKey}_download_file_${index}`];
          const uploadUrl = upload?.filename ? `/Downloads/${upload.filename}` : '';
          const url = uploadUrl || existingUrl;
          if (!label && !url) return;
          downloads.push({
            label: label || upload?.originalname || existingUrl || '',
            url
          });
        });

      const poster = posterByLocale[localeKey]
        || (existingPoster?.src ? existingPoster : null)
        || { src: '', alt: '' };

      upsertRahmenplan(content, {
        headline,
        shortText,
        longText,
        posterSrc: poster?.src || '',
        posterAlt: poster?.alt || '',
        downloads
      });

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateGalleryPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['gallery']
    );

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`gallery_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`gallery_${localeKey}_meta`] || '').trim();
      const headline = String(req.body?.[`gallery_${localeKey}_headline`] || '').trim();
      const text = String(req.body?.[`gallery_${localeKey}_text`] || '').trim();

      const content = Array.isArray(page.content) ? [...page.content] : [];
      upsertGallerySection(content, { headline, text });

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateVideoPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    let { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['video']
    );
    if (!rows.length) {
      const fallback = await pool.query(
        'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
        ['videos']
      );
      rows = fallback.rows;
    }

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`video_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`video_${localeKey}_meta`] || '').trim();
      const heroMode = String(req.body?.[`${localeKey}_video_hero_mode`] || '').trim();
      const heroVideoId = String(req.body?.[`${localeKey}_video_hero_id`] || '').trim();
      const categoriesInput = String(req.body?.[`${localeKey}_video_categories`] || '').trim();
      const categories = parseVideoCategories(categoriesInput);

      const content = Array.isArray(page.content) ? [...page.content] : [];
      upsertVideoPage(content, { heroMode, heroVideoId, categories });

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateTeamPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['team']
    );

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`team_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`team_${localeKey}_meta`] || '').trim();
      const headline = String(req.body?.[`team_${localeKey}_headline`] || '').trim();
      const subline = String(req.body?.[`team_${localeKey}_subline`] || '').trim();
      const aboutHeadline = String(req.body?.[`team_${localeKey}_about_headline`] || '').trim();
      const aboutText = String(req.body?.[`team_${localeKey}_about_text`] || '').trim();

      const content = Array.isArray(page.content) ? [...page.content] : [];
      const hero = ensureBlock(content, 'hero', { headline: '', subline: '', focus: '' });
      hero.headline = headline || '';
      hero.subline = subline || '';

      upsertTeamAbout(content, { headline: aboutHeadline, text: aboutText });

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateSponsorPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['sponsor']
    );

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const metaTitle = String(req.body?.[`sponsor_${localeKey}_meta_title`] || '').trim();
      const metaDescription = String(req.body?.[`sponsor_${localeKey}_meta`] || '').trim();
      const title = String(req.body?.[`sponsor_${localeKey}_title`] || '').trim();

      const content = Array.isArray(page.content) ? [...page.content] : [];
      upsertSponsorHero(content, { title, subtitle: '' });

      await pool.query(
        'UPDATE pages SET title = $1, meta_title = $2, meta_description = $3, content = $4 WHERE id = $5',
        [title || null, metaTitle || null, metaDescription || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createNewsArticleAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const newsGroupId = await getNextNewsGroupId(pool);
    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];
    const missingLocales = [];
    const missingFieldSummaries = [];
    const draftLocales = [];

    for (const locale of locales) {
      const prefix = `article_${locale.key}_`;
      const title = String(req.body?.[`${prefix}title`] || '').trim();
      const meta = String(req.body?.[`${prefix}meta`] || '').trim();
      const h1 = String(req.body?.[`${prefix}h1`] || '').trim();
      const introTitle = String(req.body?.[`${prefix}intro_title`] || '').trim();
      const introDescription = String(req.body?.[`${prefix}intro_description`] || '').trim();
      const bodyTitle = String(req.body?.[`${prefix}body_title`] || '').trim();
      const bodyText = String(req.body?.[`${prefix}body_text`] || '').trim();
      const introUpload = req.files?.[`${prefix}intro_media`];
      const introUploadValid = isUploadAllowed(introUpload, ['image', 'video']);
      const introImageId = Number(req.body?.[`${prefix}intro_gallery_image_id`]);
      const introVideoId = Number(req.body?.[`${prefix}intro_gallery_video_id`]);
      const gallerySelection = parseJsonList(req.body?.[`${prefix}gallery_items`]);
      const galleryUploads = normalizeUploads(req.files?.[`${prefix}gallery_uploads`]);

      const hasIntroMedia = Boolean(introUploadValid || introImageId || introVideoId);
      const hasAnyContent = Boolean(
        title
        || meta
        || h1
        || introTitle
        || introDescription
        || bodyTitle
        || bodyText
        || hasIntroMedia
        || gallerySelection.length
        || galleryUploads.length
      );

      if (!hasAnyContent) continue;

      const missingRequired = !title
        || !meta
        || !h1
        || !introTitle
        || !introDescription
        || !bodyTitle
        || !bodyText
        || !hasIntroMedia;

      if (missingRequired) {
        missingLocales.push(locale.label);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        title,
        meta,
        h1,
        introTitle,
        introDescription,
        bodyTitle,
        bodyText,
        introUpload: introUploadValid ? introUpload : null,
        introImageId,
        introVideoId,
        gallerySelection,
        galleryUploads
      });
    }

    if (missingLocales.length) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      return res.redirect(`/adminbackend?nav=articles&error=article-required&missing=${missingParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect('/adminbackend?nav=articles&error=article-empty');
    }

    for (const localeData of draftLocales) {
      if (!localeData.introUpload
        && (Number.isFinite(localeData.introImageId) || Number.isFinite(localeData.introVideoId))) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.introImageId,
          videoId: localeData.introVideoId
        });
        if (!selection?.src) {
          return res.redirect('/adminbackend?nav=articles&error=article-media');
        }
        localeData.introSelection = selection;
      }
    }

    for (const localeData of draftLocales) {
      let introMedia = null;
      if (localeData.introUpload) {
        introMedia = await storeMediaUpload(localeData.introUpload, cloudinary, pool);
      } else if (localeData.introSelection) {
        introMedia = localeData.introSelection;
      }
      if (!introMedia?.src) {
        return res.redirect('/adminbackend?nav=articles&error=article-media');
      }

      const galleryItems = [];
      const usedUploads = new Set();

      for (const item of localeData.gallerySelection) {
        if (item?.source === 'upload') {
          const uploadIndex = Number(item.uploadIndex);
          const upload = Number.isFinite(uploadIndex)
            ? localeData.galleryUploads[uploadIndex]
            : null;
          if (upload) {
            const uploadMedia = await storeMediaUpload(upload, cloudinary, pool);
            if (uploadMedia?.src) {
              galleryItems.push({
                type: uploadMedia.type,
                url: uploadMedia.src,
                alt: localeData.title
              });
              usedUploads.add(uploadIndex);
            }
          }
          continue;
        }
        if (!item?.url || !item?.type) continue;
        galleryItems.push({
          type: item.type,
          url: item.url,
          alt: item.alt || localeData.title
        });
      }

      const remainingUploads = localeData.galleryUploads.filter((_, index) => !usedUploads.has(index));
      for (const upload of remainingUploads) {
        const uploadMedia = await storeMediaUpload(upload, cloudinary, pool);
        if (uploadMedia?.src) {
          galleryItems.push({
            type: uploadMedia.type,
            url: uploadMedia.src,
            alt: localeData.title
          });
        }
      }

      const normalizedGallery = galleryItems.filter((item) => item?.url && item?.type);

      await createNewsArticle(pool, {
        newsGroupId,
        title: localeData.title,
        h1Title: localeData.h1,
        metaDescription: localeData.meta,
        descriptionShort: localeData.introDescription,
        descriptionLong: localeData.bodyText,
        titleImageUrl: introMedia?.src || '',
        titleMediaType: introMedia?.type || 'image',
        h2Title: localeData.introTitle,
        articleText: localeData.introDescription,
        bodyTitle: localeData.bodyTitle,
        gallery: normalizedGallery,
        language: localeData.locale,
        slug: buildNewsSlug(localeData.locale, localeData.title),
        display: true
      });
    }

    return res.redirect('/adminbackend?nav=articles&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateNewsArticleAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const newsGroupId = Number(req.params.groupId);
    if (!Number.isFinite(newsGroupId)) {
      return res.redirect('/adminbackend?nav=articles&articlesTab=edit&error=article-group');
    }

    const existingArticles = await getNewsArticlesByGroupId(pool, newsGroupId);
    const existingByLocale = existingArticles.reduce((acc, article) => {
      acc[article.language] = article;
      return acc;
    }, {});

    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];
    const missingLocales = [];
    const missingFieldSummaries = [];
    const draftLocales = [];

    for (const locale of locales) {
      const prefix = `article_${locale.key}_`;
      const title = String(req.body?.[`${prefix}title`] || '').trim();
      const meta = String(req.body?.[`${prefix}meta`] || '').trim();
      const h1 = String(req.body?.[`${prefix}h1`] || '').trim();
      const introTitle = String(req.body?.[`${prefix}intro_title`] || '').trim();
      const introDescription = String(req.body?.[`${prefix}intro_description`] || '').trim();
      const bodyTitle = String(req.body?.[`${prefix}body_title`] || '').trim();
      const bodyText = String(req.body?.[`${prefix}body_text`] || '').trim();
      const introUpload = req.files?.[`${prefix}intro_media`];
      const introUploadValid = isUploadAllowed(introUpload, ['image', 'video']);
      const introImageId = Number(req.body?.[`${prefix}intro_gallery_image_id`]);
      const introVideoId = Number(req.body?.[`${prefix}intro_gallery_video_id`]);
      const hasGalleryInput = Object.prototype.hasOwnProperty.call(req.body || {}, `${prefix}gallery_items`);
      const gallerySelection = parseJsonList(req.body?.[`${prefix}gallery_items`]);
      const galleryUploads = normalizeUploads(req.files?.[`${prefix}gallery_uploads`]);
      const existing = existingByLocale[locale.key];

      const hasIntroMedia = Boolean(introUploadValid || introImageId || introVideoId || existing?.title_image_url);
      const hasAnyContent = Boolean(
        title
        || meta
        || h1
        || introTitle
        || introDescription
        || bodyTitle
        || bodyText
        || introUpload
        || introImageId
        || introVideoId
        || gallerySelection.length
        || galleryUploads.length
      );

      if (!hasAnyContent && !existing) continue;

      const missingRequired = !title
        || !meta
        || !h1
        || !introTitle
        || !introDescription
        || !bodyTitle
        || !bodyText
        || !hasIntroMedia;

      if (missingRequired) {
        missingLocales.push(locale.label);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        title,
        meta,
        h1,
        introTitle,
        introDescription,
        bodyTitle,
        bodyText,
        introUpload: introUploadValid ? introUpload : null,
        introImageId,
        introVideoId,
        hasGalleryInput,
        gallerySelection,
        galleryUploads,
        existing
      });
    }

    if (missingLocales.length) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      return res.redirect(`/adminbackend?nav=articles&articlesTab=edit&newsGroupId=${newsGroupId}&error=article-required&missing=${missingParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect(`/adminbackend?nav=articles&articlesTab=edit&newsGroupId=${newsGroupId}&error=article-empty`);
    }

    for (const localeData of draftLocales) {
      if (!localeData.introUpload
        && (Number.isFinite(localeData.introImageId) || Number.isFinite(localeData.introVideoId))) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.introImageId,
          videoId: localeData.introVideoId
        });
        if (!selection?.src) {
          return res.redirect(`/adminbackend?nav=articles&articlesTab=edit&newsGroupId=${newsGroupId}&error=article-media`);
        }
        localeData.introSelection = selection;
      }
    }

    for (const localeData of draftLocales) {
      let introMedia = null;
      if (localeData.introUpload) {
        introMedia = await storeMediaUpload(localeData.introUpload, cloudinary, pool);
      } else if (localeData.introSelection) {
        introMedia = localeData.introSelection;
      } else if (localeData.existing?.title_image_url) {
        introMedia = {
          src: localeData.existing.title_image_url,
          type: localeData.existing.title_media_type || 'image'
        };
      }

      if (!introMedia?.src) {
        return res.redirect(`/adminbackend?nav=articles&articlesTab=edit&newsGroupId=${newsGroupId}&error=article-media`);
      }

      const galleryItems = [];
      const usedUploads = new Set();
      if (localeData.hasGalleryInput) {
        for (const item of localeData.gallerySelection) {
          if (item?.source === 'upload') {
            const uploadIndex = Number(item.uploadIndex);
            const upload = Number.isFinite(uploadIndex)
              ? localeData.galleryUploads[uploadIndex]
              : null;
            if (upload) {
              const uploadMedia = await storeMediaUpload(upload, cloudinary, pool);
              if (uploadMedia?.src) {
                galleryItems.push({
                  type: uploadMedia.type,
                  url: uploadMedia.src,
                  alt: localeData.title
                });
                usedUploads.add(uploadIndex);
              }
            }
            continue;
          }
          if (!item?.url || !item?.type) continue;
          galleryItems.push({
            type: item.type,
            url: item.url,
            alt: item.alt || localeData.title
          });
        }
      }

      const remainingUploads = localeData.galleryUploads.filter((_, index) => !usedUploads.has(index));
      for (const upload of remainingUploads) {
        const uploadMedia = await storeMediaUpload(upload, cloudinary, pool);
        if (uploadMedia?.src) {
          galleryItems.push({
            type: uploadMedia.type,
            url: uploadMedia.src,
            alt: localeData.title
          });
        }
      }

      const normalizedGallery = localeData.hasGalleryInput
        ? galleryItems.filter((item) => item?.url && item?.type)
        : parseJsonList(localeData.existing?.gallery);

      const payload = {
        newsGroupId,
        title: localeData.title,
        h1Title: localeData.h1,
        metaDescription: localeData.meta,
        descriptionShort: localeData.introDescription,
        descriptionLong: localeData.bodyText,
        titleImageUrl: introMedia?.src || '',
        titleMediaType: introMedia?.type || 'image',
        h2Title: localeData.introTitle,
        articleText: localeData.introDescription,
        bodyTitle: localeData.bodyTitle,
        gallery: normalizedGallery,
        language: localeData.locale,
        slug: buildNewsSlug(localeData.locale, localeData.title),
        display: typeof localeData.existing?.display === 'boolean' ? localeData.existing.display : true
      };

      if (localeData.existing?.id) {
        await updateNewsArticle(pool, localeData.existing.id, payload);
      } else {
        await createNewsArticle(pool, payload);
      }
    }

    return res.redirect(`/adminbackend?nav=articles&articlesTab=edit&newsGroupId=${newsGroupId}&saved=1`);
  } catch (err) {
    return next(err);
  }
}

export async function updateNewsArticleActionAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const newsGroupId = Number(req.body?.news_group_id);
    const action = String(req.body?.action || '');
    const rawLanguages = req.body?.languages;
    const languages = Array.isArray(rawLanguages)
      ? rawLanguages
      : rawLanguages
        ? [rawLanguages]
        : [];

    if (!Number.isFinite(newsGroupId) || !languages.length) {
      return res.redirect('/adminbackend?nav=articles&articlesTab=delete&error=article-action');
    }

    if (action === 'visibility') {
      const display = req.body?.visibility === 'show';
      await updateNewsArticleVisibility(pool, newsGroupId, languages, display);
    } else if (action === 'delete') {
      await deleteNewsArticlesByGroup(pool, newsGroupId, languages);
    }

    return res.redirect('/adminbackend?nav=articles&articlesTab=delete&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createMediaVideoAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const mediaGroupId = await getNextMediaVideoGroupId(pool);
    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];
    const missingLocales = [];
    const missingFieldSummaries = [];
    const draftLocales = [];

    for (const locale of locales) {
      const prefix = `film_${locale.key}_`;
      const title = String(req.body?.[`${prefix}title`] || '').trim();
      const description = String(req.body?.[`${prefix}description`] || '').trim();
      const descriptionShort = String(req.body?.[`${prefix}description_short`] || '').trim();
      const category = String(req.body?.[`${prefix}category`] || '').trim();
      const duration = String(req.body?.[`${prefix}duration`] || '').trim();
      const regieIdRaw = String(req.body?.[`${prefix}regie_id`] || '').trim();
      const regieId = regieIdRaw ? Number(regieIdRaw) : null;
      const production = String(req.body?.[`${prefix}production`] || '').trim();
      const languages = parseCommaList(req.body?.[`${prefix}languages`]);
      const videoEmbedInput = String(
        req.body?.[`${prefix}video_embed_code`] || req.body?.[`${prefix}video_url`] || ''
      ).trim();
      const thumbnailUpload = req.files?.[`${prefix}thumbnail_media`];
      const thumbnailUploadValid = isUploadAllowed(thumbnailUpload, ['image']);
      const thumbnailImageIdRaw = String(req.body?.[`${prefix}thumbnail_gallery_image_id`] || '').trim();
      const thumbnailImageId = thumbnailImageIdRaw ? Number(thumbnailImageIdRaw) : null;
      const videoUpload = req.files?.[`${prefix}video_media`];
      const videoUploadValid = isUploadAllowed(videoUpload, ['video']);
      const videoGalleryId = Number(req.body?.[`${prefix}video_gallery_video_id`]);
      const otherImagesField = `${prefix}other_images_items`;
      const otherImagesSelectionProvided = Object.prototype.hasOwnProperty.call(req.body || {}, otherImagesField);
      const otherImagesSelection = parseJsonList(req.body?.[otherImagesField]);
      const otherImagesUploads = normalizeUploads(req.files?.[`${prefix}other_images_uploads`]);

      const hasThumbnail = Boolean(thumbnailUploadValid || Number.isFinite(thumbnailImageId));
      const hasVideo = Boolean(videoEmbedInput || videoUploadValid || videoGalleryId);
      const hasAnyContent = Boolean(
        title
        || description
        || descriptionShort
        || category
        || duration
        || regieIdRaw
        || production
        || languages.length
        || hasThumbnail
        || hasVideo
        || otherImagesSelection.length
        || otherImagesUploads.length
      );

      if (!hasAnyContent) continue;

      const missingFields = [];
      if (!title) missingFields.push('Titel');
      if (!descriptionShort) missingFields.push('Kurzbeschreibung');
      if (!description) missingFields.push('Beschreibung');
      if (!category) missingFields.push('Kategorie');
      if (!duration) missingFields.push('Laufzeit');
      if (!hasThumbnail) missingFields.push('Thumbnail');

      if (missingFields.length) {
        missingLocales.push(locale.label);
        missingFieldSummaries.push(`${locale.label}: ${missingFields.join(', ')}`);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        title,
        description,
        descriptionShort,
        category,
        duration,
        regieId: Number.isFinite(regieId) ? regieId : null,
        production,
        languages,
        videoEmbedInput,
        thumbnailUpload: thumbnailUploadValid ? thumbnailUpload : null,
        thumbnailImageId,
        videoUpload: videoUploadValid ? videoUpload : null,
        videoGalleryId,
        otherImagesSelection,
        otherImagesUploads
      });
    }

    if (missingLocales.length) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      const missingFieldsParam = encodeURIComponent(missingFieldSummaries.join(' | '));
      return res.redirect(`/adminbackend?nav=films&filmsTab=create&error=film-required&missing=${missingParam}&missingFields=${missingFieldsParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect('/adminbackend?nav=films&filmsTab=create&error=film-empty');
    }

    for (const localeData of draftLocales) {
      if (!localeData.thumbnailUpload && Number.isFinite(localeData.thumbnailImageId)) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.thumbnailImageId,
          videoId: null
        });
        if (!selection?.src) {
          return res.redirect('/adminbackend?nav=films&filmsTab=create&error=film-thumbnail');
        }
        localeData.thumbnailSelection = selection;
      }
    }

    for (const localeData of draftLocales) {
      let thumbnailMedia = null;
      if (localeData.thumbnailUpload) {
        thumbnailMedia = await storeMediaUpload(localeData.thumbnailUpload, cloudinary, pool, { allow: ['image'] });
      } else if (localeData.thumbnailSelection) {
        thumbnailMedia = localeData.thumbnailSelection;
      }
      if (!thumbnailMedia?.src) {
        return res.redirect('/adminbackend?nav=films&filmsTab=create&error=film-thumbnail');
      }

      let videoUrl = localeData.videoEmbedInput;
      if (!videoUrl) {
        if (localeData.videoUpload) {
          const videoMedia = await storeMediaUpload(localeData.videoUpload, cloudinary, pool, { allow: ['video'] });
          videoUrl = videoMedia?.src || '';
        } else if (Number.isFinite(localeData.videoGalleryId)) {
          const videoMedia = await resolveGallerySelection(pool, {
            imageId: null,
            videoId: localeData.videoGalleryId
          });
          videoUrl = videoMedia?.src || '';
        }
      }
      if (!videoUrl) {
        videoUrl = '';
      }

      const otherImages = [];
      const usedUploads = new Set();

      for (const item of localeData.otherImagesSelection) {
        if (item?.source === 'upload') {
          const uploadIndex = Number(item.uploadIndex);
          const upload = Number.isFinite(uploadIndex)
            ? localeData.otherImagesUploads[uploadIndex]
            : null;
          if (upload) {
            const uploadMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
            if (uploadMedia?.src) {
              otherImages.push(uploadMedia.src);
              usedUploads.add(uploadIndex);
            }
          }
          continue;
        }
        if (item?.url) {
          otherImages.push(item.url);
        }
      }

      const remainingUploads = localeData.otherImagesUploads.filter((_, index) => !usedUploads.has(index));
      for (const upload of remainingUploads) {
        const uploadMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
        if (uploadMedia?.src) {
          otherImages.push(uploadMedia.src);
        }
      }

      await createMediaVideo(pool, {
        mediaGroupId,
        title: localeData.title,
        description: localeData.description,
        descriptionShort: localeData.descriptionShort,
        category: localeData.category,
        duration: localeData.duration,
        thumbnailUrl: thumbnailMedia?.src || '',
        videoUrl,
        otherImages,
        regie: null,
        regieId: localeData.regieId,
        production: localeData.production,
        languages: localeData.languages,
        language: localeData.locale,
        display: true
      });
    }

    return res.redirect('/adminbackend?nav=films&filmsTab=create&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateMediaVideoAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const mediaGroupId = Number(req.params.groupId);
    if (!Number.isFinite(mediaGroupId)) {
      return res.redirect('/adminbackend?nav=films&filmsTab=edit&error=film-group');
    }

    const existingVideos = await getMediaVideosByGroupId(pool, mediaGroupId);
    const existingByLocale = existingVideos.reduce((acc, video) => {
      acc[video.language] = video;
      return acc;
    }, {});

    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];
    const missingLocales = [];
    const missingFieldSummaries = [];
    const draftLocales = [];

    for (const locale of locales) {
      const prefix = `film_${locale.key}_`;
      const title = String(req.body?.[`${prefix}title`] || '').trim();
      const description = String(req.body?.[`${prefix}description`] || '').trim();
      const descriptionShort = String(req.body?.[`${prefix}description_short`] || '').trim();
      const category = String(req.body?.[`${prefix}category`] || '').trim();
      const duration = String(req.body?.[`${prefix}duration`] || '').trim();
      const regieIdRaw = String(req.body?.[`${prefix}regie_id`] || '').trim();
      const regieId = regieIdRaw ? Number(regieIdRaw) : null;
      const production = String(req.body?.[`${prefix}production`] || '').trim();
      const languages = parseCommaList(req.body?.[`${prefix}languages`]);
      const videoEmbedInput = String(
        req.body?.[`${prefix}video_embed_code`] || req.body?.[`${prefix}video_url`] || ''
      ).trim();
      const thumbnailUpload = req.files?.[`${prefix}thumbnail_media`];
      const thumbnailUploadValid = isUploadAllowed(thumbnailUpload, ['image']);
      const thumbnailImageIdRaw = String(req.body?.[`${prefix}thumbnail_gallery_image_id`] || '').trim();
      const thumbnailImageId = thumbnailImageIdRaw ? Number(thumbnailImageIdRaw) : null;
      const videoUpload = req.files?.[`${prefix}video_media`];
      const videoUploadValid = isUploadAllowed(videoUpload, ['video']);
      const videoGalleryId = Number(req.body?.[`${prefix}video_gallery_video_id`]);
      const otherImagesField = `${prefix}other_images_items`;
      const otherImagesSelectionProvided = Object.prototype.hasOwnProperty.call(req.body || {}, otherImagesField);
      const otherImagesSelection = parseJsonList(req.body?.[otherImagesField]);
      const otherImagesUploads = normalizeUploads(req.files?.[`${prefix}other_images_uploads`]);
      const existing = existingByLocale[locale.key];

      const hasThumbnail = Boolean(thumbnailUploadValid || Number.isFinite(thumbnailImageId) || existing?.thumbnail_url);
      const hasAnyContent = Boolean(
        title
        || description
        || descriptionShort
        || category
        || duration
        || regieIdRaw
        || production
        || languages.length
        || thumbnailUploadValid
        || thumbnailImageId
        || videoUploadValid
        || videoGalleryId
        || otherImagesSelection.length
        || otherImagesUploads.length
      );

      if (!hasAnyContent && !existing) continue;

      const missingFields = [];
      if (!title) missingFields.push('Titel');
      if (!descriptionShort) missingFields.push('Kurzbeschreibung');
      if (!description) missingFields.push('Beschreibung');
      if (!category) missingFields.push('Kategorie');
      if (!duration) missingFields.push('Laufzeit');
      if (!hasThumbnail) missingFields.push('Thumbnail');

      if (missingFields.length) {
        missingLocales.push(locale.label);
        missingFieldSummaries.push(`${locale.label}: ${missingFields.join(', ')}`);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        title,
        description,
        descriptionShort,
        category,
        duration,
        regieId: regieIdRaw === '' ? null : (Number.isFinite(regieId) ? regieId : null),
        production,
        languages,
        videoEmbedInput,
        thumbnailUpload: thumbnailUploadValid ? thumbnailUpload : null,
        thumbnailImageId,
        videoUpload: videoUploadValid ? videoUpload : null,
        videoGalleryId,
        otherImagesSelection,
        otherImagesSelectionProvided,
        otherImagesUploads,
        existing
      });
    }

    if (missingLocales.length) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      const missingFieldsParam = encodeURIComponent(missingFieldSummaries.join(' | '));
      return res.redirect(`/adminbackend?nav=films&filmsTab=edit&mediaGroupId=${mediaGroupId}&error=film-required&missing=${missingParam}&missingFields=${missingFieldsParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect(`/adminbackend?nav=films&filmsTab=edit&mediaGroupId=${mediaGroupId}&error=film-empty`);
    }

    for (const localeData of draftLocales) {
      if (!localeData.thumbnailUpload && Number.isFinite(localeData.thumbnailImageId)) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.thumbnailImageId,
          videoId: null
        });
        if (!selection?.src) {
          return res.redirect(`/adminbackend?nav=films&filmsTab=edit&mediaGroupId=${mediaGroupId}&error=film-thumbnail`);
        }
        localeData.thumbnailSelection = selection;
      }
    }

    for (const localeData of draftLocales) {
      let thumbnailUrl = localeData.existing?.thumbnail_url || '';
      if (localeData.thumbnailUpload) {
        const stored = await storeMediaUpload(localeData.thumbnailUpload, cloudinary, pool, { allow: ['image'] });
        if (stored?.src) thumbnailUrl = stored.src;
      } else if (localeData.thumbnailSelection?.src) {
        thumbnailUrl = localeData.thumbnailSelection.src;
      }
      if (!thumbnailUrl) {
        return res.redirect(`/adminbackend?nav=films&filmsTab=edit&mediaGroupId=${mediaGroupId}&error=film-thumbnail`);
      }

      let videoUrl = localeData.videoEmbedInput || localeData.existing?.video_url || '';
      if (!localeData.videoEmbedInput) {
        if (localeData.videoUpload) {
          const stored = await storeMediaUpload(localeData.videoUpload, cloudinary, pool, { allow: ['video'] });
          if (stored?.src) videoUrl = stored.src;
        } else if (Number.isFinite(localeData.videoGalleryId)) {
          const selected = await resolveGallerySelection(pool, { imageId: null, videoId: localeData.videoGalleryId });
          if (selected?.src) videoUrl = selected.src;
        }
      }
      if (!videoUrl) {
        videoUrl = '';
      }

      const usedUploads = new Set();
      const galleryItems = [];

      for (const item of localeData.otherImagesSelection) {
        if (item?.source === 'upload') {
          const uploadIndex = Number(item.uploadIndex);
          const upload = Number.isFinite(uploadIndex)
            ? localeData.otherImagesUploads[uploadIndex]
            : null;
          if (upload) {
            const stored = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
            if (stored?.src) {
              galleryItems.push(stored.src);
              usedUploads.add(uploadIndex);
            }
          }
          continue;
        }
        if (item?.url) galleryItems.push(item.url);
      }

      const remainingUploads = localeData.otherImagesUploads.filter((_, index) => !usedUploads.has(index));
      for (const upload of remainingUploads) {
        const stored = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
        if (stored?.src) galleryItems.push(stored.src);
      }

      const mergedOtherImages = [...galleryItems];
      const finalOtherImages = mergedOtherImages.length
        ? mergedOtherImages
        : (localeData.otherImagesSelectionProvided ? [] : normalizeMediaUrlList(localeData.existing?.other_images));

      const payload = {
        mediaGroupId,
        title: localeData.title,
        description: localeData.description,
        descriptionShort: localeData.descriptionShort,
        category: localeData.category,
        duration: localeData.duration,
        thumbnailUrl,
        videoUrl,
        otherImages: finalOtherImages,
        regie: null,
        regieId: localeData.regieId,
        production: localeData.production,
        languages: localeData.languages,
        language: localeData.locale,
        display: typeof localeData.existing?.display === 'boolean' ? localeData.existing.display : true
      };

      if (localeData.existing?.id) {
        await updateMediaVideo(pool, localeData.existing.id, payload);
      } else {
        await createMediaVideo(pool, payload);
      }
    }

    return res.redirect(`/adminbackend?nav=films&filmsTab=edit&mediaGroupId=${mediaGroupId}&saved=1`);
  } catch (err) {
    return next(err);
  }
}

export async function updateMediaVideoActionAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const mediaGroupId = Number(req.body?.media_group_id);
    const action = String(req.body?.action || '');
    const rawLanguages = req.body?.languages;
    const languages = Array.isArray(rawLanguages)
      ? rawLanguages
      : rawLanguages
        ? [rawLanguages]
        : [];

    if (!Number.isFinite(mediaGroupId) || !languages.length) {
      return res.redirect('/adminbackend?nav=films&filmsTab=delete&error=film-action');
    }

    if (action === 'visibility') {
      const display = req.body?.visibility === 'show';
      await updateMediaVideoVisibility(pool, mediaGroupId, languages, display);
    } else if (action === 'delete') {
      await deleteMediaVideosByGroup(pool, mediaGroupId, languages);
    }

    return res.redirect('/adminbackend?nav=films&filmsTab=delete&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createTeamMemberAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const name = String(req.body?.team_member_name || '').trim();
    if (!name) return res.redirect('/adminbackend?error=team-member');

    // const role = String(req.body?.team_member_role || '').trim();
    // const description = String(req.body?.team_member_description || '').trim();
    const imageAltText = String(req.body?.team_member_image_alt_text || '').trim();
    // const display = req.body?.team_member_display === 'on';
    const upload = req.files?.team_member_image;
    let imageUrl = '';
    if (upload) {
      const storedMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
      if (storedMedia?.type === 'image') {
        imageUrl = storedMedia.src;
      }
    }
    if (!imageUrl) {
      const galleryImageId = Number(req.body?.team_member_gallery_image_id);
      if (Number.isFinite(galleryImageId) && galleryImageId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryImageId);
        imageUrl = galleryImage?.cloudinary_url || galleryImage?.local_path || '';
      }
    }

    const locales = ['de', 'en', 'ku']
      .map((locale) => ({
        locale,
        role: String(req.body?.[`team_member_role_${locale}`] || '').trim(),
        description: String(req.body?.[`team_member_description_${locale}`] || '').trim(),
        display: req.body?.[`team_member_display_${locale}`] === 'on'
      }))
      .filter((localeData) => localeData.locale);

    await createTeamMember(pool, {
      name,
      // role,
      // description,
      imageAltText,
      imageUrl,
      locales
      // display
    });

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateTeamMemberDisplayAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const memberId = Number(req.params.id);
    if (!Number.isFinite(memberId)) return res.redirect('/adminbackend?error=team-member');
    const locale = String(req.body?.locale || 'de');
    if (!['de', 'en', 'ku'].includes(locale)) {
      return res.redirect('/adminbackend?error=team-member');
    }
    const display = req.body?.display === 'on';
    await updateTeamMemberLocaleDisplay(pool, memberId, locale, display);
    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateTeamMemberAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const memberId = Number(req.params.id);
    if (!Number.isFinite(memberId)) return res.redirect('/adminbackend?error=team-member');

    const name = String(req.body?.team_member_name || '').trim();
    if (!name) return res.redirect('/adminbackend?error=team-member');

    const imageAltText = String(req.body?.team_member_image_alt_text || '').trim();
    const upload = req.files?.team_member_image;
    let imageUrl = '';
    if (upload) {
      const storedMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
      if (storedMedia?.type === 'image') {
        imageUrl = storedMedia.src;
      }
    }
    if (!imageUrl) {
      const galleryImageId = Number(req.body?.team_member_gallery_image_id);
      if (Number.isFinite(galleryImageId) && galleryImageId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryImageId);
        imageUrl = galleryImage?.cloudinary_url || galleryImage?.local_path || '';
      }
    }
    if (!imageUrl) {
      imageUrl = String(req.body?.team_member_existing_image || '').trim();
    }

    await updateTeamMemberBase(pool, memberId, { name, imageUrl, imageAltText });

    const locales = ['de', 'en', 'ku'].map((locale) => ({
      locale,
      role: String(req.body?.[`team_member_role_${locale}`] || '').trim(),
      description: String(req.body?.[`team_member_description_${locale}`] || '').trim(),
      display: req.body?.[`team_member_display_${locale}`] === 'on'
    }));

    for (const localeData of locales) {
      await upsertTeamMemberLocale(pool, memberId, localeData);
    }
    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function deleteTeamMemberAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const memberId = Number(req.params.id);
    if (!Number.isFinite(memberId)) return res.redirect('/adminbackend?error=team-member');
    await deleteTeamMember(pool, memberId);
    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createSponsorAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const name = String(req.body?.sponsor_name || '').trim();
    if (!name) return res.redirect('/adminbackend?nav=sponsors&error=sponsor');

    const upload = req.files?.sponsor_image;
    let imageUrl = '';
    if (upload) {
      const storedMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
      if (storedMedia?.type === 'image') {
        imageUrl = storedMedia.src;
      }
    }
    if (!imageUrl) {
      const galleryImageId = Number(req.body?.sponsor_gallery_image_id);
      if (Number.isFinite(galleryImageId) && galleryImageId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryImageId);
        imageUrl = galleryImage?.cloudinary_url || galleryImage?.local_path || '';
      }
    }

    const linkUrl = String(req.body?.sponsor_link || '').trim();
    const descriptionDe = String(req.body?.sponsor_description_de || '').trim();
    const descriptionEn = String(req.body?.sponsor_description_en || '').trim();
    const descriptionKu = String(req.body?.sponsor_description_ku || '').trim();

    await createSponsor(pool, {
      name,
      imageUrl,
      linkUrl: linkUrl || null,
      descriptionDe: descriptionDe || null,
      descriptionEn: descriptionEn || null,
      descriptionKu: descriptionKu || null
    });

    return res.redirect('/adminbackend?nav=sponsors&sponsorsTab=manage&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateSponsorAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const sponsorId = Number(req.params.id);
    if (!Number.isFinite(sponsorId)) return res.redirect('/adminbackend?nav=sponsors&error=sponsor');

    const name = String(req.body?.sponsor_name || '').trim();
    if (!name) return res.redirect('/adminbackend?nav=sponsors&error=sponsor');

    const upload = req.files?.sponsor_image;
    let imageUrl = '';
    if (upload) {
      const storedMedia = await storeMediaUpload(upload, cloudinary, pool, { allow: ['image'] });
      if (storedMedia?.type === 'image') {
        imageUrl = storedMedia.src;
      }
    }
    if (!imageUrl) {
      const galleryImageId = Number(req.body?.sponsor_gallery_image_id);
      if (Number.isFinite(galleryImageId) && galleryImageId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryImageId);
        imageUrl = galleryImage?.cloudinary_url || galleryImage?.local_path || '';
      }
    }
    if (!imageUrl) {
      imageUrl = String(req.body?.sponsor_existing_image || '').trim();
    }

    const linkUrl = String(req.body?.sponsor_link || '').trim();
    const descriptionDe = String(req.body?.sponsor_description_de || '').trim();
    const descriptionEn = String(req.body?.sponsor_description_en || '').trim();
    const descriptionKu = String(req.body?.sponsor_description_ku || '').trim();

    await updateSponsor(pool, sponsorId, {
      name,
      imageUrl,
      linkUrl: linkUrl || null,
      descriptionDe: descriptionDe || null,
      descriptionEn: descriptionEn || null,
      descriptionKu: descriptionKu || null
    });

    return res.redirect('/adminbackend?nav=sponsors&sponsorsTab=manage&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function deleteSponsorAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const sponsorId = Number(req.params.id);
    if (!Number.isFinite(sponsorId)) return res.redirect('/adminbackend?nav=sponsors&error=sponsor');
    await deleteSponsor(pool, sponsorId);
    return res.redirect('/adminbackend?nav=sponsors&sponsorsTab=manage&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createDirectorAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];
    const missingLocales = [];
    const missingFieldSummaries = [];
    const draftLocales = [];

    for (const locale of locales) {
      const prefix = `director_${locale.key}_`;
      const name = String(req.body?.[`${prefix}name`] || '').trim();
      const metaDescription = String(req.body?.[`${prefix}meta`] || '').trim();
      const description = String(req.body?.[`${prefix}description`] || '').trim();
      const backgroundUpload = req.files?.[`${prefix}background_media`];
      const backgroundUploadValid = isUploadAllowed(backgroundUpload, ['image']);
      const backgroundImageId = Number(req.body?.[`${prefix}background_gallery_image_id`]);
      const portraitUpload = req.files?.[`${prefix}portrait_media`];
      const portraitUploadValid = isUploadAllowed(portraitUpload, ['image']);
      const portraitImageId = Number(req.body?.[`${prefix}portrait_gallery_image_id`]);

      const hasAnyContent = Boolean(
        name
        || metaDescription
        || description
        || backgroundUploadValid
        || portraitUploadValid
        || backgroundImageId
        || portraitImageId
      );

      if (!hasAnyContent) continue;

      const missingFields = [];
      if (!name) missingFields.push('Name');
      if (!description) missingFields.push('Beschreibung');
      if (!backgroundUploadValid && !backgroundImageId) missingFields.push('Hintergrundbild');
      if (!portraitUploadValid && !portraitImageId) missingFields.push('Portrait');

      if (missingFields.length) {
        missingLocales.push(locale.label);
        missingFieldSummaries.push(`${locale.label}: ${missingFields.join(', ')}`);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        name,
        metaDescription,
        description,
        backgroundUpload: backgroundUploadValid ? backgroundUpload : null,
        backgroundImageId,
        portraitUpload: portraitUploadValid ? portraitUpload : null,
        portraitImageId
      });
    }

    if (missingLocales.length) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      const missingFieldsParam = encodeURIComponent(missingFieldSummaries.join(' | '));
      return res.redirect(`/adminbackend?nav=directors&directorsTab=create&error=director-required&missing=${missingParam}&missingFields=${missingFieldsParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect('/adminbackend?nav=directors&directorsTab=create&error=director-empty');
    }

    for (const localeData of draftLocales) {
      if (!localeData.backgroundUpload && Number.isFinite(localeData.backgroundImageId)) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.backgroundImageId,
          videoId: null
        });
        if (!selection?.src) {
          return res.redirect('/adminbackend?nav=directors&directorsTab=create&error=director-background');
        }
        localeData.backgroundSelection = selection;
      }
      if (!localeData.portraitUpload && Number.isFinite(localeData.portraitImageId)) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.portraitImageId,
          videoId: null
        });
        if (!selection?.src) {
          return res.redirect('/adminbackend?nav=directors&directorsTab=create&error=director-portrait');
        }
        localeData.portraitSelection = selection;
      }
    }

    const created = await createDirector(pool, { locales: [] });
    if (!created?.id) {
      return res.redirect('/adminbackend?nav=directors&directorsTab=create&error=director-save');
    }

    for (const localeData of draftLocales) {
      let backgroundImageUrl = '';
      if (localeData.backgroundUpload) {
        const stored = await storeMediaUpload(localeData.backgroundUpload, cloudinary, pool, { allow: ['image'] });
        if (stored?.src) backgroundImageUrl = stored.src;
      } else if (localeData.backgroundSelection?.src) {
        backgroundImageUrl = localeData.backgroundSelection.src;
      }

      let portraitImageUrl = '';
      if (localeData.portraitUpload) {
        const stored = await storeMediaUpload(localeData.portraitUpload, cloudinary, pool, { allow: ['image'] });
        if (stored?.src) portraitImageUrl = stored.src;
      } else if (localeData.portraitSelection?.src) {
        portraitImageUrl = localeData.portraitSelection.src;
      }

      if (!backgroundImageUrl || !portraitImageUrl) {
        return res.redirect('/adminbackend?nav=directors&directorsTab=create&error=director-media');
      }

      await upsertDirectorLocale(pool, created.id, {
        locale: localeData.locale,
        name: localeData.name,
        slug: slugifyTitle(localeData.name),
        metaDescription: localeData.metaDescription,
        description: localeData.description,
        backgroundImageUrl,
        portraitImageUrl,
        display: true
      });
    }

    return res.redirect('/adminbackend?nav=directors&directorsTab=create&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateDirectorAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const directorId = Number(req.params.id);
    if (!Number.isFinite(directorId)) {
      return res.redirect('/adminbackend?nav=directors&directorsTab=edit&error=director-id');
    }

    const existingLocales = await getDirectorLocalesByDirectorId(pool, directorId);
    const existingByLocale = existingLocales.reduce((acc, locale) => {
      acc[locale.locale] = locale;
      return acc;
    }, {});

    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];
    const missingLocales = [];
    const missingFieldSummaries = [];
    const draftLocales = [];

    for (const locale of locales) {
      const prefix = `director_${locale.key}_`;
      const existing = existingByLocale[locale.key];
      const name = String(req.body?.[`${prefix}name`] || existing?.name || '').trim();
      const metaDescription = String(req.body?.[`${prefix}meta`] || existing?.meta_description || '').trim();
      const description = String(req.body?.[`${prefix}description`] || existing?.description || '').trim();
      const backgroundUpload = req.files?.[`${prefix}background_media`];
      const backgroundUploadValid = isUploadAllowed(backgroundUpload, ['image']);
      const backgroundImageId = Number(req.body?.[`${prefix}background_gallery_image_id`]);
      const portraitUpload = req.files?.[`${prefix}portrait_media`];
      const portraitUploadValid = isUploadAllowed(portraitUpload, ['image']);
      const portraitImageId = Number(req.body?.[`${prefix}portrait_gallery_image_id`]);

      const hasAnyContent = Boolean(
        name
        || metaDescription
        || description
        || backgroundUploadValid
        || portraitUploadValid
        || backgroundImageId
        || portraitImageId
        || existing
      );

      if (!hasAnyContent) continue;

      const missingFields = [];
      if (!name) missingFields.push('Name');
      if (!description) missingFields.push('Beschreibung');
      if (!backgroundUploadValid && !backgroundImageId && !existing?.background_image_url) {
        missingFields.push('Hintergrundbild');
      }
      if (!portraitUploadValid && !portraitImageId && !existing?.portrait_image_url) {
        missingFields.push('Portrait');
      }

      if (missingFields.length) {
        missingLocales.push(locale.label);
        missingFieldSummaries.push(`${locale.label}: ${missingFields.join(', ')}`);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        name,
        metaDescription,
        description,
        backgroundUpload: backgroundUploadValid ? backgroundUpload : null,
        backgroundImageId,
        portraitUpload: portraitUploadValid ? portraitUpload : null,
        portraitImageId,
        existing
      });
    }

    if (missingLocales.length) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      const missingFieldsParam = encodeURIComponent(missingFieldSummaries.join(' | '));
      return res.redirect(`/adminbackend?nav=directors&directorsTab=edit&directorId=${directorId}&error=director-required&missing=${missingParam}&missingFields=${missingFieldsParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect(`/adminbackend?nav=directors&directorsTab=edit&directorId=${directorId}&error=director-empty`);
    }

    for (const localeData of draftLocales) {
      let backgroundImageUrl = localeData.existing?.background_image_url || '';
      if (localeData.backgroundUpload) {
        const stored = await storeMediaUpload(localeData.backgroundUpload, cloudinary, pool, { allow: ['image'] });
        if (stored?.src) backgroundImageUrl = stored.src;
      } else if (Number.isFinite(localeData.backgroundImageId)) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.backgroundImageId,
          videoId: null
        });
        if (selection?.src) backgroundImageUrl = selection.src;
      }

      let portraitImageUrl = localeData.existing?.portrait_image_url || '';
      if (localeData.portraitUpload) {
        const stored = await storeMediaUpload(localeData.portraitUpload, cloudinary, pool, { allow: ['image'] });
        if (stored?.src) portraitImageUrl = stored.src;
      } else if (Number.isFinite(localeData.portraitImageId)) {
        const selection = await resolveGallerySelection(pool, {
          imageId: localeData.portraitImageId,
          videoId: null
        });
        if (selection?.src) portraitImageUrl = selection.src;
      }

      if (!backgroundImageUrl || !portraitImageUrl) {
        return res.redirect(`/adminbackend?nav=directors&directorsTab=edit&directorId=${directorId}&error=director-media`);
      }

      await upsertDirectorLocale(pool, directorId, {
        locale: localeData.locale,
        name: localeData.name,
        slug: slugifyTitle(localeData.name),
        metaDescription: localeData.metaDescription,
        description: localeData.description,
        backgroundImageUrl,
        portraitImageUrl,
        display: true
      });
    }

    return res.redirect(`/adminbackend?nav=directors&directorsTab=edit&directorId=${directorId}&saved=1`);
  } catch (err) {
    return next(err);
  }
}

export async function deleteDirectorAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const directorId = Number(req.params.id);
    if (!Number.isFinite(directorId)) {
      return res.redirect('/adminbackend?nav=directors&directorsTab=delete&error=director-id');
    }
    await deleteDirector(pool, directorId);
    return res.redirect('/adminbackend?nav=directors&directorsTab=delete&saved=1');
  } catch (err) {
    return next(err);
  }
}

async function updateSimplePageGroup(req, res, next, group, prefix) {
  try {
    const pool = req.app.get('db');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      [group]
    );

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`${prefix}_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`${prefix}_${localeKey}_meta`] || '').trim();
      const h1 = String(req.body?.[`${prefix}_${localeKey}_h1`] || '').trim();
      const subline = String(req.body?.[`${prefix}_${localeKey}_subline`] || '').trim();
      const focus = String(req.body?.[`${prefix}_${localeKey}_focus`] || '').trim();
      const description = String(req.body?.[`${prefix}_${localeKey}_description`] || '').trim();
      const faqEntries = buildPrefixedFaqEntries(req.body || {}, localeKey, prefix);

      const content = Array.isArray(page.content) ? [...page.content] : [];
      upsertHero(content, { h1, date: subline, focus });
      upsertRichText(content, description);
      upsertFaq(content, faqEntries);

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateTicketsPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['tickets']
    );

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`tickets_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`tickets_${localeKey}_meta`] || '').trim();
      const kinoTitle = String(req.body?.[`tickets_${localeKey}_h1`] || '').trim();
      const kinoText = String(req.body?.[`tickets_${localeKey}_subline`] || '').trim();
      const kinoHeadline = String(req.body?.[`tickets_${localeKey}_focus`] || '').trim();
      const kinoDescription = String(req.body?.[`tickets_${localeKey}_description`] || '').trim();
      const kinoFeaturedMode = String(req.body?.[`tickets_${localeKey}_kino_featured_mode`] || '').trim();
      const kinoFeaturedVideoId = String(req.body?.[`tickets_${localeKey}_kino_featured_video`] || '').trim();
      const kinoNowPlayingIds = parseIdList(req.body?.[`tickets_${localeKey}_kino_now_playing_ids`]);
      const kinoUpcomingIds = parseIdList(req.body?.[`tickets_${localeKey}_kino_upcoming_ids`]);
      const kinoUpcomingDate = String(req.body?.[`tickets_${localeKey}_kino_upcoming_date`] || '').trim();
      const faqEntries = buildPrefixedFaqEntries(req.body || {}, localeKey, 'tickets');

      const content = filterContentByTypes(page.content, ['ticketsHero', 'ticketsSection', 'faq']);
      upsertTicketsHeroKino(content, { title: kinoTitle, text: kinoText });
      upsertTicketsSectionKino(content, { headline: kinoHeadline, text: kinoDescription });
      upsertFaq(content, faqEntries);

      const existingSettings = await getTicketPageSettings(pool, localeKey);
      const heroUpload = req.files?.[`tickets_${localeKey}_hero_kino`];
      const galleryHeroId = Number(req.body?.[`tickets_${localeKey}_hero_kino_gallery_image_id`]);
      const storedHero = heroUpload
        ? await storeMediaUpload(heroUpload, cloudinary, pool, { allow: ['image'] })
        : null;
      let heroImageSrc = existingSettings.kino.heroImageSrc;
      if (storedHero?.type === 'image') {
        heroImageSrc = storedHero.src;
      } else if (Number.isFinite(galleryHeroId) && galleryHeroId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryHeroId);
        heroImageSrc = galleryImage?.cloudinary_url || galleryImage?.local_path || heroImageSrc;
      }

      await upsertTicketPageSettings(pool, localeKey, 'kino', {
        heroImageSrc,
        heroImageAlt: kinoTitle || existingSettings.kino.heroImageAlt || '',
        featuredMode: kinoFeaturedMode || existingSettings.kino.featuredMode,
        featuredVideoId: kinoFeaturedVideoId || existingSettings.kino.featuredVideoId,
        nowPlayingIds: kinoNowPlayingIds,
        upcomingIds: kinoUpcomingIds,
        upcomingDate: kinoUpcomingDate
      });

      const ticketOptions = await getAllMediaTickets(pool, localeKey);
      const visibilityMap = await getTicketVisibility(pool, localeKey);
      for (const ticket of ticketOptions) {
        const existingVisibility = visibilityMap[ticket.id] || defaultTicketVisibility(ticket);
        const showKino = req.body?.[`tickets_${localeKey}_ticket_kino_${ticket.id}`] === 'on';
        await upsertTicketVisibility(pool, localeKey, ticket.id, {
          showOnline: existingVisibility.showOnline,
          showKino
        });
      }

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateStandardKinoTicketAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const priceRaw = String(req.body?.standard_kino_price || '').replace(',', '.').trim();
    const preOrderPercentRaw = String(req.body?.standard_kino_preorder_percent || '').replace(',', '.').trim();
    const preOrderEndRaw = String(req.body?.standard_kino_preorder_end || '').trim();
    const earlyPercentRaw = String(req.body?.standard_kino_early_percent || '').replace(',', '.').trim();
    const earlyEndRaw = String(req.body?.standard_kino_early_end || '').trim();

    const basePrice = priceRaw ? Number(priceRaw) : NaN;
    const preOrderPercent = preOrderPercentRaw ? Number(preOrderPercentRaw) : NaN;
    const preOrderEnd = parseDateInput(preOrderEndRaw);
    const earlyPercent = earlyPercentRaw ? Number(earlyPercentRaw) : NaN;
    const earlyEnd = parseDateInput(earlyEndRaw);

    const missingFields = new Set();
    if (!Number.isFinite(basePrice)) missingFields.add('standard_kino_price');
    if (!Number.isFinite(preOrderPercent)) missingFields.add('standard_kino_preorder_percent');
    if (!preOrderEnd) missingFields.add('standard_kino_preorder_end');

    const hasEarlyPercent = Number.isFinite(earlyPercent);
    const hasEarlyEnd = Boolean(earlyEnd);
    if ((hasEarlyPercent && !hasEarlyEnd) || (!hasEarlyPercent && hasEarlyEnd)) {
      if (!hasEarlyPercent) missingFields.add('standard_kino_early_percent');
      if (!hasEarlyEnd) missingFields.add('standard_kino_early_end');
    }

    if (missingFields.size) {
      const missingFieldsParam = encodeURIComponent(Array.from(missingFields).join(','));
      return res.redirect(`/adminbackend?nav=tickets&ticketsTab=standard-kino&error=standard-kino&missingFields=${missingFieldsParam}`);
    }

    const phases = buildTicketPricePhases({
      eventPrice: basePrice,
      preOrderPercent,
      preOrderEnd,
      earlyPercent: Number.isFinite(earlyPercent) ? earlyPercent : null,
      earlyEnd: earlyEnd || null
    });

    await upsertStandardKinoTicket(pool, {
      basePrice,
      phases
    });

    return res.redirect('/adminbackend?nav=tickets&ticketsTab=standard-kino&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function createMediaTicketAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];

    const ticketType = String(req.body?.ticket_type || '').trim();
    const eventPriceRaw = String(req.body?.ticket_event_price || '').replace(',', '.').trim();
    const preOrderPercentRaw = String(req.body?.ticket_preorder_percent || '').replace(',', '.').trim();
    const preOrderEndRaw = String(req.body?.ticket_preorder_end || '').trim();
    const earlyPercentRaw = String(req.body?.ticket_early_percent || '').replace(',', '.').trim();
    const earlyEndRaw = String(req.body?.ticket_early_end || '').trim();

    const eventPrice = eventPriceRaw ? Number(eventPriceRaw) : NaN;
    const preOrderPercent = preOrderPercentRaw ? Number(preOrderPercentRaw) : NaN;
    const preOrderEnd = parseDateInput(preOrderEndRaw);
    const earlyPercent = earlyPercentRaw ? Number(earlyPercentRaw) : NaN;
    const earlyEnd = parseDateInput(earlyEndRaw);

    const missingLocales = [];
    const missingFields = new Set();
    const draftLocales = [];

    if (!ticketType) missingFields.add('ticket_type');
    if (!Number.isFinite(eventPrice)) missingFields.add('ticket_event_price');
    if (!Number.isFinite(preOrderPercent)) missingFields.add('ticket_preorder_percent');
    if (!preOrderEnd) missingFields.add('ticket_preorder_end');

    const hasEarlyPercent = Number.isFinite(earlyPercent);
    const hasEarlyEnd = Boolean(earlyEnd);
    if ((hasEarlyPercent && !hasEarlyEnd) || (!hasEarlyPercent && hasEarlyEnd)) {
      if (!hasEarlyPercent) missingFields.add('ticket_early_percent');
      if (!hasEarlyEnd) missingFields.add('ticket_early_end');
    }

    for (const locale of locales) {
      const prefix = `ticket_${locale.key}_`;
      const title = String(req.body?.[`${prefix}title`] || '').trim();
      const ticketText = String(req.body?.[`${prefix}text`] || '').trim();
      const badgeText = String(req.body?.[`${prefix}badge_text`] || '').trim();
      const badgeBgColor = String(req.body?.[`${prefix}badge_bg_color`] || '').trim();
      const badgeTextColor = String(req.body?.[`${prefix}badge_text_color`] || '').trim();
      const hintText = String(req.body?.[`${prefix}hint_text`] || '').trim();
      const buttonLabel = String(req.body?.[`${prefix}button_label`] || '').trim();
      const buttonUrl = String(req.body?.[`${prefix}button_url`] || '').trim();
      const features = Array.from({ length: 5 }, (_, index) => {
        const value = String(req.body?.[`${prefix}feature_${index + 1}`] || '').trim();
        return value;
      }).filter(Boolean);

      const hasAnyContent = Boolean(
        title
        || ticketText
        || badgeText
        || badgeBgColor
        || badgeTextColor
        || hintText
        || buttonLabel
        || buttonUrl
        || features.length
      );

      if (!hasAnyContent) continue;

      const missingRequired = !title
        || !ticketText
        || !badgeText
        || !badgeBgColor
        || !badgeTextColor
        || !hintText
        || !buttonLabel
        || !buttonUrl;

      if (missingRequired) {
        missingLocales.push(locale.label);
        if (!title) missingFields.add(`${prefix}title`);
        if (!ticketText) missingFields.add(`${prefix}text`);
        if (!badgeText) missingFields.add(`${prefix}badge_text`);
        if (!badgeBgColor) missingFields.add(`${prefix}badge_bg_color`);
        if (!badgeTextColor) missingFields.add(`${prefix}badge_text_color`);
        if (!hintText) missingFields.add(`${prefix}hint_text`);
        if (!buttonLabel) missingFields.add(`${prefix}button_label`);
        if (!buttonUrl) missingFields.add(`${prefix}button_url`);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        title,
        ticketText,
        badgeText,
        badgeBgColor,
        badgeTextColor,
        hintText,
        buttonLabel,
        buttonUrl,
        features
      });
    }

    if (missingLocales.length || missingFields.size) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      const missingFieldsParam = encodeURIComponent(Array.from(missingFields).join(','));
      const errorCode = missingFields.size ? 'ticket-required' : 'ticket-empty';
      return res.redirect(`/adminbackend?nav=tickets&ticketsTab=create&error=${errorCode}&missing=${missingParam}&missingFields=${missingFieldsParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect('/adminbackend?nav=tickets&ticketsTab=create&error=ticket-empty');
    }

    const mediaGroupId = await getNextMediaTicketGroupId(pool);
    const phases = buildTicketPricePhases({
      eventPrice,
      preOrderPercent,
      preOrderEnd,
      earlyPercent: Number.isFinite(earlyPercent) ? earlyPercent : null,
      earlyEnd: earlyEnd || null
    });

    for (const localeData of draftLocales) {
      const slugBase = slugifyTitle(localeData.title) || `ticket-${mediaGroupId}-${localeData.locale}`;
      const slug = `ticket-${ticketType}-${slugBase}-${localeData.locale}`;
      const record = await createMediaTicket(pool, {
        mediaGroupId,
        slug,
        ticketType,
        title: localeData.title,
        ticketText: localeData.ticketText,
        badgeText: localeData.badgeText,
        badgeBgColor: localeData.badgeBgColor,
        badgeTextColor: localeData.badgeTextColor,
        hintText: localeData.hintText,
        buttonLabel: localeData.buttonLabel,
        buttonUrl: localeData.buttonUrl,
        eventPrice,
        active: true,
        sortOrder: 0,
        language: localeData.locale
      });

      if (record?.id) {
        await replaceTicketFeatures(pool, record.id, localeData.features);
        await replaceTicketPricePhases(pool, record.id, phases);
      }
    }

    return res.redirect('/adminbackend?nav=tickets&ticketsTab=create&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateMediaTicketAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const mediaGroupId = Number(req.params.groupId);
    if (!Number.isFinite(mediaGroupId)) {
      return res.redirect('/adminbackend?nav=tickets&ticketsTab=edit&error=ticket-group');
    }

    const existingTickets = await getMediaTicketsByGroupId(pool, mediaGroupId);
    const existingByLocale = existingTickets.reduce((acc, ticket) => {
      acc[ticket.language] = ticket;
      return acc;
    }, {});

    const locales = [
      { key: 'de', label: 'Deutsch' },
      { key: 'en', label: 'Englisch' },
      { key: 'ku', label: 'Kurdisch' }
    ];

    const ticketType = String(req.body?.ticket_type || '').trim();
    const eventPriceRaw = String(req.body?.ticket_event_price || '').replace(',', '.').trim();
    const preOrderPercentRaw = String(req.body?.ticket_preorder_percent || '').replace(',', '.').trim();
    const preOrderEndRaw = String(req.body?.ticket_preorder_end || '').trim();
    const earlyPercentRaw = String(req.body?.ticket_early_percent || '').replace(',', '.').trim();
    const earlyEndRaw = String(req.body?.ticket_early_end || '').trim();

    const eventPrice = eventPriceRaw ? Number(eventPriceRaw) : NaN;
    const preOrderPercent = preOrderPercentRaw ? Number(preOrderPercentRaw) : NaN;
    const preOrderEnd = parseDateInput(preOrderEndRaw);
    const earlyPercent = earlyPercentRaw ? Number(earlyPercentRaw) : NaN;
    const earlyEnd = parseDateInput(earlyEndRaw);

    const missingLocales = [];
    const missingFields = new Set();
    const draftLocales = [];

    if (!ticketType) missingFields.add('ticket_type');
    if (!Number.isFinite(eventPrice)) missingFields.add('ticket_event_price');
    if (!Number.isFinite(preOrderPercent)) missingFields.add('ticket_preorder_percent');
    if (!preOrderEnd) missingFields.add('ticket_preorder_end');

    const hasEarlyPercent = Number.isFinite(earlyPercent);
    const hasEarlyEnd = Boolean(earlyEnd);
    if ((hasEarlyPercent && !hasEarlyEnd) || (!hasEarlyPercent && hasEarlyEnd)) {
      if (!hasEarlyPercent) missingFields.add('ticket_early_percent');
      if (!hasEarlyEnd) missingFields.add('ticket_early_end');
    }

    for (const locale of locales) {
      const prefix = `ticket_${locale.key}_`;
      const title = String(req.body?.[`${prefix}title`] || '').trim();
      const ticketText = String(req.body?.[`${prefix}text`] || '').trim();
      const badgeText = String(req.body?.[`${prefix}badge_text`] || '').trim();
      const badgeBgColor = String(req.body?.[`${prefix}badge_bg_color`] || '').trim();
      const badgeTextColor = String(req.body?.[`${prefix}badge_text_color`] || '').trim();
      const hintText = String(req.body?.[`${prefix}hint_text`] || '').trim();
      const buttonLabel = String(req.body?.[`${prefix}button_label`] || '').trim();
      const buttonUrl = String(req.body?.[`${prefix}button_url`] || '').trim();
      const features = Array.from({ length: 5 }, (_, index) => {
        const value = String(req.body?.[`${prefix}feature_${index + 1}`] || '').trim();
        return value;
      }).filter(Boolean);
      const existing = existingByLocale[locale.key];

      const hasAnyContent = Boolean(
        title
        || ticketText
        || badgeText
        || badgeBgColor
        || badgeTextColor
        || hintText
        || buttonLabel
        || buttonUrl
        || features.length
      );

      if (!hasAnyContent && !existing) continue;

      const missingRequired = !title
        || !ticketText
        || !badgeText
        || !badgeBgColor
        || !badgeTextColor
        || !hintText
        || !buttonLabel
        || !buttonUrl;

      if (missingRequired) {
        missingLocales.push(locale.label);
        if (!title) missingFields.add(`${prefix}title`);
        if (!ticketText) missingFields.add(`${prefix}text`);
        if (!badgeText) missingFields.add(`${prefix}badge_text`);
        if (!badgeBgColor) missingFields.add(`${prefix}badge_bg_color`);
        if (!badgeTextColor) missingFields.add(`${prefix}badge_text_color`);
        if (!hintText) missingFields.add(`${prefix}hint_text`);
        if (!buttonLabel) missingFields.add(`${prefix}button_label`);
        if (!buttonUrl) missingFields.add(`${prefix}button_url`);
        continue;
      }

      draftLocales.push({
        locale: locale.key,
        title,
        ticketText,
        badgeText,
        badgeBgColor,
        badgeTextColor,
        hintText,
        buttonLabel,
        buttonUrl,
        features,
        existing
      });
    }

    if (missingLocales.length || missingFields.size) {
      const missingParam = encodeURIComponent(missingLocales.join(', '));
      const missingFieldsParam = encodeURIComponent(Array.from(missingFields).join(','));
      return res.redirect(`/adminbackend?nav=tickets&ticketsTab=edit&ticketGroupId=${mediaGroupId}&error=ticket-required&missing=${missingParam}&missingFields=${missingFieldsParam}`);
    }

    if (!draftLocales.length) {
      return res.redirect(`/adminbackend?nav=tickets&ticketsTab=edit&ticketGroupId=${mediaGroupId}&error=ticket-empty`);
    }

    const phases = buildTicketPricePhases({
      eventPrice,
      preOrderPercent,
      preOrderEnd,
      earlyPercent: Number.isFinite(earlyPercent) ? earlyPercent : null,
      earlyEnd: earlyEnd || null
    });

    for (const localeData of draftLocales) {
      const slugBase = slugifyTitle(localeData.title) || `ticket-${mediaGroupId}-${localeData.locale}`;
      const slug = `ticket-${ticketType}-${slugBase}-${localeData.locale}`;
      const payload = {
        mediaGroupId,
        slug,
        ticketType,
        title: localeData.title,
        ticketText: localeData.ticketText,
        badgeText: localeData.badgeText,
        badgeBgColor: localeData.badgeBgColor,
        badgeTextColor: localeData.badgeTextColor,
        hintText: localeData.hintText,
        buttonLabel: localeData.buttonLabel,
        buttonUrl: localeData.buttonUrl,
        eventPrice,
        active: typeof localeData.existing?.active === 'boolean' ? localeData.existing.active : true,
        sortOrder: localeData.existing?.sort_order ?? 0,
        language: localeData.locale
      };

      if (localeData.existing?.id) {
        await updateMediaTicket(pool, localeData.existing.id, payload);
        await replaceTicketFeatures(pool, localeData.existing.id, localeData.features);
        await replaceTicketPricePhases(pool, localeData.existing.id, phases);
      } else {
        const record = await createMediaTicket(pool, payload);
        if (record?.id) {
          await replaceTicketFeatures(pool, record.id, localeData.features);
          await replaceTicketPricePhases(pool, record.id, phases);
        }
      }
    }

    return res.redirect(`/adminbackend?nav=tickets&ticketsTab=edit&ticketGroupId=${mediaGroupId}&saved=1`);
  } catch (err) {
    return next(err);
  }
}

export async function updateMediaTicketActionAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const mediaGroupId = Number(req.body?.ticket_group_id);
    const action = String(req.body?.action || '');
    const rawLanguages = req.body?.languages;
    let languages = Array.isArray(rawLanguages)
      ? rawLanguages
      : rawLanguages
        ? [rawLanguages]
        : [];

    if (!languages.length && Number.isFinite(mediaGroupId)) {
      const groupTickets = await getMediaTicketsByGroupId(pool, mediaGroupId);
      languages = groupTickets.map((ticket) => ticket.language).filter(Boolean);
    }

    if (!Number.isFinite(mediaGroupId) || !languages.length) {
      return res.redirect('/adminbackend?nav=tickets&ticketsTab=delete&error=ticket-action');
    }

    if (action === 'visibility') {
      const active = req.body?.visibility === 'show';
      await updateMediaTicketVisibility(pool, mediaGroupId, languages, active);
    } else if (action === 'delete') {
      await deleteMediaTicketsByGroup(pool, mediaGroupId, languages);
    }

    return res.redirect('/adminbackend?nav=tickets&ticketsTab=delete&saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateOnlineTicketsPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const cloudinary = req.app.get('cloudinary');
    const { rows } = await pool.query(
      'SELECT id, locale, content FROM pages WHERE i18n_group = $1',
      ['online-pass']
    );

    for (const page of rows) {
      const localeKey = resolveLocaleKey(page.locale);
      if (!localeKey) continue;

      const title = String(req.body?.[`online_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`online_${localeKey}_meta`] || '').trim();
      const h1 = String(req.body?.[`online_${localeKey}_h1`] || '').trim();
      const subline = String(req.body?.[`online_${localeKey}_subline`] || '').trim();
      const focus = String(req.body?.[`online_${localeKey}_focus`] || '').trim();
      const description = String(req.body?.[`online_${localeKey}_description`] || '').trim();
      const onlineFeaturedMode = String(req.body?.[`online_${localeKey}_online_featured_mode`] || '').trim();
      const onlineFeaturedVideoId = String(req.body?.[`online_${localeKey}_online_featured_video`] || '').trim();
      const onlineVideoIds = parseIdList(req.body?.[`online_${localeKey}_online_video_ids`]);
      const faqEntries = buildPrefixedFaqEntries(req.body || {}, localeKey, 'online');

      const content = Array.isArray(page.content) ? [...page.content] : [];
      upsertHero(content, { h1, date: subline, focus });
      upsertRichText(content, description);
      upsertFaq(content, faqEntries);

      const existingSettings = await getTicketPageSettings(pool, localeKey);
      const heroUpload = req.files?.[`online_${localeKey}_hero_online`];
      const galleryHeroId = Number(req.body?.[`online_${localeKey}_hero_online_gallery_image_id`]);
      const storedHero = heroUpload
        ? await storeMediaUpload(heroUpload, cloudinary, pool, { allow: ['image'] })
        : null;
      let heroImageSrc = existingSettings.online.heroImageSrc;
      if (storedHero?.type === 'image') {
        heroImageSrc = storedHero.src;
      } else if (Number.isFinite(galleryHeroId) && galleryHeroId > 0) {
        const galleryImage = await getGalleryImageById(pool, galleryHeroId);
        heroImageSrc = galleryImage?.cloudinary_url || galleryImage?.local_path || heroImageSrc;
      }

      await upsertTicketPageSettings(pool, localeKey, 'online', {
        heroImageSrc,
        heroImageAlt: h1 || existingSettings.online.heroImageAlt || '',
        featuredMode: onlineFeaturedMode || existingSettings.online.featuredMode,
        featuredVideoId: onlineFeaturedVideoId || existingSettings.online.featuredVideoId,
        videoIds: onlineVideoIds
      });

      const ticketOptions = await getAllMediaTickets(pool, localeKey);
      const visibilityMap = await getTicketVisibility(pool, localeKey);
      for (const ticket of ticketOptions) {
        const existingVisibility = visibilityMap[ticket.id] || defaultTicketVisibility(ticket);
        const showOnline = req.body?.[`online_${localeKey}_ticket_online_${ticket.id}`] === 'on';
        await upsertTicketVisibility(pool, localeKey, ticket.id, {
          showOnline,
          showKino: existingVisibility.showKino
        });
      }

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }

    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}

export async function updateDonationPage(req, res, next) {
  try {
    const pool = req.app.get('db');
    const targetRows = await fetchDonationPages(pool);


    for (const page of targetRows) {
      const localeKey = resolveLocaleFromPage(page);
      if (!localeKey) continue;

      const title = String(req.body?.[`spenden_${localeKey}_title`] || '').trim();
      const meta = String(req.body?.[`spenden_${localeKey}_meta`] || '').trim();
      const headline = String(req.body?.[`spenden_${localeKey}_headline`] || '').trim();
      const description = String(req.body?.[`spenden_${localeKey}_description`] || '').trim();
      const amountTitle = String(req.body?.[`spenden_${localeKey}_amount_title`] || '').trim();
      const customLabel = String(req.body?.[`spenden_${localeKey}_custom_label`] || '').trim();
      const customPlaceholder = String(req.body?.[`spenden_${localeKey}_custom_placeholder`] || '').trim();
      const personalTitle = String(req.body?.[`spenden_${localeKey}_personal_title`] || '').trim();
      const firstNameLabel = String(req.body?.[`spenden_${localeKey}_first_name`] || '').trim();
      const lastNameLabel = String(req.body?.[`spenden_${localeKey}_last_name`] || '').trim();
      const emailLabel = String(req.body?.[`spenden_${localeKey}_email`] || '').trim();
      const submitLabel = String(req.body?.[`spenden_${localeKey}_submit`] || '').trim();
      const closingText = String(req.body?.[`spenden_${localeKey}_closing`] || '').trim();

      const amounts = normalizeDonationAmounts(
        Array.from({ length: 5 }, (_, index) => {
          const row = index + 1;
          const rawValue = String(req.body?.[`spenden_${localeKey}_amount_${row}`] || '')
            .replace(',', '.')
            .trim();
          const parsedValue = rawValue ? Number(rawValue) : '';
          return {
            value: Number.isFinite(parsedValue) ? parsedValue : '',
            enabled: req.body?.[`spenden_${localeKey}_amount_${row}_enabled`] === 'on'
          };
        })
      );

      const content = Array.isArray(page.content) ? [...page.content] : [];
      upsertDonation(content, {
        locale: localeKey,
        headline,
        description,
        amountTitle,
        customLabel,
        customPlaceholder,
        personalTitle,
        firstNameLabel,
        lastNameLabel,
        emailLabel,
        submitLabel,
        closingText,
        amounts
      });

      await pool.query(
        'UPDATE pages SET title = $1, meta_description = $2, content = $3 WHERE id = $4',
        [title || null, meta || null, JSON.stringify(content), page.id]
      );
    }
    return res.redirect('/adminbackend?saved=1');
  } catch (err) {
    return next(err);
  }
}
export async function sendNewsletterAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const title = String(req.body?.newsletter_title || '').trim();
    const content = String(req.body?.newsletter_content || '').trim();
    const wantsNews = req.body?.newsletter_articles === 'on';
    const wantsVideo = req.body?.newsletter_videos === 'on';
    const requestedLanguage = String(req.body?.newsletter_language || 'de-DE').trim();
    const allowedLanguages = new Set(['de-DE', 'en-US', 'ku']);
    const language = allowedLanguages.has(requestedLanguage) ? requestedLanguage : 'de-DE';

    if (!title || !content || (!wantsNews && !wantsVideo)) {
      return res.redirect('/adminbackend?nav=newsletter&newsletterTab=compose&newsletterError=missing');
    }

    const { rows: subscribers } = await pool.query(
      `SELECT DISTINCT ON (email) email
       FROM newsletter_subscriptions
       WHERE active = true
        AND language = $3
        AND (
           ($1::boolean AND wants_news = true)
           OR ($2::boolean AND wants_video = true)
         )
       ORDER BY email, created_at DESC`,
      [wantsNews, wantsVideo, language]
    );

    if (!subscribers.length) {
      return res.redirect('/adminbackend?nav=newsletter&newsletterTab=compose&newsletterError=recipients');
    }

    const settings = await getNewsletterSettings(pool);
    let sentCount = 0;
    let errorCount = 0;

    for (const subscriber of subscribers) {
      try {
        await sendNewsletterMail({
          to: subscriber.email,
          subject: title,
          title,
          content,
          footerHtml: settings.footer_html,
          footerLogoUrl: settings.footer_logo_url,
          footerLogoAlt: settings.footer_logo_alt
        });
        sentCount += 1;
      } catch (error) {
        errorCount += 1;
        console.error('Newsletter send error:', error);
      }
    }

    const status = errorCount > 0 ? 'partial' : 'sent';
    return res.redirect(`/adminbackend?nav=newsletter&newsletterTab=compose&newsletterStatus=${status}&newsletterCount=${sentCount}&newsletterErrors=${errorCount}`);
  } catch (err) {
    return next(err);
  }
}

export async function updateNewsletterFooterAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const settings = await getNewsletterSettings(pool);
    const footerHtml = String(req.body?.newsletter_footer_text || '').trim();
    const logoAlt = String(req.body?.newsletter_footer_logo_alt || '').trim();
    const logoUrlInput = String(req.body?.newsletter_footer_logo_url || '').trim();
    const removeLogo = req.body?.newsletter_footer_logo_remove === 'on';
    const upload = req.files?.newsletter_footer_logo;

    let footerLogoUrl = settings.footer_logo_url || '';
    if (removeLogo) footerLogoUrl = '';
    if (logoUrlInput) footerLogoUrl = logoUrlInput;
    if (upload?.filename) {
      footerLogoUrl = `/images/uploads/${upload.filename}`;
    }

    await pool.query(
      `INSERT INTO newsletter_settings (id, footer_html, footer_logo_url, footer_logo_alt)
       VALUES (1, $1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET
         footer_html = EXCLUDED.footer_html,
         footer_logo_url = EXCLUDED.footer_logo_url,
         footer_logo_alt = EXCLUDED.footer_logo_alt,
         updated_at = now()`,
      [footerHtml, footerLogoUrl || null, logoAlt || null]
    );

    return res.redirect('/adminbackend?nav=newsletter&newsletterTab=footer&newsletterFooter=success');
  } catch (err) {
    return next(err);
  }
}

export async function renderDonationReceiptAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const donationId = Number(req.params.id);
    if (!Number.isFinite(donationId)) {
      return res.status(404).send('Spende nicht gefunden.');
    }

    const donation = await getDonationById(pool, donationId);
    if (!donation) {
      return res.status(404).send('Spende nicht gefunden.');
    }

    return res.render('admin/donation-receipt', {
      donation,
      receiptUrl: `/adminbackend/donations/${donation.id}/receipt.pdf`,
      downloadUrl: `/adminbackend/donations/${donation.id}/receipt.pdf?download=1`
    });
  } catch (err) {
    return next(err);
  }
}

export async function renderDonationReceiptPdfAdmin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const donationId = Number(req.params.id);
    if (!Number.isFinite(donationId)) {
      return res.status(404).send('Spende nicht gefunden.');
    }

    const donation = await getDonationById(pool, donationId);
    if (!donation) {
      return res.status(404).send('Spende nicht gefunden.');
    }

    const pdfBuffer = await generateDonationReceiptPdf({
      donation,
      locale: donation.locale || 'de'
    });
    const filename = `spendenquittung-${donation.id}.pdf`;
    const disposition = req.query?.download ? 'attachment' : 'inline';
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `${disposition}; filename="${filename}"`);
    return res.send(pdfBuffer);
  } catch (err) {
    return next(err);
  }
}