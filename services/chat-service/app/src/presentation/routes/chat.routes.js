import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { createConversationSchema, conversationIdParamSchema } from '../schemas/chat.schemas.js';

export function createChatRouter({ controller, authenticate }) {
  const router = Router();

  router.post('/conversations', authenticate, validate('body', createConversationSchema), controller.createConversation);
  router.get('/conversations', authenticate, controller.listConversations);
  router.get(
    '/conversations/:conversation_id/messages',
    authenticate,
    validate('params', conversationIdParamSchema),
    controller.getMessages,
  );
  router.get('/unread-count', authenticate, controller.unreadCount);

  return router;
}
