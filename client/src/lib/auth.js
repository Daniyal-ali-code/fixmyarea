import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { query } from './db.js';

// Validated lazily on first use, not at import time: Next.js imports every
// route module while collecting page data during `next build`, and a throw at
// import would fail the build in any environment where the env var is not set.
// The first sign/verify still fails fast with a clear error.
function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters long');
  }
  return secret;
}

export const COOKIE_NAME = 'fixmyarea_token';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days, in seconds

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === 'production',
  };
}

export function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    getSecret(),
    { algorithm: 'HS256', expiresIn: '7d' }
  );
}

// Attach the auth cookie to a JSON response.
export function setAuthCookie(response, user) {
  response.cookies.set(COOKIE_NAME, signToken(user), cookieOptions());
  return response;
}

// Build a JSON response that also sets the auth cookie.
export function jsonWithAuthCookie(body, user, status = 200) {
  return setAuthCookie(NextResponse.json(body, { status }), user);
}

// Clear the auth cookie (logout).
export function clearAuthCookie(response) {
  response.cookies.set(COOKIE_NAME, '', { ...cookieOptions(), maxAge: 0 });
  return response;
}

function tokenFromCookieHeader(request) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === COOKIE_NAME) return rest.join('=');
  }
  return null;
}

// Read the JWT from the httpOnly cookie and re-check the user's role
// against the DB (a JWT role is never trusted on its own).
export async function getUserFromRequest(request) {
  const token = tokenFromCookieHeader(request);
  if (!token) return null;
  let payload;
  try {
    payload = jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
  } catch {
    return null;
  }
  try {
    const { rows } = await query(
      'SELECT id, role FROM users WHERE id = $1',
      [payload.userId]
    );
    if (rows.length === 0) return null;
    return { id: rows[0].id, role: rows[0].role };
  } catch {
    return null;
  }
}
