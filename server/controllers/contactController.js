import pool from '../util/db.js';

export async function getContact(req, res) {
  return res.render('pages/contact', {
    meta: {
      title: 'Kontakt',
      description: 'Kontaktformular',
      locale: 'de-DE'
    }
  });
}

export async function postContact(req, res, next) {
  try {
    const { name, email, message } = req.body || {};
    await pool.query(
      `INSERT INTO contact_requests (name, email, message) VALUES ($1,$2,$3)`,
      [name || null, email || null, message || null]
    );
    return res.redirect('/kontakt?sent=1');
  } catch (err) {
    return next(err);
  }
}
