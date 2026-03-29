import path from 'path';
import sharp from 'sharp';
import { sendContactAdminMail, sendContactConfirmationMail } from '../services/mailService.js';

function normalizeInput(value) {
  return String(value || '').trim();
}

function resolveClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }
  return String(req.ip || req.socket?.remoteAddress || '').trim();
}

const MAX_CONTACT_IMAGE_WIDTH = Number(process.env.MAX_CONTACT_IMAGE_WIDTH || 2000);
const CONTACT_IMAGE_QUALITY = Number(process.env.CONTACT_IMAGE_QUALITY || 80);
const RECAPTCHA_ENABLED = String(process.env.RECAPTCHA_ENABLED || 'true') === 'true';
const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const RECAPTCHA_SECRET_KEY = String(process.env.RECAPTCHA_SECRET_KEY || '').trim();
const RECAPTCHA_EXPECTED_ACTION = String(process.env.RECAPTCHA_EXPECTED_ACTION || 'contact_form').trim();
const RECAPTCHA_MIN_SCORE = Number(process.env.RECAPTCHA_MIN_SCORE || 0.5);
const SAFE_RECAPTCHA_MIN_SCORE = Number.isFinite(RECAPTCHA_MIN_SCORE)
  ? Math.min(1, Math.max(0, RECAPTCHA_MIN_SCORE))
  : 0.5;

async function verifyRecaptchaToken(token, remoteIp = '', expectedAction = '') {
  if (!RECAPTCHA_SECRET_KEY) {
    return { success: false, reason: 'missing_secret' };
  }

  const payload = new URLSearchParams();
  payload.set('secret', RECAPTCHA_SECRET_KEY);
  payload.set('response', token);
  if (remoteIp) payload.set('remoteip', remoteIp);

  try {
    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: payload.toString()
    });
    if (!response.ok) {
      return { success: false, reason: 'upstream_status' };
    }
    const data = await response.json();

    if (!data?.success) {
      return {
        success: false,
        reason: 'verification_failed',
        score: typeof data?.score === 'number' ? data.score : null,
        action: typeof data?.action === 'string' ? data.action : '',
        errorCodes: Array.isArray(data?.['error-codes']) ? data['error-codes'] : []
      };
    }

    const responseAction = typeof data?.action === 'string' ? data.action : '';
    if (expectedAction && responseAction !== expectedAction) {
      return {
        success: false,
        reason: 'action_mismatch',
        score: typeof data?.score === 'number' ? data.score : null,
        action: responseAction
      };
    }

    const score = typeof data?.score === 'number' ? data.score : null;
    if (score !== null && score < SAFE_RECAPTCHA_MIN_SCORE) {
      return {
        success: false,
        reason: 'low_score',
        score,
        action: responseAction
      };
    }

    return {
      success: true,
      reason: 'ok',
      score,
      action: responseAction
    };
  } catch (error) {
    return { success: false, reason: 'request_failed', error };
  }
}

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
    const recaptchaToken = normalizeInput(req.body?.['g-recaptcha-response']);
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

    if (RECAPTCHA_ENABLED) {
      if (!recaptchaToken) {
        return res.status(400).send('Bitte bestätige, dass du kein Bot bist.');
      }
      const recaptchaResult = await verifyRecaptchaToken(
        recaptchaToken,
        resolveClientIp(req),
        RECAPTCHA_EXPECTED_ACTION
      );
      if (!recaptchaResult.success) {
        if (recaptchaResult.reason === 'missing_secret') {
          return res.status(503).send('Bot-Schutz ist derzeit nicht verfügbar. Bitte später erneut versuchen.');
        }
        return res.status(400).send('Bot-Schutz konnte nicht bestätigt werden. Bitte erneut versuchen.');
      }
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
