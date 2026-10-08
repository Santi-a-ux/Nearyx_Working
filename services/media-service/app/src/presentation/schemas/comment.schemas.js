import { z } from 'zod';
import { uuid } from './publication.schemas.js';

export const createCommentSchema = z.object({
  post_id: uuid,
  author_id: uuid,
  author_name: z.string().min(1).max(120),
  author_avatar: z.string().max(500).nullish(),
  content: z.string().min(1),
});

export const postIdParamSchema = z.object({ post_id: uuid });

export const commentParamsSchema = z.object({ post_id: uuid, comment_id: uuid });
