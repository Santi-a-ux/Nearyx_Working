export const toConversationDto = ({ conversation, lastMessage }, userId) => ({
  id: conversation.id,
  participant_ids: conversation.participantIds,
  other_participant_id: conversation.otherParticipantId(userId),
  last_message: lastMessage?.content ?? null,
  last_message_at: lastMessage?.createdAt ?? conversation.updatedAt,
  updated_at: conversation.updatedAt,
});

export const toMessageDto = (m) => ({
  id: m.id,
  sender_id: m.senderId,
  content: m.content,
  is_read: m.isRead,
  created_at: m.createdAt,
});

// Frame pushed through WebSocket. Superset of the Python one ({conversation_id, sender_id, content}).
export const toRealtimeMessageDto = (m) => ({
  id: m.id,
  conversation_id: m.conversationId,
  sender_id: m.senderId,
  content: m.content,
  created_at: m.createdAt,
});
