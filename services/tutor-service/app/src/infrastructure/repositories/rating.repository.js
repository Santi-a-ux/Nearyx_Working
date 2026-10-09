import { randomUUID } from 'node:crypto';

export class RatingRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /** Atomic upsert on UNIQUE(tutor_user_id, rater_user_id): one rating per rater, edited in place. */
  async upsert({ tutorUserId, raterUserId, rating, comment }) {
    await this.pool.query(
      `INSERT INTO tutors.ratings (id, tutor_user_id, rater_user_id, rating, comment)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (tutor_user_id, rater_user_id)
       DO UPDATE SET rating = EXCLUDED.rating, comment = EXCLUDED.comment, updated_at = now()`,
      [randomUUID(), tutorUserId, raterUserId, rating, comment ?? null],
    );
  }

  async summaryFor(tutorUserId, raterUserId) {
    const [stats, mine, reviews] = await Promise.all([
      this.pool.query(
        `SELECT AVG(rating)::float8 AS average_rating, COUNT(*)::int AS ratings_count
           FROM tutors.ratings WHERE tutor_user_id = $1`,
        [tutorUserId],
      ),
      this.pool.query(
        'SELECT rating, comment FROM tutors.ratings WHERE tutor_user_id = $1 AND rater_user_id = $2',
        [tutorUserId, raterUserId],
      ),
      this.pool.query(
        `SELECT rating, comment, rater_user_id, created_at, updated_at
           FROM tutors.ratings WHERE tutor_user_id = $1 ORDER BY created_at DESC, id`,
        [tutorUserId],
      ),
    ]);
    return {
      averageRating: stats.rows[0].average_rating,
      ratingsCount: stats.rows[0].ratings_count,
      myRating: mine.rows[0]?.rating ?? null,
      myComment: mine.rows[0]?.comment ?? null,
      reviews: reviews.rows.map((r) => ({
        rating: r.rating,
        comment: r.comment,
        raterUserId: r.rater_user_id,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
    };
  }
}
