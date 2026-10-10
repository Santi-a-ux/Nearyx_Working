import http from 'node:http';
import https from 'node:https';

// One keep-alive agent per scheme: an upstream URL decides whether it is spoken to over HTTP or HTTPS.
const transports = {
  'http:': { client: http, agent: new http.Agent({ keepAlive: true }) },
  // No keep-alive for https: free instances (Render) go to sleep and a pooled socket would then be dead.
  'https:': { client: https, agent: new https.Agent({ keepAlive: false }) },
};

/** @returns {{ client: typeof http, agent: http.Agent }} the node client matching `target.protocol`. */
export const transportFor = (target) => transports[target.protocol];