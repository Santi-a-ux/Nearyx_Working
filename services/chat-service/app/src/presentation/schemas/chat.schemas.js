import { z } from 'zod';
import { isUuid } from '../../domain/identifiers.js';

const uuid = z
  .string()
  .refine(isUuid, 'Input should be a valid UUID')
  .transform((s) => s.toLowerCase());

export const createConversationSchema = z.object({ participant_id: uuid });

export const conversationIdParamSchema = z.object({ conversation_id: uuid });

// WebSocket client frame. `receiver_id` (sent by the current frontend) is ignored on purpose:
// recipients come from the conversation participants, so a client cannot push to arbitrary users.
export const incomingFrameSchema = z.object({
  conversation_id: uuid,
  content: z.string(),
});
