import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { initSchema } from './infrastructure/database/initSchema.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';

await initSchema();

const app = createApp(buildContainer());
const server = app.listen(config.port, () => {
  console.log(`TTP Booking Service listening on port ${config.port}`);
});

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
