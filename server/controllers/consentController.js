export function setConsent(req, res) {
  const { necessary, analytics, marketing } = req.body || {};
  req.session.cookieConsent = {
    necessary: Boolean(necessary ?? true),
    analytics: Boolean(analytics),
    marketing: Boolean(marketing),
  };
  return res.json({ ok: true, consent: req.session.cookieConsent });
}
