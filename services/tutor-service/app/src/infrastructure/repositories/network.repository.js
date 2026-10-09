/**
 * Read-only queries over tables owned by other services (chat, bookings, auth, users):
 * the recommendations graph is built from real connections only.
 */
export class NetworkRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /** Direct edges (chat, or non-cancelled booking) leaving any of `userIds`: [{ source, target, type }]. */
  async directEdgesFor(userIds) {
    if (userIds.length === 0) return [];

    const [chat, bookings] = await Promise.all([
      this.pool.query(
        `SELECT DISTINCT a.user_id AS source, b.user_id AS target
           FROM chat.conversations c
           CROSS JOIN LATERAL unnest(c.participant_ids) AS a(user_id)
           CROSS JOIN LATERAL unnest(c.participant_ids) AS b(user_id)
          WHERE a.user_id = ANY($1::uuid[]) AND b.user_id <> a.user_id`,
        [userIds],
      ),
      this.pool.query(
        `SELECT student_id AS source, tutor_id AS target
           FROM bookings.bookings
          WHERE status NOT IN ('cancelled', 'rejected')
            AND (student_id = ANY($1::uuid[]) OR tutor_id = ANY($1::uuid[]))`,
        [userIds],
      ),
    ]);

    const edges = chat.rows.map((r) => ({ source: r.source, target: r.target, type: 'chat' }));
    for (const r of bookings.rows) {
      if (userIds.includes(r.source)) edges.push({ source: r.source, target: r.target, type: 'booking' });
      if (userIds.includes(r.target)) edges.push({ source: r.target, target: r.source, type: 'booking' });
    }
    return edges;
  }

  /** Public data of the active users in `userIds`. */
  async nodesFor(userIds) {
    const { rows } = await this.pool.query(
      `SELECT au.id AS user_id, au.role, up.display_name, up.bio, up.avatar_url, tp.specialties, tp.categories
         FROM authe.users au
         LEFT JOIN users.profiles up ON up.user_id = au.id
         LEFT JOIN tutors.profiles tp ON tp.user_id = au.id
        WHERE au.id = ANY($1::uuid[]) AND au.is_active = TRUE`,
      [userIds],
    );
    return rows.map((r) => ({
      userId: r.user_id,
      role: r.role,
      displayName: r.display_name,
      bio: r.bio,
      avatarUrl: r.avatar_url,
      specialties: r.specialties ?? [],
      categories: r.categories ?? [],
    }));
  }
}
