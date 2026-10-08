import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { uploadAvatar } from '../middlewares/uploadAvatar.js';
import { createProfileSchema, updateProfileSchema, userIdParamSchema } from '../schemas/profile.schemas.js';

export function createProfileRouter({ profileController, imageController, authenticate }) {
  const router = Router();

  router.post('/profiles', authenticate, validate('body', createProfileSchema), profileController.create);
  router.get('/me', authenticate, profileController.getMine);
  router.get('/profiles/me', authenticate, profileController.getMine);
  router.put('/profiles/me', authenticate, validate('body', updateProfileSchema), profileController.updateMine);
  router.post('/profiles/avatar', authenticate, uploadAvatar, imageController.uploadAvatar);
  // Public; must stay after /profiles/me so "me" is not read as a user_id.
  router.get('/profiles/:user_id', validate('params', userIdParamSchema), profileController.getByUserId);

  return router;
}
