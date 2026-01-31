export function requireAuth(req, res, next) {
  if (req.session?.user) return next();
  return res.redirect('/login');
}

export function requireAdmin(req, res, next) {
  if (req.session?.user?.isAdmin) return next();
  return res.redirect('/');
}