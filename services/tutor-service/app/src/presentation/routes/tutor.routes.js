import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import { requireTutor, requireAdmin } from '../middlewares/authorize.js';
import {
  createProfileSchema,
  updateProfileSchema,
  listTutorsQuerySchema,
  availabilityQuerySchema,
  userIdParamSchema,
  ratingSchema,
} from '../schemas/tutor.schemas.js';
import {
  submitVerificationSchema,
  listVerificationQuerySchema,
  reviewVerificationSchema,
  requestIdParamSchema,
} from '../schemas/verification.schemas.js';

/**
 * Order matters (same as the Python router): literal paths (`/profiles/me`, `/availability`,
 * `/verification/me`, `/verification/requests`) go before the `/:user_id` ones, otherwise "me" would be
 * read as a user id and answered with 422.
 */
export function createTutorRouter({ tutorController, ratingController, verificationController, networkController, authenticate }) {
  const router = Router();
  const userParam = validate('params', userIdParamSchema);

  router.get('/recommendations/:user_id', authenticate, userParam, networkController.recommendations);

  router.post('/profiles', authenticate, validate('body', createProfileSchema), tutorController.create);
  router.put('/profiles', authenticate, requireTutor, validate('body', updateProfileSchema), tutorController.update);
  router.get('/profiles/me', authenticate, requireTutor, tutorController.getMine);

  router.get('/', validate('query', listTutorsQuerySchema), tutorController.list);
  router.put('/availability', authenticate, requireTutor, validate('query', availabilityQuerySchema), tutorController.setAvailability);
  router.get('/:user_id', userParam, tutorController.getByUserId);

  router.get('/:user_id/rating', authenticate, userParam, ratingController.get);
  router.put('/:user_id/rating', authenticate, userParam, validate('body', ratingSchema), ratingController.put);

  router.post('/verification', authenticate, requireTutor, validate('body', submitVerificationSchema), verificationController.submit);
  router.get('/verification/me', authenticate, requireTutor, verificationController.getMine);
  router.get('/verification/requests', authenticate, requireAdmin, validate('query', listVerificationQuerySchema), verificationController.list);
  router.patch(
    '/verification/requests/:request_id',
    authenticate,
    requireAdmin,
    validate('params', requestIdParamSchema),
    validate('body', reviewVerificationSchema),
    verificationController.review,
  );
  router.get('/verification/:user_id', userParam, verificationController.getPublic);

  return router;
}
