import express from 'express';
import cors from 'cors';

export function createApp({ httpProxy }) {
  const app = express();

  // Same behavior as FastAPI's CORSMiddleware(allow_origins=["*"], allow_credentials=True, ...):
  // the request's Origin and requested headers are echoed back.
  app.use(cors({ origin: true, credentials: true }));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

  // No body parser on purpose: request bodies are streamed to the service untouched.
  app.use(httpProxy);

  return app;
}
