import express from 'express';
import { renderHome } from '../controllers/pageController.js';

const router = express.Router();

/**
 * Home is a DB-rendered page (slug = 'home').
 * This keeps the "all pages from DB" rule consistent.
 */
router.get('/', renderHome);

export default router;
