import express from 'express';
import { errorHandler, notFound } from './presentation/middlewares/errorHandler.js';

export function createApp({ mediaRouter }) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'media-service' }));
  app.use('/media', mediaRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
