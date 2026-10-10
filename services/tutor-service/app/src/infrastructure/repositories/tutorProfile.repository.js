import { randomUUID } from 'node:crypto';
import { TutorProfile } from '../../domain/entities/TutorProfile.js';
import { SEMANTIC_SEARCH } from '../../domain/searchPolicy.js';
import { BusinessRuleError } from '../../domain/errors/index.js';
import { toVectorLiteral } from './vector.js';

const UNIQUE_VIOLATION = '23505';

// `embedding` is deliberately not selected: it is only written / compared, never returned.
const COLS = `id, user_id, specialties, categories, is_available, hourly_rate, years_experience,
  verification_status, preferred_payment_method, created_at, updated_at,
  ST_Y(coordinates) AS lat, ST_X(coordinates) AS lng`;

const toEntity = (row) =>
  row
    ? new TutorProfile({
        id: row.id,
        userId: row.user_id,
        specialties: row.specialties,
        categories: row.categories,
        isAvailable: row.is_available,
        hourlyRate: row.hourly_rate, // NUMERIC arrives as a string ("25.00"), like the Python Decimal
        yearsExperience: row.years_experience,
        verificationStatus: row.verification_status,
        preferredPaymentMethod: row.preferred_payment_method,
        lat: row.lat,
        lng: row.lng,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    : null;

// A point is only used when lat, lng and radius are all present.
const geoParams = ({ lat, lng, radius } = {}) =>
  lat != null && lng != null && radius != null ? [lat, lng, radius] : [null, null, null];

const DISTANCE = 'ST_DistanceSphere(coordinates, ST_SetSRID(ST_MakePoint($4::float8, $3::float8), 4326))';

export class TutorProfileRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async findByUserId(userId) {
    const { rows } = await this.pool.query(`SELECT ${COLS} FROM tutors.profiles WHERE user_id = $1 LIMIT 1`, [userId]);
    return toEntity(rows[0]);
  }

  async exists(userId) {
    const { rowCount } = await this.pool.query('SELECT 1 FROM tutors.profiles WHERE user_id = $1', [userId]);
    return rowCount > 0;
  }

  /** `embedding`: number[] | null. */
  async create(profile, embedding) {
    try {
      const { rows } = await this.pool.query(
        `INSERT INTO tutors.profiles
           (id, user_id, specialties, categories, is_available, hourly_rate, years_experience,
            preferred_payment_method, coordinates, embedding)
         VALUES ($1, $2, $3::text[], $4::text[], $5::boolean, $6::numeric, $7::int, $8::text,
           CASE WHEN $9::float8 IS NOT NULL AND $10::float8 IS NOT NULL
                THEN ST_SetSRID(ST_MakePoint($10::float8, $9::float8), 4326) END,
           $11::text::vector)
         RETURNING ${COLS}`,
        [
          randomUUID(), profile.userId, profile.specialties, profile.categories, profile.isAvailable,
          profile.hourlyRate, profile.yearsExperience, profile.preferredPaymentMethod,
          profile.lat, profile.lng, toVectorLiteral(embedding),
        ],
      );
      return toEntity(rows[0]);
    } catch (err) {
      // Two concurrent creates for the same user: UNIQUE(user_id) decides.
      if (err.code === UNIQUE_VIOLATION) throw new BusinessRuleError('Profile already exists');
      throw err;
    }
  }

  /**
   * Writes the whole profile. `coordinatesChanged` / `embeddingChanged` tell which of the two special
   * columns must be overwritten (otherwise they keep their value).
   */
  async update(profile, { coordinatesChanged, embeddingChanged, embedding }) {
    const { rows } = await this.pool.query(
      `UPDATE tutors.profiles
          SET specialties = $2::text[], categories = $3::text[], is_available = $4::boolean,
              hourly_rate = $5::numeric, years_experience = $6::int, preferred_payment_method = $7::text,
              coordinates = CASE WHEN $8::boolean
                                 THEN ST_SetSRID(ST_MakePoint($10::float8, $9::float8), 4326)
                                 ELSE coordinates END,
              embedding = CASE WHEN $11::boolean THEN $12::text::vector ELSE embedding END,
              updated_at = now()
        WHERE user_id = $1
        RETURNING ${COLS}`,
      [
        profile.userId, profile.specialties, profile.categories, profile.isAvailable, profile.hourlyRate,
        profile.yearsExperience, profile.preferredPaymentMethod, coordinatesChanged, profile.lat, profile.lng,
        embeddingChanged, toVectorLiteral(embedding),
      ],
    );
    return toEntity(rows[0]);
  }

  async setAvailability(userId, isAvailable) {
    const { rows } = await this.pool.query(
      `UPDATE tutors.profiles SET is_available = $2, updated_at = now() WHERE user_id = $1 RETURNING ${COLS}`,
      [userId, isAvailable],
    );
    return toEntity(rows[0]);
  }

  /** Profiles without embedding (for the backfill script). */
  async listWithoutEmbedding() {
    const { rows } = await this.pool.query(`SELECT ${COLS} FROM tutors.profiles WHERE embedding IS NULL`);
    return rows.map(toEntity);
  }

  /** Every profile (for `backfill:embeddings --all`, e.g. after changing EMBEDDING_DTYPE). */
  async listAllProfiles() {
    const { rows } = await this.pool.query(`SELECT ${COLS} FROM tutors.profiles`);
    return rows.map(toEntity);
  }

  async setEmbedding(userId, embedding) {
    await this.pool.query('UPDATE tutors.profiles SET embedding = $2::text::vector WHERE user_id = $1', [
      userId,
      toVectorLiteral(embedding),
    ]);
  }

  /** Rows that already have an embedding, with its text form (for the parity check script). */
  async listWithEmbeddingText(limit) {
    const { rows } = await this.pool.query(
      `SELECT user_id, specialties, categories, embedding::text AS embedding_text
         FROM tutors.profiles WHERE embedding IS NOT NULL ORDER BY created_at LIMIT $1`,
      [limit],
    );
    return rows;
  }

  /** Cosine distance of every profile with embedding to `embedding` (for the debug script). */
  async distancesTo(embedding) {
    const { rows } = await this.pool.query(
      `SELECT id, specialties, categories, embedding <=> $1::text::vector AS distance
         FROM tutors.profiles WHERE embedding IS NOT NULL ORDER BY distance`,
      [toVectorLiteral(embedding)],
    );
    return rows;
  }

  /**
   * Semantic search. Relevance is relative to the best match of the WHOLE table (not only the filtered
   * rows), exactly like the Python service: see SEMANTIC_SEARCH.
   */
  async searchSemantic({ embedding, isAvailable = null, geo, limit, offset }) {
    const [lat, lng, radius] = geoParams(geo);
    const { rows } = await this.pool.query(
      `WITH q AS (SELECT $1::text::vector AS v),
            pack AS (
              SELECT MIN(d) AS best,
                     percentile_cont(0.5) WITHIN GROUP (ORDER BY d) AS median,
                     COUNT(*) AS n
                FROM (SELECT embedding <=> (SELECT v FROM q) AS d
                        FROM tutors.profiles WHERE embedding IS NOT NULL) x
            )
       SELECT ${COLS}, embedding <=> q.v AS semantic_distance
         FROM tutors.profiles, q, pack
        WHERE embedding IS NOT NULL
          AND ($2::boolean IS NULL OR is_available = $2::boolean)
          AND ($3::float8 IS NULL OR ${DISTANCE} <= $5::float8)
          AND embedding <=> q.v < $8::float8
          AND embedding <=> q.v <= pack.best + $9::float8
          AND (pack.n < $11::int OR pack.best <= pack.median - $10::float8)
        ORDER BY semantic_distance
        LIMIT $6 OFFSET $7`,
      [
        toVectorLiteral(embedding), isAvailable, lat, lng, radius, limit, offset,
        SEMANTIC_SEARCH.absoluteCeiling, SEMANTIC_SEARCH.relativeMargin, SEMANTIC_SEARCH.minSeparation,
        SEMANTIC_SEARCH.minProfilesForSeparation,
      ],
    );
    return rows.map(toEntity);
  }

  /** Tutors within `radius` meters of the point, nearest first. */
  async searchNearby({ category = null, isAvailable = null, lat, lng, radius, limit, offset }) {
    const { rows } = await this.pool.query(
      `SELECT ${COLS}, ${DISTANCE} AS distance
         FROM tutors.profiles
        WHERE ($1::text IS NULL OR $1::text = ANY(categories))
          AND ($2::boolean IS NULL OR is_available = $2::boolean)
          AND ${DISTANCE} <= $5::float8
        ORDER BY distance
        LIMIT $6 OFFSET $7`,
      [category, isAvailable, lat, lng, radius, limit, offset],
    );
    return rows.map(toEntity);
  }

  /** Plain listing; newest first so pagination is stable (the Python service had no ORDER BY). */
  async listAll({ category = null, isAvailable = null, limit, offset }) {
    const filter = `($1::text IS NULL OR $1::text = ANY(categories)) AND ($2::boolean IS NULL OR is_available = $2::boolean)`;
    const [count, page] = await Promise.all([
      this.pool.query(`SELECT COUNT(*)::int AS total FROM tutors.profiles WHERE ${filter}`, [category, isAvailable]),
      this.pool.query(
        `SELECT ${COLS} FROM tutors.profiles WHERE ${filter} ORDER BY created_at DESC, id LIMIT $3 OFFSET $4`,
        [category, isAvailable, limit, offset],
      ),
    ]);
    return { tutors: page.rows.map(toEntity), total: count.rows[0].total };
  }
}
