import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: './.env.local' });

const { Client } = pg;

const ADMIN_EMAIL = 'admin@fixmyarea.pk';
const ADMIN_NAME = 'FixMyArea Admin';
const ADMIN_PASSWORD = 'FixMyArea@Admin2026';

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const existing = await client.query(
    'SELECT id FROM users WHERE email = $1',
    [ADMIN_EMAIL]
  );

  if (existing.rows.length > 0) {
    await client.query(
      'UPDATE users SET name = $1, password_hash = $2, role = $3 WHERE email = $4',
      [ADMIN_NAME, hash, 'admin', ADMIN_EMAIL]
    );
    console.log(`✅ Updated existing admin: ${ADMIN_EMAIL}`);
  } else {
    await client.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [ADMIN_NAME, ADMIN_EMAIL, hash, 'admin']
    );
    console.log(`✅ Created new admin: ${ADMIN_EMAIL}`);
  }

  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log(`   Password: ${ADMIN_PASSWORD}`);

  await client.end();
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
