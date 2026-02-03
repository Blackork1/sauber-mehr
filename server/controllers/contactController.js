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

    if (!name || !email || !service) {
      return res.status(400).send('Bitte alle Pflichtfelder ausfüllen.');
    }

    const pool = req.app.get('db');
    await pool.query(
      'INSERT INTO contact_requests (name, email, service) VALUES ($1, $2, $3)',
      [name, email, service]
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