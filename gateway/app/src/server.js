import http from 'node:http';
import { config } from './config/env.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';
import { attachWebSocketProxy } from './infrastructure/proxy/websocketProxy.js';

const container = buildContainer();
const server = http.createServer(createApp(container));
const sockets = attachWebSocketProxy(server, container);

server.listen(config.port, () => {
  console.log(`TTP API Gateway listening on port ${config.port}`);
});

const shutdown = () => {
  sockets.close();
  server.close(() => process.exit(0));
  server.closeAllConnections();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
