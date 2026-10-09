import http from 'node:http';
import { forwardableHeaders, withForwardedHeaders } from './headers.js';

const agent = new http.Agent({ keepAlive: true });

const sendError = (res, status, detail) => {
  if (res.headersSent) return res.destroy();
  res.status(status).json({ detail });
};

/** Express middleware: streams the request to the owning service and the response back (no buffering). */
export function createHttpProxy({ registry, timeoutMs }) {
  return (req, res) => {
    const resolved = registry.resolve(req.originalUrl);
    if (resolved.error === 'service_not_found') return sendError(res, 404, 'Service not found');
    if (resolved.error) return sendError(res, 404, 'Not Found');

    const { target } = resolved;
    const headers = withForwardedHeaders(forwardableHeaders(req.headers, { drop: ['host', 'expect'] }), req);

    const proxyReq = http.request(
      {
        agent,
        hostname: target.hostname,
        port: target.port,
        method: req.method,
        path: req.originalUrl, // full path + query, unchanged
        headers,
        timeout: timeoutMs,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.statusMessage, forwardableHeaders(proxyRes.headers));
        proxyRes.pipe(res);
        proxyRes.on('error', () => res.destroy());
      },
    );

    proxyReq.on('timeout', () => proxyReq.destroy(Object.assign(new Error('upstream timeout'), { code: 'ETIMEDOUT' })));
    proxyReq.on('error', (err) => {
      const status = err.code === 'ETIMEDOUT' ? 504 : 502;
      sendError(res, status, `${status === 504 ? 'Gateway Timeout' : 'Bad Gateway'}: ${err.message}`);
    });

    // Client went away before the answer: stop talking to the service.
    res.on('close', () => { if (!res.writableFinished) proxyReq.destroy(); });

    req.pipe(proxyReq);
  };
}
