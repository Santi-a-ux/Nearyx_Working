import 'dotenv/config';
import path from 'node:path';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
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
  jwt: {
    secret: jwtSecret(),
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
  },
  embeddings: {
    model: process.env.EMBEDDING_MODEL ?? 'Xenova/multilingual-e5-small',
    cacheDir: path.resolve(process.env.MODEL_CACHE_DIR ?? '.cache/models'),
    dimensions: 384,
  },
};
