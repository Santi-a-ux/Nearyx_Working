import express from 'express';
import { errorHandler } from './presentation/middlewares/errorHandler.js';

export function createApp({ bookingRouter }) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'booking-service' }));
  app.use('/bookings', bookingRouter);

  app.use(errorHandler);
  return app;
}
