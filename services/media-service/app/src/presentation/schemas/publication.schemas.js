import { z } from 'zod';
import { isUuid } from '../../domain/identifiers.js';

export const uuid = z
  .string()
  .refine(isUuid, 'Input should be a valid UUID')
  .transform((s) => s.toLowerCase());

export const createPublicationSchema = z.object({
  author_id: uuid,
  author_name: z.string().min(1).max(120),
  author_avatar: z.string().max(500).nullish(),
  author_role: z.string().max(30).nullish(),
  content: z.string().min(1),
  image_url: z.string().max(500).nullish(),
});

// Only the fields that are sent are applied; image_url / author_role accept null to clear them.
export const updatePublicationSchema = z.object({
  content: z.string().min(1).optional(),
  image_url: z.string().max(500).nullable().optional(),
  author_role: z.string().max(30).nullable().optional(),
});

export const listPublicationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const publicationIdParamSchema = z.object({ publication_id: uuid });
