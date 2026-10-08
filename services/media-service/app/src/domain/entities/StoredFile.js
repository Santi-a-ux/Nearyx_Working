/** Metadata of a file kept in object storage (table media.files). */
export class StoredFile {
  constructor({ id = null, userId, fileUrl, fileType, fileSize, bucketPath, createdAt = null }) {
    Object.assign(this, { id, userId, fileUrl, fileType, fileSize, bucketPath, createdAt });
  }

  isOwnedBy(userId) {
    return this.userId === userId;
  }
}
