import { Router } from 'express';
import { getContact, postContact } from '../controllers/contactController.js';

const router = Router();
router.get('/', getContact);
router.post('/', postContact);

export default router;
