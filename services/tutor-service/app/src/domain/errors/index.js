export class DomainError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class InvalidTokenError extends DomainError {
  constructor() { super('Token inválido o expirado'); }
}
/** 403 — wrong role. */
export class ForbiddenError extends DomainError {}
/** 404 */
export class NotFoundError extends DomainError {}
/** 400 — a business rule was broken (duplicate, wrong state, ...). */
export class BusinessRuleError extends DomainError {}
/** 503 — the embedding model could not be loaded or run. */
export class EmbeddingUnavailableError extends DomainError {
  constructor(cause) {
    super(`Semantic search is unavailable: ${cause?.message ?? 'model not ready'}`);
    this.cause = cause;
  }
}
