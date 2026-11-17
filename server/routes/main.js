import express from 'express';
import { renderHome, renderHomePreview } from '../controllers/pageController.js';

const router = express.Router();

/**
 * Home is a DB-rendered page (slug = 'home').
 * This keeps the "all pages from DB" rule consistent.
 */
router.get('/', renderHome);

/** Startseiten-Entwürfe (noindex, nicht in der Sitemap) */
router.get('/home1', renderHomePreview);

export default router;
