import { Router } from 'express';
import { getConsent, postConsent, withdrawConsent } from '../controller/consentController.js';

const router = Router();

router.get('/consent', getConsent);
router.post('/consent', postConsent);
router.delete('/consent', withdrawConsent);

export default router;
