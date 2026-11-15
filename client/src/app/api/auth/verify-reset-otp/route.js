import { NextResponse } from 'next/server';
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

// Step 1 of the two-step reset: checks the 6-digit code and nothing
// else. The code is NOT consumed here — the reset endpoint verifies
// it again and marks it used in the same transaction as the password
// change, so a verified code cannot be replayed past a reset.
// Attempts are shared with the reset endpoint: a wrong guess here
// burns one of the same 5 attempts, so brute-forcing through either
// endpoint costs the same.
export async function POST(request) {
  try {
    const limited = checkRateLimit(`verify-reset-otp:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) {
      return NextResponse.json(
        { error: 'Too many verification attempts, please try again later' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const { body, error } = await parseJsonBody(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { email, otp } = body;
    if (typeof email !== 'string' || typeof otp !== 'string') {
      return NextResponse.json({ error: 'email and code are required' }, { status: 400 });
    }
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail) || cleanEmail.length > 150) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
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

    // Check the code with the row locked, so concurrent guesses
    // cannot race the attempt counter. The code is left unused:
    // only the reset endpoint consumes it.
    const valid = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `SELECT id, otp_hash, expires_at, attempts FROM password_reset_otps
         WHERE user_id = $1 AND used_at IS NULL
         ORDER BY created_at DESC LIMIT 1 FOR UPDATE`,
        [userId]
      );
      if (rows.length === 0) return false;
      const code = rows[0];
      if (new Date(code.expires_at) <= new Date() || code.attempts >= OTP_MAX_ATTEMPTS) {
        return false;
      }
      if (!hashesEqual(code.otp_hash, hashOtp(otp))) {
        await client.query(
          'UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = $1',
          [code.id]
        );
        return false;
      }
      return true;
    });

    if (!valid) {
      return NextResponse.json({ error: INVALID_CODE }, { status: 400 });
    }

    return NextResponse.json({ message: 'Code verified' });
  } catch (err) {
    console.error('verify-reset-otp error:', err);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
