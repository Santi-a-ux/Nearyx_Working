import { pool } from './pool.js';

// Same DDL as ensure_schema_ready() in main.py (SQLAlchemy create_all), plus lookup indexes.
const DDL = `
CREATE SCHEMA IF NOT EXISTS media;
CREATE SCHEMA IF NOT EXISTS feed;

CREATE TABLE IF NOT EXISTS feed.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL,
  author_name VARCHAR(120) NOT NULL,
  author_avatar VARCHAR(500),
  author_role VARCHAR(30),
  content TEXT NOT NULL,
  image_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL,
  author_id UUID NOT NULL,
  author_name VARCHAR(120) NOT NULL,
  author_avatar VARCHAR(500),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS media.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size INTEGER NOT NULL,
  bucket_path VARCHAR(500) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_created ON feed.posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post_created ON feed.comments (post_id, created_at);
`;

export async function initSchema() {
  await pool.query(DDL);
}
