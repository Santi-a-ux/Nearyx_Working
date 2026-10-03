import express from 'express';
import { errorHandler } from './presentation/middlewares/errorHandler.js';

export function createApp({ geoRouter }) {
  const app = express();

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'geo-service' }));
  app.use('/geo', geoRouter);

  app.use(errorHandler);
  return app;
}
