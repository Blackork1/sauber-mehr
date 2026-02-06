import fs from 'fs';
import { sendContactAdminMail, sendContactConfirmationMail } from '../services/mailService.js';

function normalizeInput(value) {
  return String(value || '').trim();
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
    const contactMethod = normalizeInput(req.body?.contact_method);
    const contactValue = normalizeInput(req.body?.contact_value);
    const contactMethodLower = contactMethod.toLowerCase();
    const usesMail = contactMethodLower.includes('mail');
    const email = usesMail ? contactValue.toLowerCase() : normalizeInput(req.body?.email).toLowerCase();
    const phone = usesMail ? '' : contactValue;
    const uploads = Array.isArray(req.files?.attachments)
      ? req.files.attachments
      : (req.files?.attachments ? [req.files.attachments] : []);
    const attachments = uploads
      .filter((upload) => upload?.mimetype?.startsWith('image/'))
      .map((upload) => ({
        filename: upload.filename,
        originalName: upload.originalname,
        localPath: upload.localPath,
        size: upload.size,
        mimetype: upload.mimetype
      }));
    const rejectedUploads = uploads.filter((upload) => !upload?.mimetype?.startsWith('image/'));
    await Promise.all(rejectedUploads.map((upload) => fs.promises.unlink(upload.path).catch(() => { })));

    if (!service || !contactMethod || !contactValue || (usesMail && !email)) {
      await Promise.all(uploads.map((upload) => fs.promises.unlink(upload.path).catch(() => { })));
      return res.status(400).send('Bitte alle Pflichtfelder ausfüllen.');
    }

    const pool = req.app.get('db');
    await pool.query(
      `INSERT INTO contact_requests
        (name, email, phone, contact_method, service, area, industry, other_details, attachments)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [name || null, email || null, phone || null, contactMethod || null, service, area || null, industry || null, otherDetails || null, JSON.stringify(attachments)]
    );

    await sendContactAdminMail({
      to: process.env.CONTACT_ADMIN_TO || 'info@sauber-mehr.de',
      name,
      service,
      area,
      industry,
      otherDetails,
      contactMethod,
      contactValue
    });

    if (email) {
      await sendContactConfirmationMail({
        to: email,
        name,
        service
      });
    }

    const referer = req.get('referer');
    return res.redirect(referer || '/#kontakt');
  } catch (err) {
    return next(err);
  }
}