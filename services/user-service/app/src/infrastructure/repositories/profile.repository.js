import { randomUUID } from 'node:crypto';
import { UserProfile } from '../../domain/entities/UserProfile.js';
import { ProfileAlreadyExistsError } from '../../domain/errors/index.js';

const UNIQUE_VIOLATION = '23505';

const toEntity = (row) =>
  row
    ? new UserProfile({
        id: row.id,
        userId: row.user_id,
        displayName: row.display_name,
        bio: row.bio,
        avatarUrl: row.avatar_url,
        locationName: row.location_name,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    : null;

export class ProfileRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByUserId(userId) {
    const { rows } = await this.pool.query('SELECT * FROM users.profiles WHERE user_id = $1 LIMIT 1', [userId]);
    return toEntity(rows[0]);
  }

  async create(profile) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO users.profiles (id, user_id, display_name, bio, avatar_url, location_name)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [randomUUID(), profile.userId, profile.displayName, profile.bio, profile.avatarUrl, profile.locationName],
      );
      return toEntity(rows[0]);
    } catch (err) {
      // Two concurrent creates for the same user: the UNIQUE(user_id) constraint decides.
      if (err.code === UNIQUE_VIOLATION) throw new ProfileAlreadyExistsError();
      throw err;
    }
  }

  async update(profile) {
    const { rows } = await this.pool.query(
      `UPDATE users.profiles
          SET display_name = $2, bio = $3, avatar_url = $4, location_name = $5, updated_at = now()
        WHERE user_id = $1
        RETURNING *`,
      [profile.userId, profile.displayName, profile.bio, profile.avatarUrl, profile.locationName],
    );
    return toEntity(rows[0]);
  }
}
