export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class MissingCredentialsError extends DomainError {
  constructor() { super('Valid credentials are required'); }
}
export class InvalidTokenError extends DomainError {
  constructor() { super('Token is invalid or expired'); }
}
export class InvalidUserIdError extends DomainError {
  constructor() { super('User ID is invalid'); }
}
/** 403 — the message tells which rule was broken. */
export class ForbiddenError extends DomainError {}
export class PublicationNotFoundError extends DomainError {
  constructor() { super('Publication not found'); }
}
export class CommentNotFoundError extends DomainError {
  constructor() { super('Comment not found'); }
}
export class FileNotFoundError extends DomainError {
  constructor() { super('File not found'); }
}
/** 400 — bad upload input (unknown type, empty file). */
export class InvalidUploadError extends DomainError {}
export class StorageNotConfiguredError extends DomainError {
  constructor() { super('File storage is not configured'); }
}
export class StorageError extends DomainError {
  constructor(status) { super(`File storage responded with HTTP ${status}`); }
}
