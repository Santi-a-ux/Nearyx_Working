import {
  DomainError,
  InvalidTokenError,
  ForbiddenError,
  NotFoundError,
  BusinessRuleError,
  EmbeddingUnavailableError,
} from '../../domain/errors/index.js';

const STATUS_BY_ERROR = [
  [InvalidTokenError, 401],
  [ForbiddenError, 403],
  [NotFoundError, 404],
  [BusinessRuleError, 400],
  [EmbeddingUnavailableError, 503],
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
