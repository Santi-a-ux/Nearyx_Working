import jwt from 'jsonwebtoken';

export class TokenVerifier {
  constructor({ secret, algorithm }) {
    this.secret = secret;
    this.algorithm = algorithm;
  }

  /** Returns the payload, or null when the token is invalid/expired. */
  verify(token) {
    try {
      return jwt.verify(token, this.secret, { algorithms: [this.algorithm] });
    } catch {
      return null;
    }
  }
}
