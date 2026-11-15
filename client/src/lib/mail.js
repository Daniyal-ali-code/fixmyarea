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

// Send the password-reset OTP email. `otp` is the raw 6-digit code
// (never stored); it is valid for 10 minutes, one time only.
export async function sendOtpEmail({ to, otp }) {
  const transport = getTransporter();
  if (!transport) {
    throw new Error('SMTP is not configured');
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transport.sendMail({
    from,
    to,
    subject: 'Your FixMyArea password reset code',
    text:
      'You asked to reset your FixMyArea password.\n\n' +
      `Your 6-digit reset code is: ${otp}\n\n` +
      'The code is valid for 10 minutes and can be used once. ' +
      'Never share it with anyone.\n\n' +
      'If you did not ask for this, you can ignore this email — ' +
      'your password will not change.',
    html:
      '<p>You asked to reset your FixMyArea password.</p>' +
      `<p>Your 6-digit reset code is: <strong style="font-size: 24px; letter-spacing: 4px;">${otp}</strong></p>` +
      '<p>The code is valid for 10 minutes and can be used once. Never share it with anyone.</p>' +
      '<p>If you did not ask for this, you can ignore this email — your password will not change.</p>',
  });
}
