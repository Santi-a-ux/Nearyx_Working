import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

// Same normalization as _normalize_redis_url() in the Python service:
// localhost / ttp-redis resolve to the compose service name "redis".
function normalizeRedisUrl(raw) {
  try {
    const url = new URL(raw);
    if (['localhost', '127.0.0.1', 'ttp-redis'].includes(url.hostname)) {
      url.hostname = 'redis';
      if (!url.port) url.port = '6379';
      if (!url.pathname || url.pathname === '/') url.pathname = '/1';
      return url.toString();
    }
  } catch {
    /* fall through: use the value as given */
  }
  return raw;
}

// En producción JWT_SECRET es obligatorio; el valor por defecto solo existe para desarrollo local.
function jwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') throw new Error('Missing required environment variable: JWT_SECRET');
  return 'super-secret-key-change-in-production';
}

export const config = {
  port: Number(process.env.PORT ?? 8000),
  // Accepts the SQLAlchemy-style "postgresql+asyncpg://" URL as well
  databaseUrl: required('DATABASE_URL').replace(/^postgres(ql)?\+asyncpg:/, 'postgresql:'),
  redisUrl: normalizeRedisUrl(process.env.REDIS_URL ?? 'redis://ttp-redis:6379/1'),
  jwt: {
    secret: jwtSecret(),
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
  },
};