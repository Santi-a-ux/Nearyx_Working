import http from 'node:http';
import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { initSchema } from './infrastructure/database/initSchema.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';
import { attachChatSocket } from './presentation/websocket/chat.socket.js';

await initSchema();

const container = buildContainer();
const server = http.createServer(createApp(container));
const sockets = attachChatSocket(server, container);

server.listen(config.port, () => {
  console.log(`TTP Chat Service listening on port ${config.port}`);
});

const shutdown = async () => {
  sockets.close();
  server.close();
  await container.broker.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
