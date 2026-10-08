import { pool } from './pool.js';

// Same DDL SQLAlchemy's create_all produced for users.profiles (the Python service relied on
// scripts/init-db.sql for the schema itself).
const DDL = `
CREATE SCHEMA IF NOT EXISTS users;

CREATE TABLE IF NOT EXISTS users.profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  bio TEXT,
  avatar_url VARCHAR(500),
  location_name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function initSchema() {
  await pool.query(DDL);
}
