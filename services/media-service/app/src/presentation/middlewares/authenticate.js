import { MissingCredentialsError } from '../../domain/errors/index.js';

export const createAuthenticate = (identityService) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw new MissingCredentialsError();
  req.user = identityService.authenticate(header.split(' ')[1]); // { userId, role }
  next();
};
