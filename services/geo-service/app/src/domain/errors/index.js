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
export class CoordinatesNotFoundError extends DomainError {
  constructor() { super('Coordinates not found'); }
}
export class UpstreamUnavailableError extends DomainError {
  constructor() { super('Error connecting to upstream provider'); }
}
/** Any other failure while geocoding; the message is returned to the client (as in the Python service). */
export class GeocodingError extends DomainError {}

/** Raised by the geocoder port when the provider answers with a non-2xx status. */
export class UpstreamHttpError extends DomainError {
  constructor(status) {
    super(`Upstream responded with HTTP ${status}`);
    this.status = status;
  }
}
