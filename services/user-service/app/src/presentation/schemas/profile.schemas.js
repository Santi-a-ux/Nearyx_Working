import { z } from 'zod';
import { isUuid } from '../../domain/identifiers.js';

// Limits match the users.profiles column sizes (the Python service answered 500 when they were exceeded).
const text = (max) => z.string().max(max).nullish();

export const createProfileSchema = z.object({
  display_name: z.string().max(100),
  bio: z.string().nullish(),
  avatar_url: text(500),
  location_name: text(200),
});

export const updateProfileSchema = z.object({
  display_name: text(100),
  bio: z.string().nullish(),
  avatar_url: text(500),
  location_name: text(200),
});

export const userIdParamSchema = z.object({
  user_id: z
    .string()
    .refine(isUuid, 'Input should be a valid UUID')
    .transform((s) => s.toLowerCase()),
});
