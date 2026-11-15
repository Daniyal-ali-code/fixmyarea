import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import { jsonWithAuthCookie } from '@/lib/auth';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

// Dummy hash so the unknown-email path costs about as much as a real
// bcrypt.compare (generated once at module load; the plaintext is never used).
const DUMMY_HASH = await bcrypt.hash('fixmyarea-dummy-password', 10);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const limited = checkRateLimit(`login:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) {
      return NextResponse.json(
        { error: 'Too many login attempts, please try again later' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const { body, error } = await parseJsonBody(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    let { email, password } = body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }
    email = email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 150) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const { rows } = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      // Same work as the hit path so timing does not reveal the account.
      await bcrypt.compare(password, DUMMY_HASH);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { password_hash, ...safeUser } = user;

    return jsonWithAuthCookie({ user: safeUser }, safeUser);
  } catch (err) {
    console.error('login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
