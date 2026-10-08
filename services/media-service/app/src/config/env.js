import 'dotenv/config';

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
  supabase: {
    url: process.env.SUPABASE_URL ?? null,
    key: process.env.SUPABASE_KEY ?? null,
    bucket: process.env.SUPABASE_BUCKET ?? 'tempoimages',
  },
  maxUploadBytes: 25 * 1024 * 1024,
};
