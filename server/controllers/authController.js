import crypto from 'crypto';
import { sendNewsletterConfirmationMail } from '../services/mailService.js';

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createCodeVerifier() {
  return base64UrlEncode(crypto.randomBytes(32));
}

function createCodeChallenge(verifier) {
  const digest = crypto.createHash('sha256').update(verifier).digest();
  return base64UrlEncode(digest);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash) return false;
  const [salt, hash] = storedHash.split(':');
  if (!salt || !hash) return false;
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(verifyHash, 'hex'));
}

function getGoogleConfig() {
  return {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI
  };
}

function buildGoogleAuthUrl(state, codeChallenge) {
  const { clientId, redirectUri } = getGoogleConfig();
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', 'openid email profile');
  url.searchParams.set('state', state);
  url.searchParams.set('code_challenge', codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('prompt', 'select_account');
  return url.toString();
}

function resolveLocale(req) {
  const explicit = String(req.query?.lang || '').toLowerCase();
  if (['de', 'en', 'ku'].includes(explicit)) {
    req.session.locale = explicit;
    return explicit;
  }

  const referer = String(req.get('referer') || '');
  if (referer.includes('/en')) {
    req.session.locale = 'en';
    return 'en';
  }
  if (referer.includes('/ku')) {
    req.session.locale = 'ku';
    return 'ku';
  }

  return req.session.locale || 'de';
}

function getAuthCopy(locale) {
  const translations = {
    de: {
      localeTag: 'de-DE',
      loginTitle: 'Login',
      loginHeadline: 'Admin & Nutzer Login',
      loginIntro: 'Melde dich mit deiner E-Mail-Adresse und deinem Passwort an.',
      loginError: 'E-Mail oder Passwort ist falsch.',
      loginButton: 'Login',
      loginGoogle: 'Mit Google anmelden',
      loginNote: 'Noch kein Konto?',
      loginNoteLink: 'Jetzt registrieren',
      registerTitle: 'Registrierung',
      registerHeadline: 'Registrierung',
      registerIntro: 'Erstelle ein Konto, um Tickets und Newsletter zu verwalten.',
      registerErrorMissing: 'Bitte alle Pflichtfelder ausfüllen.',
      registerErrorExists: 'Diese E-Mail ist bereits registriert.',
      registerButton: 'Registrieren',
      registerGoogle: 'Mit Google registrieren',
      registerNote: 'Schon registriert?',
      registerNoteLink: 'Zum Login',
      firstName: 'Vorname',
      lastName: 'Nachname',
      email: 'E-Mail',
      password: 'Passwort',
      newsletter: 'Newsletter',
      newsletterArticles: 'Artikel-News abonnieren',
      newsletterVideos: 'Video-News abonnieren',
      registerAdmin: 'Als Admin registrieren'
    },
    en: {
      localeTag: 'en-US',
      loginTitle: 'Login',
      loginHeadline: 'Admin & User Login',
      loginIntro: 'Sign in with your email address and password.',
      loginError: 'Email or password is incorrect.',
      loginButton: 'Login',
      loginGoogle: 'Sign in with Google',
      loginNote: 'No account yet?',
      loginNoteLink: 'Register now',
      registerTitle: 'Registration',
      registerHeadline: 'Registration',
      registerIntro: 'Create an account to manage tickets and newsletters.',
      registerErrorMissing: 'Please fill in all required fields.',
      registerErrorExists: 'This email is already registered.',
      registerButton: 'Register',
      registerGoogle: 'Register with Google',
      registerNote: 'Already registered?',
      registerNoteLink: 'Go to login',
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Email',
      password: 'Password',
      newsletter: 'Newsletter',
      newsletterArticles: 'Subscribe to article news',
      newsletterVideos: 'Subscribe to video news',
      registerAdmin: 'Register as admin'
    },
    ku: {
      localeTag: 'ku',
      loginTitle: 'Têketin',
      loginHeadline: 'Têketina Admin & Bikarhêner',
      loginIntro: 'Bi navnîşana e-name û şîfreyê têkeve.',
      loginError: 'E-name an şîfre şaş e.',
      loginButton: 'Têketin',
      loginGoogle: 'Bi Google têkeve',
      loginNote: 'Hesabek te tune ye?',
      loginNoteLink: 'Niha tomar bike',
      registerTitle: 'Tomarkirin',
      registerHeadline: 'Tomarkirin',
      registerIntro: 'Hesabek biafirîne da ku bilêt û nûçe-manage bikî.',
      registerErrorMissing: 'Ji kerema xwe hemû qutîyên pêwîst tijî bike.',
      registerErrorExists: 'Ev e-name berê hatiye tomarkirin.',
      registerButton: 'Tomar bike',
      registerGoogle: 'Bi Google tomar bike',
      registerNote: 'Berê hatî tomarkirin?',
      registerNoteLink: 'Biçe têketinê',
      firstName: 'Nav',
      lastName: 'Paşnav',
      email: 'E-name',
      password: 'Şîfre',
      newsletter: 'Newsletter',
      newsletterArticles: 'Nûçeyên gotaran bibin endam',
      newsletterVideos: 'Nûçeyên vîdyoyan bibin endam',
      registerAdmin: 'Wek admin tomar bike'
    }
  };

  return translations[locale] || translations.de;
}

export async function getLogin(req, res) {
  const locale = resolveLocale(req);
  const t = getAuthCopy(locale);
  return res.render('pages/login', {
    meta: { title: t.loginTitle, description: t.loginTitle, locale: t.localeTag },
    error: null,
    t,
    locale
  });
}

export async function postLogin(req, res, next) {
  try {
    const pool = req.app.get('db');
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');

    const { rows } = await pool.query(
      'SELECT id, first_name, last_name, email, password_hash, is_admin, has_online_ticket FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    const locale = resolveLocale(req);
    const t = getAuthCopy(locale);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).render('pages/login', {
        meta: { title: t.loginTitle, description: t.loginTitle, locale: t.localeTag },
        error: t.loginError,
        t,
        locale
      });
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
      hasOnlineTicket: user.has_online_ticket
    };

    if (user.is_admin) {
      return res.redirect('/adminbackend');
    }

    const returnTo = req.session.returnTo;
    if (returnTo) {
      delete req.session.returnTo;
      return res.redirect(returnTo);
    }

    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
}

export async function getRegister(req, res) {
  const locale = resolveLocale(req);
  const t = getAuthCopy(locale);
  return res.render('pages/register', {
    meta: { title: t.registerTitle, description: t.registerTitle, locale: t.localeTag },
    error: null,
    t,
    locale
  });
}

export async function postRegister(req, res, next) {
  try {
    const pool = req.app.get('db');
    const firstName = String(req.body?.firstName || '').trim();
    const lastName = String(req.body?.lastName || '').trim();
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const isAdmin = req.body?.isAdmin === 'on';
    const newsletterArticles = req.body?.newsletterArticles === 'on';
    const newsletterVideos = req.body?.newsletterVideos === 'on';

    const locale = resolveLocale(req);
    const t = getAuthCopy(locale);
    const newsletterLanguage = t.localeTag || 'de-DE';
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).render('pages/register', {
        meta: { title: t.registerTitle, description: t.registerTitle, locale: t.localeTag },
        error: t.registerErrorMissing,
        t,
        locale
      });
    }

    const { rows: existingRows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingRows.length) {
      return res.status(409).render('pages/register', {
        meta: { title: t.registerTitle, description: t.registerTitle, locale: t.localeTag },
        error: t.registerErrorExists,
        t,
        locale
      });
    }

    const passwordHash = hashPassword(password);
    const unsubscribeKey = crypto.randomUUID();
    const registrationData = {
      userAgent: req.headers['user-agent'] || null,
      registeredAt: new Date().toISOString(),
      ip: req.ip
    };

    const insertQuery = `
      INSERT INTO users (
        first_name, last_name, email, password_hash, is_admin,
        newsletter_articles, newsletter_videos, newsletter_unsubscribe_key,
        registration_data, auth_provider
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING id, first_name, last_name, email, is_admin, has_online_ticket
    `;

    const { rows } = await pool.query(insertQuery, [
      firstName,
      lastName,
      email,
      passwordHash,
      isAdmin,
      newsletterArticles,
      newsletterVideos,
      unsubscribeKey,
      registrationData,
      'local'
    ]);

    const user = rows[0];

    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
      hasOnlineTicket: user.has_online_ticket
    };

    if (user.is_admin) {
      return res.redirect('/adminbackend');
    }

    if (newsletterArticles || newsletterVideos) {
      await pool.query(
        `INSERT INTO newsletter_subscriptions
          (email, wants_news, wants_video, active, language, token)
         VALUES ($1, $2, $3, true, $4, $5)`,
        [email, newsletterArticles, newsletterVideos, newsletterLanguage, unsubscribeKey]
      );

      const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      const unsubscribeUrl = `${baseUrl}/newsletter/abmelden/${unsubscribeKey}`;
      try {
        await sendNewsletterConfirmationMail({
          to: email,
          wantsNews: newsletterArticles,
          wantsVideo: newsletterVideos,
          unsubscribeUrl,
          unsubscribeCode: unsubscribeKey
        });
      } catch (error) {
        console.error('Newsletter confirmation mail error:', error);
      }
    }

    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
}

