import {
  DomainError,
  InvalidRoleError,
  EmailAlreadyRegisteredError,
} from '../../domain/errors/index.js';

const BAD_REQUEST = [InvalidRoleError, EmailAlreadyRegisteredError];

export function errorHandler(err, req, res, _next) {
  if (err instanceof DomainError) {
    const status = BAD_REQUEST.some((E) => err instanceof E) ? 400 : 401;
    return res.status(status).json({ detail: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(422).json({ detail: 'JSON decode error' });
  }
  console.error(err);
  res.status(500).json({ detail: 'Internal Server Error' });
}
