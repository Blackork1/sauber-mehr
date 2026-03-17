import path from 'path';
import sharp from 'sharp';
import { sendContactAdminMail, sendContactConfirmationMail } from '../services/mailService.js';

function normalizeInput(value) {
  return String(value || '').trim();
}

const MAX_CONTACT_IMAGE_WIDTH = Number(process.env.MAX_CONTACT_IMAGE_WIDTH || 2000);
const CONTACT_IMAGE_QUALITY = Number(process.env.CONTACT_IMAGE_QUALITY || 80);

async function compressContactImage(upload) {
  const sourceBuffer = upload?.buffer;
  if (!Buffer.isBuffer(sourceBuffer) || sourceBuffer.length === 0) {
    throw new Error('Ungültige Bilddaten in Kontaktanfrage.');
  }

  const ext = path.extname(upload.filename || '').toLowerCase();
  const baseName = path.basename(upload.filename, ext);
  const compressedFilename = ext === '.webp'
    ? `${baseName}-compressed.webp`
    : `${baseName}.webp`;
  const { data, info } = await sharp(sourceBuffer)
    .rotate()
    .resize({
      width: MAX_CONTACT_IMAGE_WIDTH,
      fit: 'inside',
      withoutEnlargement: true
    })
    .webp({
      quality: CONTACT_IMAGE_QUALITY,
      effort: 4
    })
    .toBuffer({ resolveWithObject: true });

  return {
    filename: compressedFilename,
    originalName: upload.originalname,
    size: info.size,
    mimetype: 'image/webp',
    content: data
  };
}

export async function getContact(req, res) {
  return res.redirect('/#kontakt');
}

export async function postContact(req, res, next) {
  try {
    const name = normalizeInput(req.body?.name);
    const service = normalizeInput(req.body?.service);
    const area = normalizeInput(req.body?.area);
    const industry = normalizeInput(req.body?.industry);
    const otherDetails = normalizeInput(req.body?.other_details);
    const directEmail = normalizeInput(req.body?.email).toLowerCase();
    let contactMethod = normalizeInput(req.body?.contact_method);
    let contactValue = normalizeInput(req.body?.contact_value);
    if (!contactMethod && directEmail) {
      contactMethod = 'E-Mail';
    }
    if (!contactValue && directEmail) {
      contactValue = directEmail;
    }
    const contactMethodLower = contactMethod.toLowerCase();
    const usesMail = contactMethodLower.includes('mail');
    const email = usesMail ? contactValue.toLowerCase() : directEmail;
    const phone = usesMail ? '' : contactValue;
    const uploads = Array.isArray(req.files?.attachments)
      ? req.files.attachments
      : (req.files?.attachments ? [req.files.attachments] : []);
    const hasFileValidationErrors = Array.isArray(req.fileValidationErrors) && req.fileValidationErrors.length > 0;

    if (!service || !contactMethod || !contactValue || (usesMail && !email)) {
      return res.status(400).send('Bitte alle Pflichtfelder ausfüllen.');
    }

    if (hasFileValidationErrors) {
      return res.status(400).send('Es sind nur Bilddateien erlaubt.');
    }

    const rejectedUploads = uploads.filter((upload) => !String(upload?.mimetype || '').toLowerCase().startsWith('image/'));
    if (rejectedUploads.length) {
      return res.status(400).send('Es sind nur Bilddateien erlaubt.');
    }

    const attachments = await Promise.all(uploads.map((upload) => compressContactImage(upload)));
    const attachmentMeta = attachments.map((item) => ({
      filename: item.filename,
      originalName: item.originalName,
      size: item.size,
      mimetype: item.mimetype
    }));

    const pool = req.app.get('db');
    await pool.query(
      `INSERT INTO contact_requests
        (name, email, phone, contact_method, service, area, industry, other_details, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [name || null, email || null, phone || null, contactMethod || null, service, area || null, industry || null, otherDetails || null, JSON.stringify(attachmentMeta)]
    );

    await sendContactAdminMail({
      to: process.env.CONTACT_ADMIN_TO || 'info@sauber-mehr.de',
      name,
      service,
      area,
      industry,
      otherDetails,
      contactMethod,
      contactValue,
      attachments
    });

    if (email) {
      await sendContactConfirmationMail({
        to: email,
        name,
        service,
        area,
        attachments
      });
    }

    const referer = req.get('referer');
    return res.redirect(referer || '/#kontakt');
  } catch (err) {
    return next(err);
  }
}
