import { MissingCredentialsError } from '../../domain/errors/index.js';

// Port of verify_token (security.py). Only mounted when REQUIRE_AUTH=true.
export const createAuthenticate = (identityService) => (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) throw new MissingCredentialsError();
  req.user = identityService.authenticate(header.split(' ')[1]);
  next();
};

export const noAuth = (req, res, next) => next();
