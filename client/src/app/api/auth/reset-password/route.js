import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query, withTransaction } from '@/lib/db';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import {
  hashOtp,
  hashesEqual,
  isWellFormedOtp,
  OTP_MAX_ATTEMPTS,
} from '@/lib/otp';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// One generic error for every bad code, so the response never says
// whether a code exists, expired, was already used, or ran out of
// attempts — or whether the email belongs to an account at all.
const INVALID_CODE = 'Invalid or expired code';

export async function POST(request) {
  try {
    const limited = checkRateLimit(`reset-password:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) {
      return NextResponse.json(
        { error: 'Too many reset attempts, please try again later' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const { body, error } = await parseJsonBody(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { email, otp, password } = body;
    if (
      typeof email !== 'string' ||
      typeof otp !== 'string' ||
      typeof password !== 'string'
    ) {
      return NextResponse.json({ error: 'email, code and password are required' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 150) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }
    // Same password rule as register (8–72 chars; bcrypt truncates
    // past 72 bytes). Checked before any database work.
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 72 characters' },
        { status: 400 }
      );
    }
    // Malformed codes cannot match a stored hash; reject them
    // without touching the database.
    if (!isWellFormedOtp(otp)) {
      return NextResponse.json({ error: INVALID_CODE }, { status: 400 });
    }

    const { rows: users } = await query('SELECT id FROM users WHERE email = $1', [
      cleanEmail,
    ]);
    if (users.length === 0) {
      return NextResponse.json({ error: INVALID_CODE }, { status: 400 });
    }
    const userId = users[0].id;

    // Hash the new password before opening the transaction, so the
    // (slow) bcrypt work does not hold a pooled connection.
    const passwordHash = await bcrypt.hash(password, 10);

    // The whole verify-and-reset runs in one transaction with the
    // code row locked, so concurrent guesses cannot race the
    // attempt counter or reuse a code.
    const outcome = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, otp_hash, expires_at, attempts FROM password_reset_otps
         WHERE user_id = $1 AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [userId]
      );
      if (rows.length === 0) return 'invalid';
      const code = rows[0];
      if (new Date(code.expires_at) <= new Date() || code.attempts >= OTP_MAX_ATTEMPTS) {
        return 'invalid';
      }
      if (!hashesEqual(code.otp_hash, hashOtp(otp))) {
        await client.query(
          'UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1',
          [code.id]
        );
        return 'invalid';
      }
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
        passwordHash,
        userId,
      ]);
      await client.query('UPDATE password_reset_otps SET used_at = NOW() WHERE id = $1', [
        code.id,
      ]);
      return 'ok';
    });

    if (outcome !== 'ok') {
      return NextResponse.json({ error: INVALID_CODE }, { status: 400 });
    }

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
