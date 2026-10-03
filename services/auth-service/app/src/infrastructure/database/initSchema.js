import { pool } from './pool.js';

// Equivalent of SQLAlchemy's Base.metadata.create_all() on startup.
const DDL = `
CREATE SCHEMA IF NOT EXISTS authe;

CREATE TABLE IF NOT EXISTS authe.users (
  id            UUID PRIMARY KEY,
  email         VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20)  NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email ON authe.users (email);

CREATE TABLE IF NOT EXISTS authe.refresh_tokens (
  id         UUID PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES authe.users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ix_refresh_tokens_user_id ON authe.refresh_tokens (user_id);
`;

export async function initSchema() {
  await pool.query(DDL);
}
