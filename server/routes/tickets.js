import { Router } from 'express';
import { renderTicketPage } from '../controllers/ticketsController.js';

const router = Router();

router.get(['/tickets', '/tickets-de', '/tickets-en', '/tickets-ku'], renderTicketPage);

export default router;