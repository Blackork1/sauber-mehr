export default (req, res, next) => {
  const consent = req.session?.cookieConsent ?? {
    necessary: true,
    analytics: false,
    marketing: false
  };

  req.consent = consent;

  res.locals.session = req.session ?? {};
  res.locals.consent = consent;
  res.locals.gaEnabled = Boolean(consent.analytics);

  res.locals.clarityEnabled = Boolean(consent.analytics);
  res.locals.clarityId = process.env.CLARITY_ID || '';

  res.setHeader('Cache-Control', 'private, must-revalidate');
  next();
};
