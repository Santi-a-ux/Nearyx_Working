import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 8000),
  // Lazy: only required when the database is actually used (e.g. not by scripts/generateTokens.js).
  // Accepts the SQLAlchemy-style "postgresql+asyncpg://" URL as well.
  get databaseUrl() {
    return required('DATABASE_URL').replace(/^postgres(ql)?\+asyncpg:/, 'postgresql:');
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'super-secret-key-change-in-production',
    algorithm: process.env.JWT_ALGORITHM ?? 'HS256',
    accessExpireMinutes: Number(process.env.JWT_ACCESS_TOKEN_EXPIRE_MINUTES ?? 30),
    refreshExpireDays: Number(process.env.JWT_REFRESH_TOKEN_EXPIRE_DAYS ?? 7),
  },
};
