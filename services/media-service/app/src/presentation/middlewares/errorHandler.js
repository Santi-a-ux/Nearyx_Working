import {
  DomainError,
  MissingCredentialsError,
  InvalidTokenError,
  InvalidUserIdError,
  ForbiddenError,
  PublicationNotFoundError,
  CommentNotFoundError,
  FileNotFoundError,
  InvalidUploadError,
  StorageNotConfiguredError,
  StorageError,
} from '../../domain/errors/index.js';

const STATUS_BY_ERROR = [
  [MissingCredentialsError, 401],
  [InvalidTokenError, 401],
  [InvalidUserIdError, 401],
  [ForbiddenError, 403],
  [PublicationNotFoundError, 404],
  [CommentNotFoundError, 404],
  [FileNotFoundError, 404],
  [InvalidUploadError, 400],
  [StorageNotConfiguredError, 503],
  [StorageError, 502],
];

export const notFound = (req, res) => res.status(404).json({ detail: 'Not Found' });

export function errorHandler(err, req, res, _next) {
  if (err instanceof DomainError) {
    const status = STATUS_BY_ERROR.find(([E]) => err instanceof E)?.[1] ?? 500;
    if (status === 401) res.set('WWW-Authenticate', 'Bearer');
    return res.status(status).json({ detail: err.message });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(422).json({ detail: 'JSON decode error' });
  }
  console.error(err);
  res.status(500).json({ detail: 'Internal Server Error' });
}
