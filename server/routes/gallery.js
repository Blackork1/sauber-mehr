import { Router } from 'express';
import { renderGallery } from '../controllers/galleryController.js';

const router = Router();

router.get(['/gallery', '/gallery-de', '/gallery-en', '/gallery-ku'], renderGallery);

export default router;