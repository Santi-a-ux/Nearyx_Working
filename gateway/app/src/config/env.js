import 'dotenv/config';

// path segment -> [env override, default URL]. Defaults are the docker-compose service names.
const SERVICE_DEFS = {
  auth: ['AUTH_SERVICE_URL', 'https://authservice-1-fc6f.onrender.com'],
  users: ['USER_SERVICE_URL', 'https://userservice-1-jqgy.onrender.com'],
  tutors: ['TUTOR_SERVICE_URL', 'http://tutor-service:8003'],
  geo: ['GEO_SERVICE_URL', 'https://geoservice-1.onrender.com'],
  chat: ['CHAT_SERVICE_URL', 'http://chat-service:8005'],
  media: ['MEDIA_SERVICE_URL', 'https://mediaservice-1.onrender.com/'], // production: set MEDIA_SERVICE_URL (never hardcode URLs here)
  bookings: ['BOOKING_SERVICE_URL', 'https://bookingservice-1-t0ec.onrender.com'],
};

const list = (raw) => (raw ?? '').split(',').map((s) => s.trim()).filter(Boolean);
const withoutTrailingSlash = (url) => url.replace(/\/+$/, '');

export const config = {
  port: Number(process.env.PORT ?? 8000),
  // Free Render instances need ~1 min to wake up. On Vercel keep it below the function's maxDuration (60 s).
  timeoutMs: Number(process.env.GATEWAY_TIMEOUT_MS ?? 60000),
  // Comma separated list of allowed browser origins. Empty = echo any origin (local development).
  corsOrigins: list(process.env.CORS_ORIGINS),
  // If set, /wake requires ?key=<WAKE_KEY> (otherwise anyone could keep your free hours burning).
  wakeKey: process.env.WAKE_KEY ?? '',
  services: Object.fromEntries(
    Object.entries(SERVICE_DEFS).map(([name, [envName, fallback]]) => [
      name,
      withoutTrailingSlash(process.env[envName] ?? fallback),
    ]),
  ),
};