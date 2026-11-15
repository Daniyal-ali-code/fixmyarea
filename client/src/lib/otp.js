// Helpers for the forgot-password OTP flow.
//
// The raw 6-digit code is shown to the user exactly once (inside the
// emailed message) and never stored: only its SHA-256 hash goes in
// the password_reset_otps table, so a database leak alone cannot
// reset anyone's password. Codes are single-use, expire after
// 10 minutes, and allow at most 5 verify attempts.
import crypto from 'crypto';

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

// Generate a new code. Returns { otp, otpHash }: the raw code goes
// in the email, the hash goes in the database. crypto.randomInt
// gives a uniform 6-digit number (100000–999999, leading zeros
// impossible by construction).
export function generateOtp() {
  const otp = String(crypto.randomInt(100000, 1000000));
  return { otp, otpHash: hashOtp(otp) };
}

// SHA-256 hex digest of a raw code. Deterministic, so a presented
// code can be looked up by its hash.
export function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

// Constant-time comparison of two hex digests. Returns false when
// the inputs differ in length instead of throwing.
export function hashesEqual(a, b) {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// A code is exactly 6 digits. Malformed input cannot match a stored
// hash; reject it before any database work.
export function isWellFormedOtp(otp) {
  return typeof otp === 'string' && /^\d{6}$/.test(otp);
}
