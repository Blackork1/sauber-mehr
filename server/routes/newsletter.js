import { Router } from 'express';
import { getNewsletterUnsubscribe, postNewsletter, postNewsletterUnsubscribe } from '../controllers/newsletterController.js';

const router = Router();

router.post('/', postNewsletter);
router.get('/abmelden/:token', getNewsletterUnsubscribe);
router.post('/abmelden/:token', postNewsletterUnsubscribe);

export default router;