export const createAuthenticate = (authService) => async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).set('WWW-Authenticate', 'Bearer').json({ detail: 'Not authenticated' });
  }
  req.user = await authService.authenticate(token); // Express 5 forwards rejections to the error handler
  next();
};
