import { randomUUID } from 'node:crypto';
import { Message } from '../../domain/entities/Message.js';

const toEntity = (row) =>
  row
    ? new Message({
        id: row.id,
        conversationId: row.conversation_id,
        senderId: row.sender_id,
        content: row.content,
        isRead: row.is_read,
        createdAt: row.created_at,
      })
    : null;

export class MessageRepository {
  constructor(pool) {
    this.pool = pool;
  }

  /** Inserts the message and bumps conversation.updated_at atomically (single statement). */
  async createAndTouchConversation(message) {
    const { rows } = await this.pool.query(
      `WITH ins AS (
         INSERT INTO chat.messages (id, conversation_id, sender_id, content)
         VALUES ($1, $2, $3, $4)
         RETURNING *
       ), touch AS (
         UPDATE chat.conversations SET updated_at = now() WHERE id = $2
       )
       SELECT * FROM ins`,
      [randomUUID(), message.conversationId, message.senderId, message.content],
    );
    return toEntity(rows[0]);
  }

  async markAsRead(conversationId, readerId) {
    await this.pool.query(
      `UPDATE chat.messages SET is_read = TRUE
        WHERE conversation_id = $1 AND sender_id <> $2 AND is_read = FALSE`,
      [conversationId, readerId],
    );
  }

  async findByConversation(conversationId) {
    const { rows } = await this.pool.query(
      'SELECT * FROM chat.messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId],
    );
    return rows.map(toEntity);
  }

  async countUnread(userId) {
    const { rows } = await this.pool.query(
      `SELECT COUNT(m.id)::int AS count
         FROM chat.messages m
         JOIN chat.conversations c ON c.id = m.conversation_id
        WHERE c.participant_ids @> ARRAY[$1::uuid]
          AND m.sender_id <> $1::uuid
          AND m.is_read = FALSE`,
      [userId],
    );
    return rows[0]?.count ?? 0;
  }
}
