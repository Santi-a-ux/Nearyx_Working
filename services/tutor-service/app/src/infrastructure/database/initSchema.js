import { pool } from './pool.js';
import { config } from '../../config/env.js';

// Same DDL as ensure_schema_ready() in the Python main.py (the `embedding` column is declared there
// only through the SQLAlchemy model, so it is added here for fresh databases).
const DDL = `
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS tutors;

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

CREATE TABLE IF NOT EXISTS tutors.profiles (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  specialties TEXT[],
  categories TEXT[],
  is_available BOOLEAN DEFAULT TRUE,
  hourly_rate NUMERIC(10, 2),
  years_experience INTEGER,
  verification_status VARCHAR(20) DEFAULT 'pending',
  coordinates geometry(POINT, 4326),
  preferred_payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tutors.ratings (
  id UUID PRIMARY KEY,
  tutor_user_id UUID NOT NULL REFERENCES tutors.profiles(user_id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_tutor_rater UNIQUE (tutor_user_id, rater_user_id)
);

ALTER TABLE tutors.ratings ADD COLUMN IF NOT EXISTS comment VARCHAR(500);

CREATE TABLE IF NOT EXISTS tutors.verification_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  summary TEXT,
  education JSONB,
  certifications JSONB,
  experience JSONB,
  skills TEXT[],
  review_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_verification_requests_user_id ON tutors.verification_requests (user_id);

CREATE TABLE IF NOT EXISTS tutors.verification_documents (
  id UUID PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES tutors.verification_requests(id) ON DELETE CASCADE,
  file_url VARCHAR(500) NOT NULL,
  file_name VARCHAR(255),
  doc_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_verification_documents_request_id ON tutors.verification_documents (request_id);

-- The historical default was 'pending', which made every new tutor look "under review"
-- without having sent any request.
ALTER TABLE tutors.profiles ALTER COLUMN verification_status SET DEFAULT 'unverified';

UPDATE tutors.profiles p
   SET verification_status = 'unverified'
 WHERE p.verification_status = 'pending'
   AND NOT EXISTS (SELECT 1 FROM tutors.verification_requests r WHERE r.user_id = p.user_id);
`;

export async function initSchema() {
  await pool.query(DDL);

  // pgvector is not created by scripts/init-db.sql; try to enable it, but do not stop the service
  // (everything except semantic search works without it).
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector');
    await pool.query(
      `ALTER TABLE tutors.profiles ADD COLUMN IF NOT EXISTS embedding vector(${config.embeddings.dimensions})`,
    );
  } catch (err) {
    console.warn(`[tutor-service] pgvector not available, semantic search disabled: ${err.message}`);
  }
}
