import {
  DomainError,
  InvalidTokenError,
  ProfileNotFoundError,
  ProfileAlreadyExistsError,
  FileRequiredError,
  InvalidImageTypeError,
  StorageNotConfiguredError,
  StorageUploadError,
} from '../../domain/errors/index.js';

const STATUS_BY_ERROR = [
  [InvalidTokenError, 401],
  [ProfileNotFoundError, 404],
  [ProfileAlreadyExistsError, 400],
  [FileRequiredError, 400],
  [InvalidImageTypeError, 400],
  [StorageNotConfiguredError, 503],
  [StorageUploadError, 502],
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
