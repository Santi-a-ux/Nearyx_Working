import pg from 'pg';
import { config } from '../../config/env.js';

// node-postgres only uses named prepared statements when a query explicitly sets `name`,
// so this is already safe behind PgBouncer / Supabase pooler (the asyncpg cache workaround).
export const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  // Small by default: 6 services share the Supabase pooler (override with PG_POOL_MAX).
  max: Number(process.env.PG_POOL_MAX ?? 5),
});

/** Runs `work(client)` inside a transaction (COMMIT on success, ROLLBACK on error). */
export async function withTransaction(work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
