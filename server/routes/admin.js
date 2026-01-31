import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  getAdminPanel,
  createOnlineAccessCodeAdminAction,
  createGalleryImageAdmin,
  createGalleryVideoAdmin,
  createTeamMemberAdmin,
  deleteOnlineAccessCodeAdminAction,
  deleteGalleryImageAdmin,
  deleteGalleryVideoAdmin,
  deleteTeamMemberAdmin,
  createNewsArticleAdmin,
  createMediaVideoAdmin,
  createMediaTicketAdmin,
  updateNewsArticleActionAdmin,
  updateNewsArticleAdmin,
  updateMediaTicketActionAdmin,
  updateMediaTicketAdmin,
  updateMediaVideoActionAdmin,
  updateMediaVideoAdmin,
  updateGalleryVisibilityAdmin,
  updateGalleryImageVisibilityAdmin,
  updateGalleryPage,
  updateGalleryImageSortAdmin,
  updateGalleryVideoSortAdmin,
  updateGalleryVideoVisibilityAdmin,
  updateDonationPage,
  updateHomePage,
  sendNewsletterAdmin,
  updateNewsletterFooterAdmin,
  updateNewsPage,
  updateOnlineTicketsPage,
  updateTeamMemberAdmin,
  updateTeamMemberDisplayAdmin,
  updateTeamPage,
  updateSponsorPage,
  updateRahmenplanPage,
  updateTicketsPage,
  updateVideoPage,
  createDirectorAdmin,
  updateDirectorAdmin,
  deleteDirectorAdmin,
  createSponsorAdmin,
  updateSponsorAdmin,
  deleteSponsorAdmin,
  updateStandardKinoTicketAdmin,
  renderDonationReceiptAdmin,
  renderDonationReceiptPdfAdmin
} from '../controllers/adminController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageUploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
const videoUploadDir = path.join(__dirname, '..', 'public', 'video', 'uploads');
const downloadsUploadDir = path.join(__dirname, '..', 'public', 'Downloads');
fs.mkdirSync(imageUploadDir, { recursive: true });
fs.mkdirSync(videoUploadDir, { recursive: true });
fs.mkdirSync(downloadsUploadDir, { recursive: true });

function splitMultipart(buffer, boundary) {
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  const parts = [];
  let start = buffer.indexOf(boundaryBuffer);
  while (start !== -1) {
    start += boundaryBuffer.length;
    if (buffer[start] === 45 && buffer[start + 1] === 45) break;
    if (buffer[start] === 13 && buffer[start + 1] === 10) start += 2;
    const end = buffer.indexOf(boundaryBuffer, start);
    if (end === -1) break;
    const part = buffer.slice(start, end - 2);
    if (part.length) parts.push(part);
    start = end;
  }
  return parts;
}

function parseMultipart({ targetDir, resolveTargetDir } = {}) {
  return (req, _res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.startsWith('multipart/form-data')) return next();
    const boundaryMatch = contentType.match(/boundary=([^;]+)/i);
    if (!boundaryMatch) return next();

    const boundary = boundaryMatch[1];
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const parts = splitMultipart(buffer, boundary);
      req.body = req.body || {};
      req.files = req.files || {};
      for (const part of parts) {
        const headerEnd = part.indexOf(Buffer.from('\r\n\r\n'));
        if (headerEnd === -1) continue;
        const header = part.slice(0, headerEnd).toString('utf8');
        let body = part.slice(headerEnd + 4);
        if (body.length >= 2 && body.slice(-2).toString() === '\r\n') {
          body = body.slice(0, -2);
        }
        const nameMatch = header.match(/name="([^"]+)"/i);
        if (!nameMatch) continue;
        const field = nameMatch[1];
        const filenameMatch = header.match(/filename="([^"]*)"/i);
        if (filenameMatch) {
          const originalName = filenameMatch[1];
          if (!originalName) continue;
          const ext = path.extname(originalName).toLowerCase();
          const baseName = path.basename(originalName, ext).replace(/[^a-z0-9-_]/gi, '');
          const safeName = baseName || 'welcome-media';
          const storedName = `${safeName}-${Date.now()}${ext}`;
          const mimeMatch = header.match(/Content-Type:\s*([^\r\n]+)/i);
          const mimetype = mimeMatch ? mimeMatch[1] : '';
          const resolvedDir = resolveTargetDir
            ? (resolveTargetDir({ field, mimetype })
              || targetDir
              || (mimetype.startsWith('video/') ? videoUploadDir : imageUploadDir))
            : (targetDir || (mimetype.startsWith('video/') ? videoUploadDir : imageUploadDir));
          const filePath = path.join(resolvedDir, storedName);
          fs.writeFileSync(filePath, body);
          const fileEntry = {
            filename: storedName,
            mimetype,
            originalname: originalName,
            path: filePath,
            size: body.length
          };
          if (req.files[field]) {
            if (Array.isArray(req.files[field])) {
              req.files[field].push(fileEntry);
            } else {
              req.files[field] = [req.files[field], fileEntry];
            }
          } else {
            req.files[field] = fileEntry;
          }
        } else {
          const value = body.toString('utf8');
          if (req.body[field] === undefined) {
            req.body[field] = value;
          } else if (Array.isArray(req.body[field])) {
            req.body[field].push(value);
          } else {
            req.body[field] = [req.body[field], value];
          }
        }
      }
      next();
    });
    req.on('error', next);
  };
}


