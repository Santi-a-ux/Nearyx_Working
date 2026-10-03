import {
  DomainError,
  MissingCredentialsError,
  InvalidTokenError,
  CoordinatesNotFoundError,
  UpstreamUnavailableError,
} from '../../domain/errors/index.js';

const STATUS_BY_ERROR = [
  [MissingCredentialsError, 401],
  [InvalidTokenError, 401],
  [CoordinatesNotFoundError, 404],
  [UpstreamUnavailableError, 502],
];

export function errorHandler(err, req, res, _next) {
  if (err instanceof DomainError) {
    const status = STATUS_BY_ERROR.find(([E]) => err instanceof E)?.[1] ?? 500;
    return res.status(status).json({ detail: err.message });
  }
  console.error(err);
  res.status(500).json({ detail: 'Internal Server Error' });
}
