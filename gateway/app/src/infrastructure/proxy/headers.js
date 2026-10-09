// RFC 9110 hop-by-hop headers: meaningful for one connection only, never forwarded.
const HOP_BY_HOP = new Set([
  'connection', 'keep-alive', 'proxy-authenticate', 'proxy-authorization',
  'te', 'trailer', 'transfer-encoding', 'upgrade', 'proxy-connection',
]);

export function forwardableHeaders(headers, { drop = [] } = {}) {
  const dropped = new Set(drop);
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (!HOP_BY_HOP.has(key) && !dropped.has(key)) out[key] = value;
  }
  return out;
}

export function withForwardedHeaders(headers, req) {
  const remote = req.socket.remoteAddress ?? '';
  const previous = req.headers['x-forwarded-for'];
  return {
    ...headers,
    'x-forwarded-for': previous ? `${previous}, ${remote}` : remote,
    'x-forwarded-host': req.headers.host ?? '',
    'x-forwarded-proto': req.headers['x-forwarded-proto'] ?? (req.socket.encrypted ? 'https' : 'http'),
  };
}
