import express from 'express';

import compression from 'compression';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';

import pool from './util/db.js';
import cloudinary from './util/cloudinary.js';

import mainRoutes from './routes/main.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import contactRoutes from './routes/contact.js';
import pagesRoutes from './routes/pages.js';
import * as errorController from './controllers/errorController.js';
import { renderTextWithLinks } from './helpers/textRenderer.js';

dotenv.config();

const app = express();

/** === Basics === */
app.disable('x-powered-by');
app.set('trust proxy', process.env.NODE_ENV === 'production');
app.get('/health', (_req, res) => res.status(200).send('ok'));

// removed canonical redirec

/** Compression */
app.use(compression());

/** Paths (ESM) */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Views */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

/** Static */
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0 }));

/** Body + Cookies */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

const PgSession = connectPgSimple(session);
app.use(session({
  store: new PgSession({
    pool,
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'dev-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production'
  }
}));

/** App locals (DB-first rendering helpers) */
app.set('db', pool);
app.locals.renderTextWithLinks = renderTextWithLinks;

app.use((req, res, next) => {
  if (typeof res.locals.meta === 'undefined') res.locals.meta = {};
  if (typeof res.locals.schemaGraphJson === 'undefined') res.locals.schemaGraphJson = '';
  if (typeof res.locals.assetSuffix === 'undefined') res.locals.assetSuffix = '';
  if (typeof res.locals.translations === 'undefined') res.locals.translations = null;
  if (typeof res.locals.stylesheets === 'undefined') res.locals.stylesheets = [];
  if (typeof res.locals.newsletterStatus === 'undefined') res.locals.newsletterStatus = '';
  if (typeof res.locals.availableCssFiles === 'undefined') res.locals.availableCssFiles = [];
  if (typeof res.locals.gaEnabled === 'undefined') res.locals.gaEnabled = false;
  if (typeof res.locals.clarityEnabled === 'undefined') res.locals.clarityEnabled = false;
  if (typeof res.locals.clarityId === 'undefined') res.locals.clarityId = '';
  next();
});

app.use('/', mainRoutes);
app.use('/', authRoutes);
app.use('/', adminRoutes);
app.use('/contact', contactRoutes);
app.use('/', pagesRoutes);
app.use(errorController.get404);
app.use(errorController.get500);

/** Start */
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});