router.get('/adminbackend', requireAdmin, getAdminPanel);
router.post('/adminbackend/startseite', requireAdmin, parseMultipart(), updateHomePage);
router.post('/adminbackend/news', requireAdmin, parseMultipart({ targetDir: imageUploadDir }), updateNewsPage);
router.post(
  '/adminbackend/rahmenplan',
  requireAdmin,
  parseMultipart({
    resolveTargetDir: ({ field }) => (field?.includes('rahmenplan_') && field.includes('_download_file_') ? downloadsUploadDir : null)
  }),
  updateRahmenplanPage
);
router.post('/adminbackend/gallery-page', requireAdmin, updateGalleryPage);
router.post('/adminbackend/videos', requireAdmin, updateVideoPage);
router.post('/adminbackend/team', requireAdmin, updateTeamPage);
router.post('/adminbackend/sponsor', requireAdmin, updateSponsorPage);
router.post('/adminbackend/tickets', requireAdmin, parseMultipart(), updateTicketsPage);
router.post('/adminbackend/online-tickets', requireAdmin, parseMultipart(), updateOnlineTicketsPage);
router.post('/adminbackend/standard-kino-ticket', requireAdmin, parseMultipart(), updateStandardKinoTicketAdmin);
router.post('/adminbackend/online-access', requireAdmin, createOnlineAccessCodeAdminAction);
router.post('/adminbackend/online-access/:id/delete', requireAdmin, deleteOnlineAccessCodeAdminAction);
router.post('/adminbackend/spenden', requireAdmin, updateDonationPage);
router.post('/adminbackend/newsletter/send', requireAdmin, sendNewsletterAdmin);
router.post(
  '/adminbackend/newsletter/footer',
  requireAdmin,
  parseMultipart({ targetDir: imageUploadDir }),
  updateNewsletterFooterAdmin
);
router.post('/adminbackend/team-members', requireAdmin, parseMultipart(), createTeamMemberAdmin);
router.post('/adminbackend/sponsors', requireAdmin, parseMultipart(), createSponsorAdmin);
router.post(
  '/adminbackend/gallery/images',
  requireAdmin,
  parseMultipart({ targetDir: imageUploadDir }),
  createGalleryImageAdmin
);
router.post(
  '/adminbackend/gallery/videos',
  requireAdmin,
  parseMultipart({ targetDir: videoUploadDir }),
  createGalleryVideoAdmin
);
router.post('/adminbackend/gallery/images/:id/delete', requireAdmin, deleteGalleryImageAdmin);
router.post('/adminbackend/gallery/videos/:id/delete', requireAdmin, deleteGalleryVideoAdmin);
router.post('/adminbackend/gallery/visibility', requireAdmin, updateGalleryVisibilityAdmin);
router.post('/adminbackend/gallery/images/sort', requireAdmin, updateGalleryImageSortAdmin);
router.post('/adminbackend/gallery/images/:id/visibility', requireAdmin, updateGalleryImageVisibilityAdmin);
router.post('/adminbackend/gallery/videos/sort', requireAdmin, updateGalleryVideoSortAdmin);
router.post('/adminbackend/gallery/videos/:id/visibility', requireAdmin, updateGalleryVideoVisibilityAdmin);
router.post('/adminbackend/team-members/:id/display', requireAdmin, updateTeamMemberDisplayAdmin);
router.post('/adminbackend/team-members/:id/update', requireAdmin, parseMultipart(), updateTeamMemberAdmin);
router.post('/adminbackend/sponsors/:id/update', requireAdmin, parseMultipart(), updateSponsorAdmin);
router.post('/adminbackend/team-members/:id/delete', requireAdmin, deleteTeamMemberAdmin);
router.post('/adminbackend/sponsors/:id/delete', requireAdmin, deleteSponsorAdmin);
router.post('/adminbackend/directors', requireAdmin, parseMultipart(), createDirectorAdmin);
router.post('/adminbackend/directors/:id', requireAdmin, parseMultipart(), updateDirectorAdmin);
router.post('/adminbackend/directors/:id/delete', requireAdmin, deleteDirectorAdmin);
router.post('/adminbackend/articles', requireAdmin, parseMultipart(), createNewsArticleAdmin);
router.post('/adminbackend/articles/actions', requireAdmin, updateNewsArticleActionAdmin);
router.post('/adminbackend/articles/:groupId', requireAdmin, parseMultipart(), updateNewsArticleAdmin);
router.post('/adminbackend/films', requireAdmin, parseMultipart(), createMediaVideoAdmin);
router.post('/adminbackend/films/actions', requireAdmin, updateMediaVideoActionAdmin);
router.post('/adminbackend/films/:groupId', requireAdmin, parseMultipart(), updateMediaVideoAdmin);
router.post('/adminbackend/media-tickets', requireAdmin, parseMultipart(), createMediaTicketAdmin);
router.post('/adminbackend/media-tickets/actions', requireAdmin, updateMediaTicketActionAdmin);
router.post('/adminbackend/media-tickets/:groupId', requireAdmin, parseMultipart(), updateMediaTicketAdmin);
router.get('/adminbackend/donations/:id/receipt', requireAdmin, renderDonationReceiptAdmin);
router.get('/adminbackend/donations/:id/receipt.pdf', requireAdmin, renderDonationReceiptPdfAdmin);


export default router;