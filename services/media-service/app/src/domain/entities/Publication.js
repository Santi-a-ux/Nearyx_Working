export class Publication {
  constructor({
    id = null, authorId, authorName, authorAvatar = null, authorRole = null,
    content, imageUrl = null, createdAt = null,
  }) {
    Object.assign(this, { id, authorId, authorName, authorAvatar, authorRole, content, imageUrl, createdAt });
  }

  isAuthoredBy(userId) {
    return this.authorId === userId;
  }
}
