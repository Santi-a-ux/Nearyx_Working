import pg from 'pg';
import { config } from '../../config/env.js';

// node-postgres only uses named prepared statements when a query explicitly sets `name`,
// so this is already safe behind PgBouncer / Supabase pooler (the asyncpg cache workaround).
export const pool = new pg.Pool({ connectionString: config.databaseUrl });
