import { Router } from 'express';
import {
  getLogin,
  postLogin,
  getRegister,
  postRegister,
  logout,
  startGoogleAuth,
  finishGoogleAuth
} from '../controllers/authController.js';

const router = Router();

router.get('/login', getLogin);
router.post('/login', postLogin);
router.get('/register', getRegister);
router.post('/register', postRegister);
router.post('/logout', logout);
router.get('/auth/google', startGoogleAuth);
router.get('/auth/google/callback', finishGoogleAuth);

export default router;