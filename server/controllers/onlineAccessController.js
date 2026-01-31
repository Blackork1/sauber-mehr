import {
  redeemOnlineAccessCode,
  setUserOnlineAccess
} from '../services/ticketOrderService.js';

export function renderOnlineAccess(req, res) {
  if (!req.session?.user) {
    req.session.returnTo = '/online-access';
    return res.redirect('/login');
  }
  return res.render('pages/online-access', {
    error: req.query?.error || null,
    success: req.query?.success || null
  });
}

export async function submitOnlineAccess(req, res, next) {
  try {
    if (!req.session?.user) {
      req.session.returnTo = '/online-access';
      return res.redirect('/login');
    }
    const code = String(req.body?.code || '').trim().toUpperCase();
    if (!code) {
      return res.redirect('/online-access?error=missing');
    }

    const pool = req.app.get('db');
    const redeemed = await redeemOnlineAccessCode(pool, {
      code,
      userId: req.session.user.id
    });
    if (!redeemed) {
      return res.redirect('/online-access?error=invalid');
    }

    await setUserOnlineAccess(pool, req.session.user.id);
    req.session.user.hasOnlineTicket = true;
    req.session.onlineTicket = true;

    return res.redirect('/online-access?success=1');
  } catch (err) {
    return next(err);
  }
}