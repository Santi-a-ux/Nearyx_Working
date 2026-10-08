import { InvalidTokenError, InvalidUserIdError } from '../../domain/errors/index.js';
import { isUuid } from '../../domain/identifiers.js';

/** Resolves the caller's identity from a JWT issued by the auth service (no DB lookup). */
export class IdentityService {
  constructor({ tokenVerifier }) {
    this.tokenVerifier = tokenVerifier;
  }

  authenticate(token) {
    const payload = this.tokenVerifier.verify(token);
    if (!payload) throw new InvalidTokenError();
    const sub = String(payload.sub ?? '');
    if (!isUuid(sub)) throw new InvalidUserIdError();
    return { userId: sub.toLowerCase(), role: payload.role ?? null };
  }
}
