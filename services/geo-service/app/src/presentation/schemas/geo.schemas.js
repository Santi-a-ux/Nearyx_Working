import { z } from 'zod';

const float = z
  .string()
  .refine((s) => s.trim() !== '' && Number.isFinite(Number(s)), 'Input should be a valid number')
  .transform(Number);

export const geocodeQuerySchema = z.object({ q: z.string() });

export const reverseGeocodeQuerySchema = z.object({ lat: float, lng: float });
