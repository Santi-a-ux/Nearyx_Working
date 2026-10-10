import express from 'express';
import cors from 'cors';
import { errorHandler } from './presentation/middlewares/errorHandler.js';

export function createApp({ authRouter, checkDatabase }) {
  const app = express();

  // Same behavior as FastAPI's CORSMiddleware(allow_origins=["*"], allow_credentials=True):
  // the request's Origin is echoed back.
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-service' }));
  // Touches the database (used by the gateway's /wake so Supabase does not pause an idle project).
  app.get('/health/db', async (req, res) => {
    try {
      await checkDatabase();
      res.json({ status: 'ok', db: 'up' });
    } catch {
      res.status(503).json({ status: 'error', db: 'down' });
    }
  });
  app.use('/auth', authRouter);

  app.use(errorHandler);
  return app;
}
