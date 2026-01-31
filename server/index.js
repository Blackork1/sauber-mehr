import { webcrypto } from 'crypto';
if (!global.crypto) global.crypto = webcrypto;

import express from 'express';
import session from 'express-session';
import connectPg from 'connect-pg-simple';
import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cron from 'node-cron';

import pool from './util/db.js';
import cloudinary from './util/cloudinary.js';

import { getAvailableCssFiles, getCssAssetVersion, getCssClasses } from './helpers/cssHelper.js';
import { getJsAssetVersion } from './helpers/jsHelper.js';
import { FIELD_CONFIG } from './helpers/componentConfig.js';
import { navbarMiddleware } from './helpers/navHelper.js';
import { renderTextWithLinks } from './helpers/textRenderer.js';

import consentMiddleware from './middleware/consentMiddleware.js';
import { accessLog } from './middleware/accessLog.js';

import mainRoutes from './routes/main.js';
import pagesRoutes from './routes/pages.js';
import consentRoutes from './routes/consent.js';
import contactRoutes from './routes/contact.js';
import newsletterRoutes from './routes/newsletter.js';
import newsRoutes from './routes/news.js';
import videoRoutes from './routes/videos.js';
import directorRoutes from './routes/directors.js';
import ticketRoutes from './routes/tickets.js';
import checkoutRoutes from './routes/checkout.js';
import donationRoutes from './routes/donations.js';
import stripeRoutes from './routes/stripe.js';
import onlineAccessRoutes from './routes/onlineAccess.js';
import teamRoutes from './routes/team.js';
import rahmenplanRoutes from './routes/rahmenplan.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import galleryRoutes from './routes/gallery.js';
import * as errorController from './controllers/errorController.js';

dotenv.config();

const app = express();

/** === Basics === */
app.disable('x-powered-by');

const isProd = process.env.NODE_ENV === 'production';
app.set('trust proxy', isProd ? true : false);

/** Healthcheck (Docker/Monitoring) */
app.get('/health', (_req, res) => res.status(200).send('ok'));

/** Canonical redirect (HTTPS + Host), only in production */
if (isProd) {
  const CANON_HOST = process.env.CANONICAL_HOST;
  if (!CANON_HOST) {
    console.warn('CANONICAL_HOST missing — canonical redirect disabled');
  } else {
    const IGNORED_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];
    const isPrivateLan = (h) => /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(h);

    app.use((req, res, next) => {
      const hostHeader = req.headers.host || '';
      const hostname = hostHeader.replace(/:\d+$/, '');
      const proto = (req.get('x-forwarded-proto') || req.protocol).toLowerCase();

      if (IGNORED_HOSTS.includes(hostname) || isPrivateLan(hostname)) return next();

      const needsHttps = proto !== 'https';
      const needsHost = hostname !== CANON_HOST;

      if (needsHttps || needsHost) {
        const suffix = req.originalUrl || '/';
        return res.redirect(301, `https://${CANON_HOST}${suffix}`);
      }
      next();
    });
  }
}

/** Compression */
app.use(compression());

/** Paths (ESM) */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Views */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/** Static */
const staticOpts = isProd ? { immutable: true, maxAge: '365d' } : { maxAge: 0 };
app.use(express.static(path.join(__dirname, 'public'), staticOpts));

/** Body + Cookies */
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/stripe/webhook')) {
    return next();
  }
  return express.json()(req, res, next);
}); 
app.use(cookieParser());

