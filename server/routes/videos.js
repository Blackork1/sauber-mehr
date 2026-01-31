import { Router } from 'express';
import { renderVideoPage } from '../controllers/videoController.js';

const router = Router();

router.get(
  [
    '/video',
    '/video-de',
    '/video-en',
    '/video-ku',
    '/video/:videoId',
    '/video-de/:videoId',
    '/video-en/:videoId',
    '/video-ku/:videoId'
  ],
  renderVideoPage
);
export default router;