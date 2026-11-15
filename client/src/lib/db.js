import 'server-only';
import pg from 'pg';

const { Pool } = pg;

// The pool is created lazily on first use, not at import time: Next.js
// imports every route module while collecting page data during `next build`,
// and a throw at import would fail the build in any environment where the
// env var is not set (CI, a fresh checkout). The first real query still
// fails fast with a clear error when DATABASE_URL is missing.
let pool = null;

function getPool() {
  if (pool) return pool;
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5000,
    query_timeout: 10000,
  });
  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });
  return pool;
}

export const query = (text, params) => getPool().query(text, params);

// Run fn(client) inside a single transaction. Rolls back on error.
export async function withTransaction(fn) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
