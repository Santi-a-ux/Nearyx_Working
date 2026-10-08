import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { ConversationRepository } from './infrastructure/repositories/conversation.repository.js';
import { MessageRepository } from './infrastructure/repositories/message.repository.js';
import { TokenVerifier } from './infrastructure/security/tokenVerifier.js';
import { RedisBroker } from './infrastructure/messaging/redisBroker.js';
import { UserChannels } from './infrastructure/realtime/userChannels.js';
import { ChatService } from './application/services/chat.service.js';
import { IdentityService } from './application/services/identity.service.js';
import { ChatController } from './presentation/controllers/chat.controller.js';
import { createAuthenticate } from './presentation/middlewares/authenticate.js';
import { createChatRouter } from './presentation/routes/chat.routes.js';

// Composition root: the only place where layers are wired together.
export function buildContainer() {
  const broker = new RedisBroker(config.redisUrl);
  const userChannels = new UserChannels({ broker });

  const chatService = new ChatService({
    conversationRepository: new ConversationRepository(pool),
    messageRepository: new MessageRepository(pool),
  });
  const identityService = new IdentityService({ tokenVerifier: new TokenVerifier(config.jwt) });

  const chatRouter = createChatRouter({
    controller: new ChatController(chatService),
    authenticate: createAuthenticate(identityService),
  });

  return { chatRouter, chatService, identityService, userChannels, broker };
}
