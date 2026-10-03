export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidTokenError extends DomainError {
  constructor() { super('Token inválido o expirado'); }
}
export class ForbiddenRoleError extends DomainError {
  constructor() { super('Operación permitida solo para tutores'); }
}
export class InvalidTimeRangeError extends DomainError {
  constructor() { super('Invalid time range'); }
}
export class BookingNotFoundError extends DomainError {
  constructor() { super('Booking not found'); }
}
export class NotAuthorizedError extends DomainError {
  constructor() { super('Not authorized'); }
}
