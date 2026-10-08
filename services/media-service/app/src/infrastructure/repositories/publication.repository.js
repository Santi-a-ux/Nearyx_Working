import { randomUUID } from 'node:crypto';
import { Publication } from '../../domain/entities/Publication.js';

const toEntity = (row) =>
  row
    ? new Publication({
        id: row.id,
        authorId: row.author_id,
        authorName: row.author_name,
        authorAvatar: row.author_avatar,
        authorRole: row.author_role,
        content: row.content,
        imageUrl: row.image_url,
        createdAt: row.created_at,
      })
    : null;

// Only these fields can change after creation (PublicationUpdate in the Python service).
const UPDATABLE = { content: 'content', imageUrl: 'image_url', authorRole: 'author_role' };

export class PublicationRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async list(limit, offset) {
    const [count, page] = await Promise.all([
      this.pool.query('SELECT COUNT(*)::int AS total FROM feed.posts'),
      this.pool.query('SELECT * FROM feed.posts ORDER BY created_at DESC, id DESC LIMIT $1 OFFSET $2', [limit, offset]),
    ]);
    return { publications: page.rows.map(toEntity), total: count.rows[0].total };
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM feed.posts WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async create(p) {
    const { rows } = await this.pool.query(
      `INSERT INTO feed.posts (id, author_id, author_name, author_avatar, author_role, content, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [randomUUID(), p.authorId, p.authorName, p.authorAvatar, p.authorRole, p.content, p.imageUrl],
    );
    return toEntity(rows[0]);
  }

  /** `changes` only holds the fields that were sent; an explicit null clears a nullable column. */
  async update(id, changes) {
    const keys = Object.keys(UPDATABLE).filter((k) => Object.hasOwn(changes, k));
    if (keys.length === 0) return this.findById(id);

    const sets = keys.map((k, i) => `${UPDATABLE[k]} = $${i + 2}`).join(', ');
    const { rows } = await this.pool.query(
      `UPDATE feed.posts SET ${sets} WHERE id = $1 RETURNING *`,
      [id, ...keys.map((k) => changes[k])],
    );
    return toEntity(rows[0]);
  }

  /** Deletes the post and its comments atomically (comments have no FK, so they would be orphaned). */
  async delete(id) {
    await this.pool.query(
      `WITH c AS (DELETE FROM feed.comments WHERE post_id = $1)
       DELETE FROM feed.posts WHERE id = $1`,
      [id],
    );
  }
}
