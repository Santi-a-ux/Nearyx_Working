export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidTokenError extends DomainError {
  constructor() { super('Token inválido o expirado'); }
}
export class ProfileNotFoundError extends DomainError {
  constructor() { super('Profile not found'); }
}
export class ProfileAlreadyExistsError extends DomainError {
  constructor() { super('Profile already exists for this user'); }
}
export class FileRequiredError extends DomainError {
  constructor() { super('File is required'); }
}
export class InvalidImageTypeError extends DomainError {
  constructor() { super('Only image files are allowed'); }
}
export class StorageNotConfiguredError extends DomainError {
  constructor() { super('Image storage is not configured'); }
}
export class StorageUploadError extends DomainError {
  constructor(status) { super(`Image storage responded with HTTP ${status}`); }
}
