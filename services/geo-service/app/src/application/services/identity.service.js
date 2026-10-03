import { InvalidTokenError } from '../../domain/errors/index.js';

export class IdentityService {
  constructor({ tokenVerifier }) {
    this.tokenVerifier = tokenVerifier;
  }

  /** Returns the JWT payload (only used when REQUIRE_AUTH=true). */
  authenticate(token) {
    const payload = this.tokenVerifier.verify(token);
    if (!payload) throw new InvalidTokenError();
    return payload;
  }
}
