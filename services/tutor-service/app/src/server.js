import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { initSchema } from './infrastructure/database/initSchema.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';

await initSchema();

const container = buildContainer();
const server = createApp(container).listen(config.port, () => {
  console.log(`TTP Tutor Service listening on port ${config.port}`);
});

// Load the embedding model in the background (the first run downloads ~470 MB). The service answers requests
// meanwhile; only `?q=` searches wait for the model.
container.embedder
  .warmUp()
  .then(() => console.log('[tutor-service] embedding model ready'))
  .catch((err) => console.error(`[tutor-service] embedding model not loaded yet: ${err.message}`));

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
