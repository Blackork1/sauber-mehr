import { Router } from 'express';
import { getRobotsTxt, getSitemapXml } from '../controllers/seoController.js';

const router = Router();

router.get('/robots.txt', getRobotsTxt);
router.get('/sitemap.xml', getSitemapXml);

export default router;

