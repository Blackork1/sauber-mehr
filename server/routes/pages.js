import { Router } from 'express';
import { renderByCanonicalPath, renderBySlug } from '../controllers/pageController.js';

const router = Router();

/**
 * Dynamic DB pages:
 *   /ueber-uns
 *   /datenschutz
 *   /impressum
 * etc.
 *
 * Keep this route AFTER your more specific routes to avoid conflicts.
 */
router.get('/sponsor', (req, res) => res.redirect(301, '/sponsor-de'));
router.get('/:slug', renderBySlug);
router.get('/*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  return renderByCanonicalPath(req, res, next);
});

export default router;
