import 'server-only';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('📦 Connected to PostgreSQL (Next.js)');
});

export const query = (text, params) => pool.query(text, params);
export default pool;
