import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { createCommentSchema, postIdParamSchema, commentParamsSchema } from '../schemas/comment.schemas.js';

export function createCommentRouter({ controller, authenticate }) {
  const router = Router();

  router.get('/posts/:post_id/comments', validate('params', postIdParamSchema), controller.list);
  router.post(
    '/posts/:post_id/comments',
    authenticate,
    validate('params', postIdParamSchema),
    validate('body', createCommentSchema),
    controller.create,
  );
  router.delete(
    '/posts/:post_id/comments/:comment_id',
    authenticate,
    validate('params', commentParamsSchema),
    controller.delete,
  );

  return router;
}
