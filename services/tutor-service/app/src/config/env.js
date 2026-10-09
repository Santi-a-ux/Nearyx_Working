import 'dotenv/config';
import path from 'node:path';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8000),
  // Accepts the SQLAlchemy-style "postgresql+asyncpg://" URL as well
  databaseUrl: required('DATABASE_URL').replace(/^postgres(ql)?\+asyncpg:/, 'postgresql:'),
  jwt: {
    secret: process.env.JWT_SECRET ?? 'super-secret-key-change-in-production',
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
  },
  embeddings: {
    model: process.env.EMBEDDING_MODEL ?? 'Xenova/multilingual-e5-small',
    cacheDir: path.resolve(process.env.MODEL_CACHE_DIR ?? '.cache/models'),
    dimensions: 384,
  },
};
