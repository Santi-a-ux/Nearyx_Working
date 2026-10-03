import { randomUUID } from 'node:crypto';
import { Booking } from '../../domain/entities/Booking.js';

const toEntity = (row) =>
  row
    ? new Booking({
        id: row.id,
        studentId: row.student_id,
        tutorId: row.tutor_id,
        scheduledStart: row.scheduled_start,
        scheduledEnd: row.scheduled_end,
        status: row.status,
        sessionNotes: row.session_notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    : null;

export class BookingRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async create(booking) {
    const { rows } = await this.pool.query(
      `INSERT INTO bookings.bookings (id, student_id, tutor_id, scheduled_start, scheduled_end, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [randomUUID(), booking.studentId, booking.tutorId, booking.scheduledStart, booking.scheduledEnd, booking.status],
    );
    return toEntity(rows[0]);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM bookings.bookings WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async findByParticipant(userId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM bookings.bookings WHERE tutor_id = $1 OR student_id = $1',
      [userId],
    );
    return rows.map(toEntity);
  }

  async updateStatus(id, status) {
    const { rows } = await this.pool.query(
      'UPDATE bookings.bookings SET status = $2, updated_at = now() WHERE id = $1 RETURNING *',
      [id, status],
    );
    return toEntity(rows[0]);
  }
}
