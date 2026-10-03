import { randomUUID } from 'node:crypto';
import { User } from '../../domain/entities/User.js';
import { EmailAlreadyRegisteredError } from '../../domain/errors/index.js';

const toEntity = (row) =>
  row
    ? new User({
        id: row.id,
        email: row.email,
        passwordHash: row.password_hash,
        role: row.role,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    : null;

export class UserRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM authe.users WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async findByEmail(email) {
    const { rows } = await this.pool.query('SELECT * FROM authe.users WHERE email = $1 LIMIT 1', [email]);
    return toEntity(rows[0]);
  }

  async create({ email, passwordHash, role }) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO authe.users (id, email, password_hash, role)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [randomUUID(), email, passwordHash, role],
      );
      return toEntity(rows[0]);
    } catch (err) {
      if (err.code === '23505') throw new EmailAlreadyRegisteredError(); // unique_violation (race)
      throw err;
    }
  }

  async updateRole(id, role) {
    const { rows } = await this.pool.query(
      'UPDATE authe.users SET role = $2, updated_at = now() WHERE id = $1 RETURNING *',
      [id, role],
    );
    return toEntity(rows[0]);
  }
}
