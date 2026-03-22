export function get404(req, res) {
  return res.status(404).render('errors/404', {
    meta: {
      title: 'Seite nicht gefunden',
      description: 'Die angeforderte Seite wurde nicht gefunden.',
      robots: 'noindex, nofollow',
      locale: 'de-DE'
    }
  });
}

export function get500(err, req, res, _next) {
  console.error('❌ 500 error:', err);
  return res.status(500).render('errors/500', {
    meta: {
      title: 'Serverfehler',
      description: 'Ein interner Fehler ist aufgetreten.',
      robots: 'noindex, nofollow',
      locale: 'de-DE'
    }
  });
}
