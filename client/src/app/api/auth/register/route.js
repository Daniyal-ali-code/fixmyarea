import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query } from '@/lib/db';
import { jsonWithAuthCookie } from '@/lib/auth';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const limited = checkRateLimit(`register:${getClientIp(request)}`, {
      limit: 10,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) {
      return NextResponse.json(
        { error: 'Too many registration attempts, please try again later' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const { body, error } = await parseJsonBody(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    let { name, email, password } = body;

    if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'name, email, and password are required' },
        { status: 400 }
      );
    }
    name = name.trim();
    email = email.trim().toLowerCase();
    if (name.length === 0 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 100 characters' },
        { status: 400 }
      );
    }
    if (!EMAIL_RE.test(email) || email.length > 150) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    // bcrypt truncates past 72 bytes, so cap the password there.
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 72 characters' },
        { status: 400 }
      );
    }

    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let rows;
    try {
      ({ rows } = await query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role, created_at`,
        [name, email, passwordHash]
      ));
    } catch (insertErr) {
      if (insertErr.code === '23505') {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
      }
      throw insertErr;
    }

    const user = rows[0];

    return jsonWithAuthCookie({ user }, user, 201);
  } catch (err) {
    console.error('register error:', err);
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 });
  }
}
