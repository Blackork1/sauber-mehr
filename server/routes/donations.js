import { Router } from 'express';
import {
  createDonationCheckoutSession,
  renderDonationSuccess,
  renderDonationCancel
} from '../controllers/donationController.js';

const router = Router();

router.post('/api/donations/create', createDonationCheckoutSession);
router.get('/donation/success', renderDonationSuccess);
router.get('/donation/cancel', renderDonationCancel);

export default router;