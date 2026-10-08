import { randomUUID } from 'node:crypto';
import { StoredFile } from '../../domain/entities/StoredFile.js';

const toEntity = (row) =>
  row
    ? new StoredFile({
        id: row.id,
        userId: row.user_id,
        fileUrl: row.file_url,
        fileType: row.file_type,
        fileSize: row.file_size,
        bucketPath: row.bucket_path,
        createdAt: row.created_at,
      })
    : null;

export class FileMetadataRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(f) {
    const { rows } = await this.pool.query(
      `INSERT INTO media.files (id, user_id, file_url, file_type, file_size, bucket_path)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [randomUUID(), f.userId, f.fileUrl, f.fileType, f.fileSize, f.bucketPath],
    );
    return toEntity(rows[0]);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM media.files WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async delete(id) {
    await this.pool.query('DELETE FROM media.files WHERE id = $1', [id]);
  }
}
