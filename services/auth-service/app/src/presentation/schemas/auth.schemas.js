import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email(),
  role: z.string(),
  password: z.string(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const refreshSchema = z.object({ refresh_token: z.string() });

export const verifyTokenSchema = z.object({ token: z.string() });
