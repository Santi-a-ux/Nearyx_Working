import { randomUUID } from 'node:crypto';
import { Conversation } from '../../domain/entities/Conversation.js';

const toEntity = (row) =>
  row
    ? new Conversation({
        id: row.id,
        participantIds: row.participant_ids,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })
    : null;

export class ConversationRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /** A conversation whose participants include every id given (array containment, like SQLAlchemy .contains). */
  async findByParticipants(userIds) {
    const { rows } = await this.pool.query(
      'SELECT * FROM chat.conversations WHERE participant_ids @> $1::uuid[] LIMIT 1',
      [userIds],
    );
    return toEntity(rows[0]);
  }

  async findById(id) {
    const { rows } = await this.pool.query('SELECT * FROM chat.conversations WHERE id = $1 LIMIT 1', [id]);
    return toEntity(rows[0]);
  }

  async create(participantIds) {
    const { rows } = await this.pool.query(
      'INSERT INTO chat.conversations (id, participant_ids) VALUES ($1, $2::uuid[]) RETURNING *',
      [randomUUID(), participantIds],
    );
    return toEntity(rows[0]);
  }

  /** Conversations of a user, newest first, each with its last message (single query, no N+1). */
  async listWithLastMessage(userId) {
    const { rows } = await this.pool.query(
      `SELECT c.*, lm.content AS last_message_content, lm.created_at AS last_message_created_at
         FROM chat.conversations c
         LEFT JOIN LATERAL (
           SELECT m.content, m.created_at
             FROM chat.messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.created_at DESC
            LIMIT 1
         ) lm ON TRUE
        WHERE c.participant_ids @> ARRAY[$1::uuid]
        ORDER BY c.updated_at DESC`,
      [userId],
    );
    return rows.map((row) => ({
      conversation: toEntity(row),
      lastMessage: row.last_message_content === null
        ? null
        : { content: row.last_message_content, createdAt: row.last_message_created_at },
    }));
  }
}
