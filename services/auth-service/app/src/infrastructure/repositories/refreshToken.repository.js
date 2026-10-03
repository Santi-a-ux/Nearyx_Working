import { randomUUID } from 'node:crypto';
import { RefreshToken } from '../../domain/entities/RefreshToken.js';

const toEntity = (row) =>
  new RefreshToken({
    id: row.id,
    userId: row.user_id,
    tokenHash: row.token_hash,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  });

const INSERT_SQL = `INSERT INTO authe.refresh_tokens (id, user_id, token_hash, expires_at)
                    VALUES ($1, $2, $3, $4)`;

export class RefreshTokenRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByUserId(userId) {
    const { rows } = await this.pool.query('SELECT * FROM authe.refresh_tokens WHERE user_id = $1', [userId]);
    return rows.map(toEntity);
  }

  async create({ userId, tokenHash, expiresAt }) {
    await this.pool.query(INSERT_SQL, [randomUUID(), userId, tokenHash, expiresAt]);
  }

  /** Token rotation: delete the old token and insert the new one atomically. */
  async replace(oldTokenId, { userId, tokenHash, expiresAt }) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM authe.refresh_tokens WHERE id = $1', [oldTokenId]);
      await client.query(INSERT_SQL, [randomUUID(), userId, tokenHash, expiresAt]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async deleteByUserId(userId) {
    await this.pool.query('DELETE FROM authe.refresh_tokens WHERE user_id = $1', [userId]);
  }
}
