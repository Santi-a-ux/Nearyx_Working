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
export class ConversationNotFoundError extends DomainError {
  constructor() { super('Conversation not found'); }
}
export class NotParticipantError extends DomainError {
  constructor() { super('Not authorized to view this conversation'); }
}
export class InvalidMessageError extends DomainError {
  constructor() { super('Invalid message'); }
}
