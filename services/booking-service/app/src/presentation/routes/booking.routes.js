import { Router } from 'express';
import { validate } from '../middlewares/validate.js';
import {
  createBookingSchema,
  updateStatusSchema,
  bookingIdParamSchema,
} from '../schemas/booking.schemas.js';

export function createBookingRouter({ controller, authenticate }) {
  const router = Router();

  router.post('/', authenticate, validate('body', createBookingSchema), controller.create);
  router.get('/', authenticate, controller.listMine);
  router.patch(
    '/:booking_id/status',
    authenticate,
    validate('params', bookingIdParamSchema),
    validate('body', updateStatusSchema),
    controller.updateStatus,
  );

  return router;
}
