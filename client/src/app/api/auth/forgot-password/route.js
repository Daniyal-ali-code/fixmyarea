import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { parseJsonBody } from '@/lib/http';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { generateOtp, OTP_RESEND_COOLDOWN_MS } from '@/lib/otp';
import { isMailConfigured, sendOtpEmail } from '@/lib/mail';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The same message is returned whether or not the email belongs to an
// account, so the response never reveals if an address is registered.
// It is also returned when a fresh code was requested inside the
// resend cooldown, so the cooldown itself never leaks either.
const GENERIC_MESSAGE =
  'If an account exists for that email, a 6-digit reset code has been sent.';

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
      const userId = rows[0].id;

      // Per-email resend cooldown: at most one code per 60 seconds.
      // Inside the cooldown, answer with the generic message and
      // send nothing — no new code, no leak.
      const { rows: recent } = await query(
        `SELECT id FROM password_reset_otps
         WHERE user_id = $1 AND used_at IS NULL
           AND created_at > NOW() - ($2 || ' milliseconds')::interval
         ORDER BY created_at DESC LIMIT 1`,
        [userId, String(OTP_RESEND_COOLDOWN_MS)]
      );
      if (recent.length > 0) {
        return NextResponse.json({ message: GENERIC_MESSAGE });
      }

      const { otp, otpHash } = generateOtp();
      await withTransaction(async (client) => {
        // Invalidate any earlier unused codes for this user; only the
        // newest code works.
        await client.query(
          'UPDATE password_reset_otps SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
          [userId]
        );
        await client.query(
          `INSERT INTO password_reset_otps (user_id, otp_hash, expires_at)
           VALUES ($1, $2, NOW() + INTERVAL '10 minutes')`,
          [userId, otpHash]
        );
      });
      try {
        await sendOtpEmail({ to: email, otp });
      } catch (sendErr) {
        console.error('reset OTP email send error:', sendErr);
        return NextResponse.json(
          { error: 'Failed to send the reset code. Please try again later.' },
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
