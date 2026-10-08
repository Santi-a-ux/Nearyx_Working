import { Message } from '../../domain/entities/Message.js';
import { ConversationNotFoundError, NotParticipantError } from '../../domain/errors/index.js';

export class ChatService {
  constructor({ conversationRepository, messageRepository }) {
    this.conversationRepository = conversationRepository;
    this.messageRepository = messageRepository;
  }

  async getOrCreateConversation(userId, participantId) {
    const existing = await this.conversationRepository.findByParticipants([userId, participantId]);
    return existing ?? this.conversationRepository.create([userId, participantId]);
  }

  listConversations(userId) {
    return this.conversationRepository.listWithLastMessage(userId);
  }

  /** Returns the messages and marks the ones sent by the other participants as read. */
  async getMessages(userId, conversationId) {
    await this.#requireParticipant(userId, conversationId);
    await this.messageRepository.markAsRead(conversationId, userId);
    return this.messageRepository.findByConversation(conversationId);
  }

  countUnread(userId) {
    return this.messageRepository.countUnread(userId);
  }

  /** Persists a message; the caller fans it out to `recipientIds` (realtime is a presentation concern). */
  async sendMessage(senderId, { conversationId, content }) {
    const conversation = await this.#requireParticipant(senderId, conversationId);
    const message = await this.messageRepository.createAndTouchConversation(
      Message.create({ conversationId, senderId, content }),
    );
    return { message, recipientIds: conversation.recipientsFor(senderId) };
  }

  async #requireParticipant(userId, conversationId) {
    const conversation = await this.conversationRepository.findById(conversationId);
    if (!conversation) throw new ConversationNotFoundError();
    if (!conversation.isParticipant(userId)) throw new NotParticipantError();
    return conversation;
  }
}
