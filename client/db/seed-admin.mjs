import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const { Client } = pg;

const ADMIN_EMAIL = 'admin@fixmyarea.pk';
const ADMIN_NAME = 'FixMyArea Admin';

// The admin password comes ONLY from the environment. There is no
// default: the script refuses to run without it, and the value is
// never printed.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD is not set. Set it in the environment (or .env.local) and re-run.');
  process.exit(1);
}

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const existing = await client.query(
    'SELECT id FROM users WHERE email = $1',
    [ADMIN_EMAIL]
  );

  if (existing.rows.length > 0) {
    // Never overwrite an existing admin row (its password may have
    // been changed since the first seed).
    console.log(`Admin already exists, leaving it untouched: ${ADMIN_EMAIL}`);
  } else {
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await client.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin']
    );
    console.log(`✅ Created new admin: ${ADMIN_EMAIL}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
