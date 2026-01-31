import { Router } from 'express';
import { setConsent } from '../controllers/consentController.js';

const router = Router();
router.post('/', setConsent);

export default router;
