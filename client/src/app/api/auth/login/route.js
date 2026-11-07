import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';

function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'email and password are required' },
        { status: 400 }
      );
    }

    const { rows } = await query(
      'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const user = rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const { password_hash, ...safeUser } = user;
    const token = signToken(user);

    return NextResponse.json({ user: safeUser, token });
  } catch (err) {
    console.error('login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
