import { randomUUID } from 'node:crypto';
import { Comment } from '../../domain/entities/Comment.js';

const toEntity = (row) =>
  row
    ? new Comment({
        id: row.id,
        postId: row.post_id,
        authorId: row.author_id,
        authorName: row.author_name,
        authorAvatar: row.author_avatar,
        content: row.content,
        createdAt: row.created_at,
      })
    : null;

export class CommentRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async listByPost(postId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM feed.comments WHERE post_id = $1 ORDER BY created_at ASC, id ASC',
      [postId],
    );
    return rows.map(toEntity);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM feed.comments WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async create(c) {
    const { rows } = await this.pool.query(
      `INSERT INTO feed.comments (id, post_id, author_id, author_name, author_avatar, content)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [randomUUID(), c.postId, c.authorId, c.authorName, c.authorAvatar, c.content],
    );
    return toEntity(rows[0]);
  }

  async delete(id) {
    await this.pool.query('DELETE FROM feed.comments WHERE id = $1', [id]);
  }
}
