import { z } from 'zod';
import { uuid, queryBool, optionalNumber, optionalInt, pagination } from './common.schemas.js';

// NUMERIC(10,2): accepts a number or a numeric string, keeps it as a string for the database.
const hourlyRate = z
  .union([z.number(), z.string().regex(/^-?\d+(\.\d+)?$/, 'Input should be a valid decimal')])
  .transform(String)
  .refine((v) => Number(v) >= 0 && Number(v) < 1e8, 'hourly_rate must be between 0 and 99999999.99');

const profileFields = {
  specialties: z.array(z.string()).nullish(),
  categories: z.array(z.string()).nullish(),
  hourly_rate: hourlyRate.nullish(),
  years_experience: z.number().int().min(0).nullish(),
  lat: z.number().min(-90).max(90).nullish(),
  lng: z.number().min(-180).max(180).nullish(),
  is_available: z.boolean().nullish(),
  preferred_payment_method: z.string().max(50).nullish(),
};

export const createProfileSchema = z.object(profileFields);
export const updateProfileSchema = z.object(profileFields);

export const listTutorsQuerySchema = z.object({
  category: z.string().optional(),
  q: z.string().optional(),
  is_available: queryBool.optional(),
  lat: optionalNumber,
  lng: optionalNumber,
  radius: optionalInt,
  ...pagination(20),
});

export const availabilityQuerySchema = z.object({ is_available: queryBool });

export const userIdParamSchema = z.object({ user_id: uuid });

export const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(500).nullish(),
});
