import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { StorageError, StorageNotConfiguredError } from '../../domain/errors/index.js';

const SAFE_EXT = /^\.[A-Za-z0-9]{1,10}$/;

/** Supabase Storage adapter over its REST API (upload, public URL, delete). */
export class SupabaseStorage {
  constructor({ url, key, bucket, timeoutMs = 20000 }) {
    this.baseUrl = url ? url.replace(/\/+$/, '') : null;
    this.key = key;
    this.bucket = bucket;
    this.timeoutMs = timeoutMs;
  }

  #requireConfig() {
    if (!this.baseUrl || !this.key) throw new StorageNotConfiguredError();
  }

  #encode(objectPath) {
    return objectPath.split('/').map(encodeURIComponent).join('/');
  }

  #headers(extra = {}) {
    return { Authorization: `Bearer ${this.key}`, apikey: this.key, ...extra };
  }

  /** Public URL of an object. Does not need credentials. */
  publicUrl(objectPath) {
    return `${this.baseUrl}/storage/v1/object/public/${this.bucket}/${this.#encode(objectPath)}`;
  }

  /** Stores `buffer` as <folder>/<uuid><ext> and returns { objectPath, url }. */
  async upload({ buffer, filename, folder, contentType }) {
    this.#requireConfig();

    const ext = path.extname(path.basename(filename));
    const name = `${randomUUID()}${SAFE_EXT.test(ext) ? ext : ''}`;
    const dir = String(folder).replace(/^\/+|\/+$/g, '');
    const objectPath = dir ? `${dir}/${name}` : name;

    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}/${this.#encode(objectPath)}`, {
      method: 'POST',
      headers: this.#headers({ 'Content-Type': contentType, 'x-upsert': 'true' }),
      body: buffer,
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new StorageError(res.status);

    return { objectPath, url: this.publicUrl(objectPath) };
  }

  async remove(objectPath) {
    this.#requireConfig();

    const res = await fetch(`${this.baseUrl}/storage/v1/object/${this.bucket}`, {
      method: 'DELETE',
      headers: this.#headers({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ prefixes: [objectPath] }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });
    if (!res.ok) throw new StorageError(res.status);
  }
}
