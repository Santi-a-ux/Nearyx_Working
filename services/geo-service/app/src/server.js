import { config } from './config/env.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';

const server = createApp(buildContainer()).listen(config.port, () => {
  console.log(`TTP Geo Service listening on port ${config.port}`);
});

const shutdown = () => {
  server.close(() => process.exit(0));
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
