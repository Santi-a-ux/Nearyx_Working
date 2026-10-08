import { InvalidTokenError } from '../../domain/errors/index.js';
import { isUuid } from '../../domain/identifiers.js';

/** Resolves the caller's identity from a JWT issued by the auth service (no DB lookup). */
export class IdentityService {
  constructor({ tokenVerifier }) {
    this.tokenVerifier = tokenVerifier;
  }

  authenticate(token) {
    const payload = this.tokenVerifier.verify(token);
    const sub = payload?.sub;
    if (!sub || !isUuid(String(sub))) throw new InvalidTokenError();
    return { userId: String(sub).toLowerCase(), role: payload.role ?? null };
  }
}
