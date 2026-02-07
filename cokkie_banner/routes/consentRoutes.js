import express from 'express';
import { getConsent, postConsent, withdrawConsent } from '../controller/consentController.js';

const router = express.Router();

router.get('/consent', getConsent);
router.post('/consent', postConsent);
router.delete('/consent', withdrawConsent);

export default router;