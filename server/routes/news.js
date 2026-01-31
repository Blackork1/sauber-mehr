import { Router } from 'express';
import { renderNewsArticle, renderNewsPage } from '../controllers/newsController.js';

const router = Router();

router.get(['/news', '/news-de', '/news-en', '/news-ku'], renderNewsPage);
router.get(['/news/:id', '/news-:lang/:slug'], renderNewsArticle);

export default router;