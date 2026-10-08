import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { uploadFile } from '../middlewares/uploadFile.js';
import { fileIdParamSchema } from '../schemas/media.schemas.js';

// Mounted after the posts/comments routers: `/:file_id` must not shadow `/posts`.
export function createMediaRouter({ controller, authenticate }) {
  const router = Router();

  router.post('/upload', authenticate, uploadFile, controller.upload);
  router.get('/files/*file_path', controller.redirectToContent);
  router.get('/:file_id', validate('params', fileIdParamSchema), controller.getMetadata);
  router.delete('/:file_id', authenticate, validate('params', fileIdParamSchema), controller.delete);

  return router;
}
