import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { BookingRepository } from './infrastructure/repositories/booking.repository.js';
import { TokenVerifier } from './infrastructure/security/tokenVerifier.js';
import { BookingService } from './application/services/booking.service.js';
import { IdentityService } from './application/services/identity.service.js';
import { BookingController } from './presentation/controllers/booking.controller.js';
import { createAuthenticate } from './presentation/middlewares/authenticate.js';
import { createBookingRouter } from './presentation/routes/booking.routes.js';

// Composition root: the only place where layers are wired together.
export function buildContainer() {
  const bookingService = new BookingService({ bookingRepository: new BookingRepository(pool) });
  const identityService = new IdentityService({ tokenVerifier: new TokenVerifier(config.jwt) });

  const bookingRouter = createBookingRouter({
    controller: new BookingController(bookingService),
    authenticate: createAuthenticate(identityService),
  });

  return { bookingRouter };
}
