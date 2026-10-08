import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  createPublicationSchema,
  updatePublicationSchema,
  listPublicationsQuerySchema,
  publicationIdParamSchema,
} from '../schemas/publication.schemas.js';

export function createPublicationRouter({ controller, authenticate }) {
  const router = Router();

  router.get('/posts', validate('query', listPublicationsQuerySchema), controller.list);
  router.post('/posts', authenticate, validate('body', createPublicationSchema), controller.create);
  router.get('/posts/:publication_id', validate('params', publicationIdParamSchema), controller.get);
  router.put(
    '/posts/:publication_id',
    authenticate,
    validate('params', publicationIdParamSchema),
    validate('body', updatePublicationSchema),
    controller.update,
  );
  router.delete('/posts/:publication_id', authenticate, validate('params', publicationIdParamSchema), controller.delete);

  return router;
}
