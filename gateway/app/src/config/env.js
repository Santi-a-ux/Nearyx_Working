import 'dotenv/config';

// path segment -> [env override, default URL]. Defaults are the docker-compose service names.
const SERVICE_DEFS = {
  auth: ['AUTH_SERVICE_URL', 'http://auth-service:8001'],
  users: ['USER_SERVICE_URL', 'http://user-service:8002'],
  tutors: ['TUTOR_SERVICE_URL', 'http://tutor-service:8003'],
  geo: ['GEO_SERVICE_URL', 'http://geo-service:8004'],
  chat: ['CHAT_SERVICE_URL', 'http://chat-service:8005'],
  media: ['MEDIA_SERVICE_URL', 'http://media-service:8006'],
  bookings: ['BOOKING_SERVICE_URL', 'http://booking-service:8007'],
};

export const config = {
  port: Number(process.env.PORT ?? 8000),
  timeoutMs: Number(process.env.GATEWAY_TIMEOUT_MS ?? 60000),
  services: Object.fromEntries(
    Object.entries(SERVICE_DEFS).map(([name, [envName, fallback]]) => [name, process.env[envName] ?? fallback]),
  ),
};
