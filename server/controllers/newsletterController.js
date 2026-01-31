import { randomBytes } from 'crypto';
import pool from '../util/db.js';
import { sendNewsletterConfirmationMail } from '../services/mailService.js';

function isValidEmail(email) {
  return typeof email === 'string' && /\S+@\S+\.\S+/.test(email);
}

export async function postNewsletter(req, res, next) {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const wantsNews = req.body?.news === 'yes';
    const wantsVideo = req.body?.video === 'yes';
    const language = String(req.body?.language || 'de-DE').trim() || 'de-DE';
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const redirectTarget = new URL(req.get('referer') || '/', baseUrl);

    if (!isValidEmail(email) || (!wantsNews && !wantsVideo)) {
      redirectTarget.searchParams.set('newsletter', 'error');
      return res.redirect(redirectTarget.toString());
    }

    const token = randomBytes(16).toString('hex');

    await pool.query(
      `INSERT INTO newsletter_subscriptions
        (email, wants_news, wants_video, active, language, token)
       VALUES ($1, $2, $3, true, $4, $5)`,
      [email, wantsNews, wantsVideo, language, token]
    );

    const unsubscribeUrl = `${process.env.BASE_URL || baseUrl}/newsletter/abmelden/${token}`;
    try {
      await sendNewsletterConfirmationMail({
        to: email,
        wantsNews,
        wantsVideo,
        unsubscribeUrl,
        unsubscribeCode: token
      });
    } catch (error) {
      console.error('Newsletter confirmation mail error:', error);
    }

    redirectTarget.searchParams.set('newsletter', 'success');
    return res.redirect(redirectTarget.toString());
  } catch (err) {
    return next(err);
  }
}

export async function getNewsletterUnsubscribe(req, res, next) {
  try {
    const token = String(req.params?.token || '').trim();
    if (!token) {
      return res.status(400).render('pages/newsletter-unsubscribe', {
        meta: { title: 'Newsletter abmelden', description: 'Newsletter abmelden', locale: 'de-DE' },
        subscription: null,
        status: 'invalid',
        selectedScope: 'all'
      });
    }

    const { rows } = await pool.query(
      `SELECT email, wants_news, wants_video, active
       FROM newsletter_subscriptions
       WHERE token = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [token]
    );

    const subscription = rows[0] || null;
    return res.render('pages/newsletter-unsubscribe', {
      meta: { title: 'Newsletter abmelden', description: 'Newsletter abmelden', locale: 'de-DE' },
      subscription,
      status: req.query?.status || null,
      selectedScope: req.query?.scope || 'all'
    });
  } catch (err) {
    return next(err);
  }
}

export async function postNewsletterUnsubscribe(req, res, next) {
  try {
    const token = String(req.params?.token || '').trim();
    const scope = String(req.body?.unsubscribeScope || 'all').trim();

    if (!token) {
      return res.status(400).render('pages/newsletter-unsubscribe', {
        meta: { title: 'Newsletter abmelden', description: 'Newsletter abmelden', locale: 'de-DE' },
        subscription: null,
        status: 'invalid',
        selectedScope: scope
      });
    }

    const { rows } = await pool.query(
      `SELECT email, wants_news, wants_video, active
       FROM newsletter_subscriptions
       WHERE token = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [token]
    );

    const subscription = rows[0];
    if (!subscription) {
      return res.status(404).render('pages/newsletter-unsubscribe', {
        meta: { title: 'Newsletter abmelden', description: 'Newsletter abmelden', locale: 'de-DE' },
        subscription: null,
        status: 'not-found',
        selectedScope: scope
      });
    }

    let wantsNews = subscription.wants_news;
    let wantsVideo = subscription.wants_video;
    let active = subscription.active;

    if (scope === 'all') {
      wantsNews = false;
      wantsVideo = false;
      active = false;
    } else if (scope === 'news') {
      wantsNews = false;
      active = wantsVideo;
    } else if (scope === 'video') {
      wantsVideo = false;
      active = wantsNews;
    }

    await pool.query(
      `UPDATE newsletter_subscriptions
       SET wants_news = $1, wants_video = $2, active = $3
       WHERE token = $4`,
      [wantsNews, wantsVideo, active, token]
    );

    await pool.query(
      `UPDATE users
       SET newsletter_articles = $1, newsletter_videos = $2
       WHERE email = $3`,
      [wantsNews, wantsVideo, subscription.email]
    );

    const redirect = new URL(`${process.env.BASE_URL || `${req.protocol}://${req.get('host')}`}/newsletter/abmelden/${token}`);
    redirect.searchParams.set('status', 'success');
    redirect.searchParams.set('scope', scope);
    return res.redirect(redirect.toString());
  } catch (err) {
    return next(err);
  }
}