import { z } from 'zod';
import { uuid } from './publication.schemas.js';

export const fileIdParamSchema = z.object({ file_id: uuid });
