import { InvalidMessageError } from '../errors/index.js';

export class Message {
  constructor({ id = null, conversationId, senderId, content, isRead = false, createdAt = null }) {
    this.id = id;
    this.conversationId = conversationId;
    this.senderId = senderId;
    this.content = content;
    this.isRead = isRead;
    this.createdAt = createdAt;
  }

  static create({ conversationId, senderId, content }) {
    if (typeof content !== 'string' || content.trim() === '') throw new InvalidMessageError();
    return new Message({ conversationId, senderId, content });
  }
}
