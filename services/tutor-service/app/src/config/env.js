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
    // fp32 (~470 MB, exact) or q8 (~120 MB, lighter on RAM). Changing it changes the vectors: re-run
    // `npm run backfill:embeddings -- --all` and `npm run calibrate:search` afterwards.
    dtype: process.env.EMBEDDING_DTYPE ?? 'fp32',
    dimensions: 384,
  },
};