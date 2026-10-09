import { randomUUID } from 'node:crypto';
import { withTransaction } from '../database/pool.js';

const toRequest = (row) =>
  row
    ? {
        id: row.id,
        userId: row.user_id,
        status: row.status,
        summary: row.summary,
        education: row.education ?? [],
        certifications: row.certifications ?? [],
        experience: row.experience ?? [],
        skills: row.skills ?? [],
        reviewNotes: row.review_notes,
        reviewedBy: row.reviewed_by,
        reviewedAt: row.reviewed_at,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }
    : null;

const toDocument = (row) => ({
  id: row.id,
  requestId: row.request_id,
  fileUrl: row.file_url,
  fileName: row.file_name,
  docType: row.doc_type,
  createdAt: row.created_at,
});

export class VerificationRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /** Newest request of the user, optionally restricted to one status. */
  async findLatest(userId, status = null) {
    const { rows } = await this.pool.query(
      `SELECT * FROM tutors.verification_requests
        WHERE user_id = $1 AND ($2::text IS NULL OR status = $2::text)
        ORDER BY created_at DESC LIMIT 1`,
      [userId, status],
    );
    return toRequest(rows[0]);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM tutors.verification_requests WHERE id = $1', [id]);
    return toRequest(rows[0]);
  }

  /** { requestId: [documents] } resolved with a single query. */
  async documentsByRequest(requestIds) {
    const grouped = Object.fromEntries(requestIds.map((id) => [id, []]));
    if (requestIds.length === 0) return grouped;
    const { rows } = await this.pool.query(
      'SELECT * FROM tutors.verification_documents WHERE request_id = ANY($1::uuid[]) ORDER BY created_at, id',
      [requestIds],
    );
    for (const row of rows) grouped[row.request_id].push(toDocument(row));
    return grouped;
  }

  /** Request + documents + profile status 'pending', all or nothing. */
  async createWithDocuments(userId, data) {
    return withTransaction(async (client) => {
      const requestId = randomUUID();
      const { rows } = await client.query(
        `INSERT INTO tutors.verification_requests
           (id, user_id, status, summary, education, certifications, experience, skills)
         VALUES ($1, $2, 'pending', $3, $4::jsonb, $5::jsonb, $6::jsonb, $7::text[])
         RETURNING *`,
        [
          requestId, userId, data.summary, JSON.stringify(data.education), JSON.stringify(data.certifications),
          JSON.stringify(data.experience), data.skills,
        ],
      );
      const documents = [];
      for (const doc of data.documents) {
        const { rows: docRows } = await client.query(
          `INSERT INTO tutors.verification_documents (id, request_id, file_url, file_name, doc_type)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [randomUUID(), requestId, doc.fileUrl, doc.fileName, doc.docType],
        );
        documents.push(toDocument(docRows[0]));
      }
      await client.query(
        "UPDATE tutors.profiles SET verification_status = 'pending', updated_at = now() WHERE user_id = $1",
        [userId],
      );
      return { request: toRequest(rows[0]), documents };
    });
  }

  async list(status, limit, offset) {
    const filter = '($1::text IS NULL OR status = $1::text)';
    const [count, page] = await Promise.all([
      this.pool.query(`SELECT COUNT(*)::int AS total FROM tutors.verification_requests WHERE ${filter}`, [status]),
      this.pool.query(
        `SELECT * FROM tutors.verification_requests WHERE ${filter}
          ORDER BY created_at DESC, id LIMIT $2 OFFSET $3`,
        [status, limit, offset],
      ),
    ]);
    return { requests: page.rows.map(toRequest), total: count.rows[0].total };
  }

  /**
   * Closes a pending request and syncs the tutor profile status in one transaction.
   * Returns null if the request is no longer pending (someone reviewed it first).
   */
  async review(requestId, { status, notes, reviewerId, profileStatus }) {
    return withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE tutors.verification_requests
            SET status = $2, review_notes = $3, reviewed_by = $4, reviewed_at = now(), updated_at = now()
          WHERE id = $1 AND status = 'pending'
          RETURNING *`,
        [requestId, status, notes, reviewerId],
      );
      if (rows.length === 0) return null;
      await client.query(
        'UPDATE tutors.profiles SET verification_status = $2, updated_at = now() WHERE user_id = $1',
        [rows[0].user_id, profileStatus],
      );
      return toRequest(rows[0]);
    });
  }
}
