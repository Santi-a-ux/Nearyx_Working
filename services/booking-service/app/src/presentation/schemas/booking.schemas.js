import { z } from 'zod';
import { isUuid, isUuidV4 } from '../../domain/identifiers.js';

const uuid4 = z
  .string()
  .refine(isUuidV4, 'Input should be a valid UUID, version 4')
  .transform((s) => s.toLowerCase());

const uuid = z
  .string()
  .refine(isUuid, 'Input should be a valid UUID')
  .transform((s) => s.toLowerCase());

const dateTime = z
  .string()
  .refine((s) => !Number.isNaN(new Date(s).getTime()), 'Input should be a valid datetime')
  .transform((s) => new Date(s));

export const createBookingSchema = z.object({
  tutor_id: uuid4,
  scheduled_start: dateTime,
  scheduled_end: dateTime,
});

export const updateStatusSchema = z.object({ status: z.string() });

export const bookingIdParamSchema = z.object({ booking_id: uuid });