/** Sessions (Postgres) */
const PgSession = connectPg(session);
app.use(session({
  store: new PgSession({ pool, createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET || 'change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd && (process.env.COOKIE_SECURE || 'true') === 'true',
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  }
}));

/** Consent → req.consent + res.locals flags */
app.use(consentMiddleware);

/** Access logging (DSGVO-aware) */
app.use(accessLog({
  pool,
  getConsent: (req) => ({ analytics: !!req.session?.cookieConsent?.analytics }),
  useMaxMind: false,
  excludePrivate: true,
  respectDNT: true,
}));

/** App locals (DB-first rendering helpers) */
app.set('db', pool);
app.set('cloudinary', cloudinary);

app.set('cssClasses', getCssClasses());
app.set('fieldConfig', FIELD_CONFIG);
app.locals.renderTextWithLinks = renderTextWithLinks;

app.locals.availableCssFiles = getAvailableCssFiles();

app.use((req, res, next) => {
  if (typeof res.locals.meta === 'undefined') res.locals.meta = {};
  if (typeof res.locals.schemaGraphJson === 'undefined') res.locals.schemaGraphJson = '';
  if (typeof res.locals.buildVersion === 'undefined') {
    const cssVersion = getCssAssetVersion();
    const jsVersion = getJsAssetVersion();
    const assetVersion = Math.max(Number(cssVersion) || 0, Number(jsVersion) || 0);
    res.locals.buildVersion = process.env.BUILD_VERSION
      || process.env.COMMIT_SHA
      || (assetVersion ? assetVersion.toString() : '');
  }
  if (typeof res.locals.assetSuffix === 'undefined') {
    res.locals.assetSuffix = res.locals.buildVersion
      ? `?v=${encodeURIComponent(res.locals.buildVersion)}`
      : '';
  }
  if (typeof res.locals.stylesheets === 'undefined') res.locals.stylesheets = [];
  if (typeof res.locals.translations === 'undefined') res.locals.translations = null;
  if (typeof res.locals.newsletterStatus === 'undefined') {
    res.locals.newsletterStatus = req.query?.newsletter || null;
  }
  next();
});
// const requiredColumns = [
//   { table: 'pages', column: 'show_in_nav' },
//   { table: 'media_videos', column: 'media_group_id' },
//   { table: 'media_tickets', column: 'media_group_id' }
// ];

// async function logDbDiagnostics() {
//   const [{ rows: [dbInfo] }, { rows: columns }, { rows: tables }] = await Promise.all([
//     pool.query(`SELECT current_database() AS name,
//                        inet_server_addr() AS host,
//                        inet_server_port() AS port,
//                        current_user AS user,
//                        current_schema() AS schema,
//                        current_setting('search_path') AS search_path`),
//     pool.query(
//       `SELECT table_name, column_name
//        FROM information_schema.columns
//        WHERE table_schema = 'public'
//          AND (table_name, column_name) IN (${requiredColumns
//            .map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`)
//            .join(', ')})`,
//       requiredColumns.flatMap(({ table, column }) => [table, column])
//     ),
//     pool.query(
//       `SELECT table_name
//        FROM information_schema.tables
//        WHERE table_schema = 'public'
//        ORDER BY table_name`
//     )
//   ]);

//   if (dbInfo) {
//     console.log(`✅ DB Ziel: ${dbInfo.name} @ ${dbInfo.host || 'unknown'}:${dbInfo.port || 'unknown'}`);
//     console.log(`✅ DB User/Schema: ${dbInfo.user || 'unknown'} | schema=${dbInfo.schema || 'unknown'} | search_path=${dbInfo.search_path || 'unknown'}`);
//   }

//   const tableNames = tables.map((row) => row.table_name);
//   console.log(`✅ DB Tabellen (public): ${tableNames.length} ${tableNames.length ? `(${tableNames.join(', ')})` : ''}`);

//   const present = new Set(columns.map((row) => `${row.table_name}.${row.column_name}`));
//   const missing = requiredColumns
//     .map(({ table, column }) => `${table}.${column}`)
//     .filter((key) => !present.has(key));

//   if (missing.length) {
//     console.warn(`⚠️ Fehlende Spalten erkannt: ${missing.join(', ')}`);
//   }
// }

pool.query('SELECT 1')
  .then(() => console.log('✅ Datenbankverbindung hergestellt - Alles klappt'))
  // .then(logDbDiagnostics)
  .catch((err) => console.error('❌ Datenbankverbindung fehlgeschlagen:', err));

/** Navbar: pulls pages + industries from DB into res.locals */
app.use(navbarMiddleware(pool));

/** Crash safety */
process.on('unhandledRejection', (err) => console.error('❌ Unhandled Rejection:', err));
process.on('uncaughtException', (err) => console.error('❌ Uncaught Exception:', err));

/** Example cron (optional) */
if (isProd) {
  cron.schedule('0 3 * * *', async () => {
    // place your nightly jobs here (cleanup, backups, etc.)
  }, { timezone: 'Europe/Berlin' });
}

/** Routes */
app.use('/', mainRoutes);          
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/', newsRoutes);
app.use('/', videoRoutes);
app.use('/', directorRoutes);
app.use('/', teamRoutes);
app.use('/', rahmenplanRoutes);
app.use('/', ticketRoutes);
app.use('/', checkoutRoutes);
app.use('/', donationRoutes);
app.use('/', onlineAccessRoutes);
app.use('/', stripeRoutes);
app.use('/', galleryRoutes);
app.use('/', pagesRoutes);         // "/:slug" dynamic pages from DB
app.use('/api/consent', consentRoutes);
app.use('/kontakt', contactRoutes);
app.use('/newsletter', newsletterRoutes);

/** Errors */
app.use(errorController.get404);

app.use(errorController.get500);

/** Start */
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => console.log(`✅ Server läuft auf Port ${PORT}`));
server.setTimeout(0);
server.requestTimeout = 0;