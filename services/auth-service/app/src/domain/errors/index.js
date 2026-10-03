export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidRoleError extends DomainError {
  constructor() { super('Invalid role'); }
}
export class EmailAlreadyRegisteredError extends DomainError {
  constructor() { super('Email already registered'); }
}
export class InvalidCredentialsError extends DomainError {
  constructor() { super('Incorrect email or password'); }
}
export class InvalidTokenError extends DomainError {
  constructor() { super('Invalid token'); }
}
export class InactiveUserError extends DomainError {
  constructor() { super('User not found or inactive'); }
}
export class InvalidRefreshTokenError extends DomainError {
  constructor() { super('Invalid refresh token'); }
}
export class ExpiredRefreshTokenError extends DomainError {
  constructor() { super('Invalid or expired refresh token'); }
}
