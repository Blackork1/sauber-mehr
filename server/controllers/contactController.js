import fs from 'fs';
import { sendContactConfirmationMail } from '../services/mailService.js';

function normalizeInput(value) {
  return String(value || '').trim();
}

export async function getContact(req, res) {
  return res.redirect('/#kontakt');
}

export async function postContact(req, res, next) {
  try {
    const name = normalizeInput(req.body?.name);
    const email = normalizeInput(req.body?.email).toLowerCase();
    const service = normalizeInput(req.body?.service);
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

    if (!name || !email || !service) {
      await Promise.all(uploads.map((upload) => fs.promises.unlink(upload.path).catch(() => { })));
      return res.status(400).send('Bitte alle Pflichtfelder ausfüllen.');
    }

    const pool = req.app.get('db');
    await pool.query(
      'INSERT INTO contact_requests (name, email, service, attachments) VALUES ($1, $2, $3, $4)',
      [name, email, service, JSON.stringify(attachments)]
    );

    await sendContactConfirmationMail({
      to: email,
      name,
      service
    });

    return res.redirect('/#kontakt');
  } catch (err) {
    return next(err);
  }
}