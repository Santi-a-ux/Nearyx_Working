export class Comment {
  constructor({
    id = null, postId, authorId, authorName, authorAvatar = null, content, createdAt = null,
  }) {
    Object.assign(this, { id, postId, authorId, authorName, authorAvatar, content, createdAt });
  }

  isAuthoredBy(userId) {
    return this.authorId === userId;
  }
}
