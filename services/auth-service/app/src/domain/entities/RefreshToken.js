export class RefreshToken {
  constructor({ id, userId, tokenHash, expiresAt, createdAt }) {
    this.id = id;
    this.userId = userId;
    this.tokenHash = tokenHash;
    this.expiresAt = expiresAt;
    this.createdAt = createdAt;
  }

  isExpired(now = new Date()) {
    return this.expiresAt <= now;
  }
}
