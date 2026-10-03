import { pool } from './pool.js';

// Same DDL as ensure_schema_ready() in main.py.
const DDL = `
CREATE SCHEMA IF NOT EXISTS bookings;

CREATE TABLE IF NOT EXISTS "bookings".bookings (
  id UUID PRIMARY KEY,
  student_id UUID NOT NULL,
  tutor_id UUID NOT NULL,
  scheduled_start TIMESTAMPTZ NOT NULL,
  scheduled_end TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  session_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export async function initSchema() {
  await pool.query(DDL);
}
