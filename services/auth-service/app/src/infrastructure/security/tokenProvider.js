import jwt from 'jsonwebtoken';

export class TokenProvider {
  constructor({ secret, algorithm, accessExpireMinutes, refreshExpireDays }) {
    this.secret = secret;
    this.algorithm = algorithm;
    this.accessExpireMinutes = accessExpireMinutes;
    this.refreshExpireDays = refreshExpireDays;
  }

  #sign(claims, expiresAt) {
    const exp = Math.floor(expiresAt.getTime() / 1000);
    return jwt.sign({ exp, ...claims }, this.secret, { algorithm: this.algorithm, noTimestamp: true });
  }

  createAccessToken(subject, role) {
    const expiresAt = new Date(Date.now() + this.accessExpireMinutes * 60_000);
    return this.#sign({ sub: String(subject), role }, expiresAt);
  }

  createRefreshToken(subject) {
    const expiresAt = new Date(Date.now() + this.refreshExpireDays * 86_400_000);
    return { token: this.#sign({ sub: String(subject), type: 'refresh' }, expiresAt), expiresAt };
  }

  decode(token) {
    try {
      return jwt.verify(token, this.secret, { algorithms: [this.algorithm] });
    } catch {
      return null;
    }
  }
}
