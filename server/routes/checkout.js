import { Router } from 'express';
import {
  renderCheckoutPage,
  createCheckoutSession,
  renderCheckoutSuccess,
  renderCheckoutCancel
} from '../controllers/checkoutController.js';

const router = Router();

router.get('/checkout', renderCheckoutPage);
router.post('/api/checkout/create', createCheckoutSession);
router.get('/checkout/success', renderCheckoutSuccess);
router.get('/checkout/cancel', renderCheckoutCancel);

export default router;