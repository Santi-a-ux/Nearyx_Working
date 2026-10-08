import { StoredFile } from '../../domain/entities/StoredFile.js';
import { FileNotFoundError, ForbiddenError, InvalidUploadError } from '../../domain/errors/index.js';

const VALID_TYPES = ['avatar', 'document', 'post'];

export class MediaService {
  constructor({ fileMetadataRepository, fileStorage }) {
    this.fileMetadataRepository = fileMetadataRepository;
    this.fileStorage = fileStorage;
  }

  async upload(userId, { file, type }) {
    if (!VALID_TYPES.includes(type)) {
      // Same wording as the Python service (it printed a Python list).
      throw new InvalidUploadError(`Invalid type. Must be one of [${VALID_TYPES.map((t) => `'${t}'`).join(', ')}]`);
    }
    if (!file.buffer?.length) throw new InvalidUploadError('Image file is empty.');

    const contentType = file.mimetype || 'application/octet-stream';
    const { objectPath, url } = await this.fileStorage.upload({
      buffer: file.buffer,
      filename: file.originalname ?? '',
      folder: `${userId}/${type}`,
      contentType,
    });

    return this.fileMetadataRepository.create(
      new StoredFile({
        userId,
        fileUrl: url,
        fileType: contentType, // (sic) the column stores the MIME type, as in the Python service
        fileSize: file.buffer.length,
        bucketPath: objectPath,
      }),
    );
  }

  async getMetadata(fileId) {
    const file = await this.fileMetadataRepository.findById(fileId);
    if (!file) throw new FileNotFoundError();
    return file;
  }

  contentUrl(objectPath) {
    return this.fileStorage.publicUrl(objectPath);
  }

  async delete(userId, fileId) {
    const file = await this.getMetadata(fileId);
    if (!file.isOwnedBy(userId)) throw new ForbiddenError('Not authorized to delete this file');
    await this.fileStorage.remove(file.bucketPath);
    await this.fileMetadataRepository.delete(fileId);
  }
}
