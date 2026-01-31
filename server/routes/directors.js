import { Router } from 'express';
import { renderDirectorPage } from '../controllers/directorController.js';

const router = Router();

router.get(
  [
    '/regie/:slug',
    '/regie-de/:slug',
    '/regie-en/:slug',
    '/regie-ku/:slug'
  ],
  renderDirectorPage
);

export default router;