import http from 'node:http';

const reject = (socket, line) => {
  socket.write(`HTTP/1.1 ${line}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
  socket.destroy();
};

const rawHead = (statusLine, rawHeaders) => {
  let head = `${statusLine}\r\n`;
  for (let i = 0; i < rawHeaders.length; i += 2) head += `${rawHeaders[i]}: ${rawHeaders[i + 1]}\r\n`;
  return `${head}\r\n`;
};

/**
 * WebSocket support without touching frames: the Upgrade request is replayed against the service
 * (same path, query, cookies and Sec-WebSocket-* headers) and, once it answers 101, both sockets are
 * piped together. Text, binary, ping/pong and close codes pass through untouched.
 */
export function attachWebSocketProxy(server, { registry }) {
  const open = new Set();

  server.on('upgrade', (req, clientSocket, clientHead) => {
    const resolved = registry.resolve(req.url);
    if (resolved.error) return reject(clientSocket, '404 Not Found');

    const { target } = resolved;
    clientSocket.setNoDelay(true);
    clientSocket.on('error', () => {});

    const proxyReq = http.request({
      hostname: target.hostname,
      port: target.port,
      method: 'GET',
      path: req.url,
      headers: { ...req.headers, host: `${target.hostname}:${target.port}` },
      agent: false,
    });

    proxyReq.on('upgrade', (proxyRes, serviceSocket, serviceHead) => {
      serviceSocket.setNoDelay(true);
      serviceSocket.on('error', () => clientSocket.destroy());
      clientSocket.on('close', () => serviceSocket.destroy());
      serviceSocket.on('close', () => clientSocket.destroy());

      clientSocket.write(rawHead('HTTP/1.1 101 Switching Protocols', proxyRes.rawHeaders));
      if (serviceHead?.length) clientSocket.write(serviceHead);
      if (clientHead?.length) serviceSocket.write(clientHead);

      serviceSocket.pipe(clientSocket);
      clientSocket.pipe(serviceSocket);

      open.add(clientSocket).add(serviceSocket);
      const forget = () => { open.delete(clientSocket); open.delete(serviceSocket); };
      clientSocket.on('close', forget);
    });

    // The service refused the upgrade (e.g. 401/404): relay its answer as is.
    proxyReq.on('response', (proxyRes) => {
      clientSocket.write(rawHead(`HTTP/1.1 ${proxyRes.statusCode} ${proxyRes.statusMessage}`, proxyRes.rawHeaders));
      proxyRes.pipe(clientSocket);
    });

    proxyReq.on('error', () => reject(clientSocket, '502 Bad Gateway'));
    clientSocket.on('close', () => proxyReq.destroy());
    proxyReq.end();
  });

  return {
    close() {
      for (const socket of open) socket.destroy();
    },
  };
}
