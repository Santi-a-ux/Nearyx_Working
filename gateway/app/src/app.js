import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';

export function createApp({ httpProxy, wake }) {
  const app = express();

  // Same behavior as FastAPI's CORSMiddleware(allow_origins=["*"], allow_credentials=True, ...):
  // the request's Origin and requested headers are echoed back.
  // With CORS_ORIGINS set (production) only those origins are accepted.
  app.use(cors({ origin: config.corsOrigins.length ? config.corsOrigins : true, credentials: true }));

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'api-gateway' }));

  // Wakes every service and touches the database (Supabase pauses idle free projects).
  //   /wake            -> waits and returns the report of each service (works on Vercel: the function stays alive)
  //   /wake?mode=db    -> only touches the database (cheap keep-alive for Supabase)
  //   /wake?async=1    -> answers 202 at once (only for long-lived servers, NOT for serverless)
  app.get('/wake', async (req, res) => {
    if (config.wakeKey && req.query.key !== config.wakeKey) return res.status(401).json({ detail: 'Invalid wake key' });
    const mode = req.query.mode === 'db' ? 'db' : 'all';
    if (req.query.async === '1') {
      wake.run({ mode }).catch(() => {});
      return res.status(202).json({ status: 'waking', mode });
    }
    const report = await wake.run({ mode });
    return res.status(report.ok ? 200 : 503).json(report);
  });

  // No body parser on purpose: request bodies are streamed to the service untouched.
  app.use(httpProxy);

  return app;
}
