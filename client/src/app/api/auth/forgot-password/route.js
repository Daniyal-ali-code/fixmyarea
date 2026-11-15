import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { generateResetToken } from '@/lib/password-reset';
import { isMailConfigured, sendResetEmail } from '@/lib/mail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The same message is returned whether or not the email belongs to an
// account, so the response never reveals if an address is registered.
const GENERIC_MESSAGE =
  'If an account exists for that email, a password reset link has been sent.';

export async function POST(request) {
  try {
    const limited = checkRateLimit(`forgot-password:${getClientIp(request)}`, {
      limit: 5,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) {
      return NextResponse.json(
        { error: 'Too many reset requests, please try again later' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const { body, error } = await parseJsonBody(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    let { email } = body;
    if (typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 });
    }
    email = email.trim().toLowerCase();
    if (!EMAIL_RE.test(email) || email.length > 150) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Checked before the user lookup, so the 503 is identical for
    // known and unknown addresses.
    if (!isMailConfigured()) {
      return NextResponse.json(
        { error: 'Password reset email is not configured. Please contact the administrator.' },
        { status: 503 }
      );
    }

    const { rows } = await query('SELECT id FROM users WHERE email = $1', [email]);

    if (rows.length > 0) {
      const { token, tokenHash } = generateResetToken();
      await withTransaction(async (client) => {
        // Invalidate any earlier unused tokens for this user; only the
        // newest link works.
        await client.query(
          "UPDATE password_resets SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL",
          [rows[0].id]
        );
        await client.query(
          `INSERT INTO password_resets (user_id, token_hash, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
          [rows[0].id, tokenHash]
        );
      });
      try {
        await sendResetEmail({ to: email, token });
      } catch (sendErr) {
        console.error('reset email send error:', sendErr);
        return NextResponse.json(
          { error: 'Failed to send the reset email. Please try again later.' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
