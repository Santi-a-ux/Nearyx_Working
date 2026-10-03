import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshSchema,
  verifyTokenSchema,
} from '../schemas/auth.schemas.js';

export function createAuthRouter({ controller, authenticate }) {
  const router = Router();

  router.post('/register', validate(registerSchema), controller.register);
  router.post('/login', validate(loginSchema), controller.login);
  router.post('/refresh', validate(refreshSchema), controller.refresh);
  router.post('/logout', authenticate, controller.logout);
  router.get('/me', authenticate, controller.me);
  router.post('/verify-token', validate(verifyTokenSchema), controller.verifyToken);
  router.get('/ws-token', authenticate, controller.wsToken);
  router.put('/promote-to-tutor', authenticate, controller.promoteToTutor);

  return router;
}
