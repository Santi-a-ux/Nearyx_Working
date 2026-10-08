import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { StorageNotConfiguredError, StorageUploadError } from '../../domain/errors/index.js';

const SAFE_EXT = /^\.[A-Za-z0-9]{1,10}$/;

/** Supabase Storage adapter over its REST API (no SDK needed for upload + public URL). */
export class SupabaseStorage {
  constructor({ url, key, bucket, timeoutMs = 15000 }) {
    this.baseUrl = url ? url.replace(/\/+$/, '') : null;
    this.key = key;
    this.bucket = bucket;
    this.timeoutMs = timeoutMs;
  }

  #objectPath(folder, filename) {
    const ext = path.extname(path.basename(filename));
    const name = `${randomUUID()}${SAFE_EXT.test(ext) ? ext : ''}`;
    const dir = String(folder).replace(/^\/+|\/+$/g, '');
    return dir ? `${dir}/${name}` : name;
  }

  #encode(objectPath) {
    return objectPath.split('/').map(encodeURIComponent).join('/');
  }

  /** Uploads the image and returns its public URL. */
  async uploadImage({ buffer, filename, folder = 'avatars', contentType = 'image/jpeg' }) {
    if (!this.baseUrl || !this.key) throw new StorageNotConfiguredError();

    const objectPath = this.#encode(this.#objectPath(folder, filename));
    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${objectPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.key}`,
        apikey: this.key,
        'Content-Type': contentType,
        'x-upsert': 'true',
      },
      body: buffer,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new StorageUploadError(res.status);

    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${objectPath}`;
  }
}
