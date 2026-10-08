// Mirrors FastAPI's OAuth2PasswordBearer: a missing/malformed header is a 401 "Not authenticated".
export const createAuthenticate = (identityService) => (req, res, next) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    return res.status(401).set('WWW-Authenticate', 'Bearer').json({ detail: 'Not authenticated' });
  }
  req.user = identityService.authenticate(token); // { userId, role }
  next();
};
