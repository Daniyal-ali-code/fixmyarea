import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { query, withTransaction } from '@/lib/db';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { hashResetToken, hashesEqual, isWellFormedToken } from '@/lib/password-reset';

// One generic error for every bad token, so the response never says
// whether a token exists, expired, or was already used.
const INVALID_TOKEN = 'Invalid or expired reset link';

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

    const { token, password } = body;
    if (typeof token !== 'string' || typeof password !== 'string') {
      return NextResponse.json({ error: 'token and password are required' }, { status: 400 });
    }
    // Same password rule as register (8–72 chars; bcrypt truncates
    // past 72 bytes). Checked before any database work.
    if (password.length < 8 || password.length > 72) {
      return NextResponse.json(
        { error: 'Password must be between 8 and 72 characters' },
        { status: 400 }
      );
    }
    // Malformed tokens cannot match a stored hash; reject them
    // without touching the database.
    if (!isWellFormedToken(token)) {
      return NextResponse.json({ error: INVALID_TOKEN }, { status: 400 });
    }

    const tokenHash = hashResetToken(token);
    const { rows } = await query(
      `SELECT id, user_id, token_hash FROM password_resets
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > NOW()`,
      [tokenHash]
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: INVALID_TOKEN }, { status: 400 });
    }

    const reset = rows[0];
    if (!hashesEqual(reset.token_hash, tokenHash)) {
      return NextResponse.json({ error: INVALID_TOKEN }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await withTransaction(async (client) => {
      await client.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
        passwordHash,
        reset.user_id,
      ]);
      await client.query('UPDATE password_resets SET used_at = NOW() WHERE id = $1', [
        reset.id,
      ]);
    });

    return NextResponse.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('reset-password error:', err);
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 });
  }
}
