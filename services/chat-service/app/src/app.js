import express from 'express';
import { errorHandler, notFound } from './presentation/middlewares/errorHandler.js';

export function createApp({ chatRouter }) {
  const app = express();
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'chat-service' }));
  app.use('/chat', chatRouter);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
