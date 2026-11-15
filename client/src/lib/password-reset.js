// Helpers for the forgot-password flow.
//
// The raw reset token is shown to the user exactly once (inside the
// emailed link) and never stored: only its SHA-256 hash goes in the
// password_resets table, so a database leak alone cannot reset
// anyone's password.
import crypto from 'crypto';

export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Generate a new token. Returns { token, tokenHash }: the raw token
// goes in the email link, the hash goes in the database.
export function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  return { token, tokenHash: hashResetToken(token) };
}

// SHA-256 hex digest of a raw token. Deterministic, so a presented
// token can be looked up by its hash.
export function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Constant-time comparison of two hex digests. Returns false when
// the inputs differ in length instead of throwing.
export function hashesEqual(a, b) {
  const bufA = Buffer.from(a || '', 'utf8');
  const bufB = Buffer.from(b || '', 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

// The raw token is 32 random bytes rendered as hex.
export function isWellFormedToken(token) {
  return typeof token === 'string' && /^[0-9a-f]{64}$/.test(token);
}
