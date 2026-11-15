// Outgoing mail for the forgot-password flow (nodemailer over SMTP).
//
// No email is sent until SMTP is configured in the environment:
//   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// (SMTP_PORT defaults to 587; port 465 uses implicit TLS.)
// Without those, getTransporter() returns null and the caller must
// answer with a clear 503 instead of pretending an email went out.
import nodemailer from 'nodemailer';

let transporter = null;

function smtpConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

// Lazily create (and cache) the transporter, or null when SMTP is
// not configured. Never throws for missing config.
export function getTransporter() {
  if (!smtpConfigured()) return null;
  if (transporter) return transporter;
  const port = Number(process.env.SMTP_PORT || 587);
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return transporter;
}

export function isMailConfigured() {
  return smtpConfigured();
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

// Send the password-reset email. `token` is the raw token (never
// stored); the link carries it in the query string.
export async function sendResetEmail({ to, token }) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('SMTP is not configured');
  }
  const resetUrl = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from,
    to,
    subject: 'Reset your FixMyArea password',
    text:
      'You asked to reset your FixMyArea password.\n\n' +
      `Reset it here (the link works for 1 hour, one time only):\n${resetUrl}\n\n` +
      'If you did not ask for this, you can ignore this email — ' +
      'your password will not change.',
    html:
      '<p>You asked to reset your FixMyArea password.</p>' +
      `<p><a href="${resetUrl}">Reset your password</a> (the link works for 1 hour, one time only).</p>` +
      '<p>If you did not ask for this, you can ignore this email — your password will not change.</p>',
  });
}
