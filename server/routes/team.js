import { Router } from 'express';
import { renderTeamPage } from '../controllers/teamController.js';

const router = Router();

router.get(['/team', '/team-de', '/team-en', '/team-ku'], renderTeamPage);

export default router;