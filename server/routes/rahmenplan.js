import { Router } from 'express';
import { renderRahmenplanPage } from '../controllers/rahmenplanController.js';

const router = Router();

router.get(['/rahmenplan', '/rahmenplan-de', '/rahmenplan-en', '/rahmenplan-ku'], renderRahmenplanPage);

export default router;