import { toConversationDto, toMessageDto } from '../dtos/chat.dto.js';

export class ChatController {
  constructor(chatService) {
    this.chatService = chatService;
  }

  createConversation = async (req, res) => {
    const conversation = await this.chatService.getOrCreateConversation(
      req.user.userId,
      req.valid.body.participant_id,
    );
    res.json({ id: conversation.id });
  };

  listConversations = async (req, res) => {
    const items = await this.chatService.listConversations(req.user.userId);
    res.json(items.map((item) => toConversationDto(item, req.user.userId)));
  };

  getMessages = async (req, res) => {
    const messages = await this.chatService.getMessages(req.user.userId, req.valid.params.conversation_id);
    res.json(messages.map(toMessageDto));
  };

  unreadCount = async (req, res) => {
    res.json({ count: await this.chatService.countUnread(req.user.userId) });
  };
}
