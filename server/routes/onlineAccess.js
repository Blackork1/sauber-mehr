import { Router } from 'express';
import { renderOnlineAccess, submitOnlineAccess } from '../controllers/onlineAccessController.js';

const router = Router();

router.get('/online-access', renderOnlineAccess);
router.post('/online-access', submitOnlineAccess);

export default router;