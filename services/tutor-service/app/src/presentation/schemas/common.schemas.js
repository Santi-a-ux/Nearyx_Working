import { z } from 'zod';
import { isUuid } from '../../domain/identifiers.js';

export const uuid = z
  .string()
  .refine(isUuid, 'Input should be a valid UUID')
  .transform((s) => s.toLowerCase());

const TRUE_VALUES = ['true', '1', 'yes', 'on', 't', 'y'];
const FALSE_VALUES = ['false', '0', 'no', 'off', 'f', 'n'];

/** Query-string boolean, with the spellings FastAPI accepts. */
export const queryBool = z.preprocess((v) => {
  if (typeof v !== 'string') return v;
  const s = v.toLowerCase();
  if (TRUE_VALUES.includes(s)) return true;
  if (FALSE_VALUES.includes(s)) return false;
  return v;
}, z.boolean());

const blankToUndefined = (v) => (v === '' ? undefined : v);
export const optionalNumber = z.preprocess(blankToUndefined, z.coerce.number().finite().optional());
export const optionalInt = z.preprocess(blankToUndefined, z.coerce.number().int().optional());

export const pagination = (defaultLimit) => ({
  limit: z.coerce.number().int().min(1).max(200).default(defaultLimit),
  offset: z.coerce.number().int().min(0).default(0),
});