export async function logout(req, res) {
  req.session.destroy(() => {
    res.redirect('/');
  });
}

export async function startGoogleAuth(req, res) {
  const { clientId, redirectUri } = getGoogleConfig();
  if (!clientId || !redirectUri) {
    return res.status(500).send('Google OAuth nicht konfiguriert.');
  }

  const state = crypto.randomUUID();
  const codeVerifier = createCodeVerifier();
  const codeChallenge = createCodeChallenge(codeVerifier);

  req.session.oauthState = state;
  req.session.oauthCodeVerifier = codeVerifier;

  const authUrl = buildGoogleAuthUrl(state, codeChallenge);
  return res.redirect(authUrl);
}

export async function finishGoogleAuth(req, res, next) {
  try {
    const { clientId, clientSecret, redirectUri } = getGoogleConfig();
    const code = String(req.query?.code || '');
    const state = String(req.query?.state || '');

    if (!clientId || !clientSecret || !redirectUri) {
      return res.status(500).send('Google OAuth nicht konfiguriert.');
    }

    if (!code || !state || state !== req.session.oauthState) {
      return res.status(400).send('Ungültiger OAuth-Status.');
    }

    const verifier = req.session.oauthCodeVerifier;
    req.session.oauthState = null;
    req.session.oauthCodeVerifier = null;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        code_verifier: verifier,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return res.status(502).send(`Google Token Fehler: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    const userInfoResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      return res.status(502).send(`Google Userinfo Fehler: ${errorText}`);
    }

    const profile = await userInfoResponse.json();
    const email = normalizeEmail(profile.email);
    const googleId = profile.sub;
    const firstName = profile.given_name || 'Google';
    const lastName = profile.family_name || 'Nutzer';
    const locale = resolveLocale(req);
    const t = getAuthCopy(locale);

    if (!email) {
      return res.status(400).render('pages/login', {
        meta: { title: t.loginTitle, description: t.loginTitle, locale: t.localeTag },
        error: t.loginError,
        t,
        locale
      });
    }

    const pool = req.app.get('db');
    const { rows: existingByGoogle } = await pool.query(
      'SELECT id, first_name, last_name, email, is_admin, has_online_ticket FROM users WHERE google_id = $1',
      [googleId]
    );

    let user = existingByGoogle[0];
    if (!user) {
      const { rows: existingByEmail } = await pool.query(
        'SELECT id, first_name, last_name, email, is_admin, has_online_ticket FROM users WHERE email = $1',
        [email]
      );

      if (existingByEmail[0]) {
        user = existingByEmail[0];
        await pool.query(
          'UPDATE users SET google_id = $1, auth_provider = $2 WHERE id = $3',
          [googleId, 'google', user.id]
        );
      } else {
        const unsubscribeKey = crypto.randomUUID();
        const randomPassword = crypto.randomBytes(32).toString('hex');
        const passwordHash = hashPassword(randomPassword);
        const registrationData = {
          provider: 'google',
          userAgent: req.headers['user-agent'] || null,
          registeredAt: new Date().toISOString(),
          ip: req.ip
        };

        const insertQuery = `
          INSERT INTO users (
            first_name, last_name, email, password_hash, is_admin,
            newsletter_articles, newsletter_videos, newsletter_unsubscribe_key,
            registration_data, google_id, auth_provider
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
          RETURNING id, first_name, last_name, email, is_admin, has_online_ticket
        `;

        const { rows } = await pool.query(insertQuery, [
          firstName,
          lastName,
          email,
          passwordHash,
          false,
          false,
          false,
          unsubscribeKey,
          registrationData,
          googleId,
          'google'
        ]);

        user = rows[0];
      }
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      isAdmin: user.is_admin,
      hasOnlineTicket: user.has_online_ticket
    };

    if (user.is_admin) {
      return res.redirect('/adminbackend');
    }
    console.log('User logged in via Google OAuth:', user);
    const returnTo = req.session.returnTo;
    if (returnTo) {
      delete req.session.returnTo;
      return res.redirect(returnTo);
    }

    return res.redirect('/');
  } catch (err) {
    return next(err);
  }
}