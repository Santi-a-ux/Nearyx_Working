import {
  DomainError,
  InvalidTokenError,
  ForbiddenRoleError,
  InvalidTimeRangeError,
  BookingNotFoundError,
  NotAuthorizedError,
} from '../../domain/errors/index.js';

const STATUS_BY_ERROR = [
  [InvalidTimeRangeError, 400],
  [InvalidTokenError, 401],
  [ForbiddenRoleError, 403],
  [NotAuthorizedError, 403],
  [BookingNotFoundError, 404],
];

export function errorHandler(err, req, res, _next) {
  if (err instanceof DomainError) {
    const status = STATUS_BY_ERROR.find(([E]) => err instanceof E)?.[1] ?? 500;
    if (err instanceof InvalidTokenError) res.set('WWW-Authenticate', 'Bearer');
    return res.status(status).json({ detail: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(422).json({ detail: 'JSON decode error' });
  }
  console.error(err);
  res.status(500).json({ detail: 'Internal Server Error' });
}
