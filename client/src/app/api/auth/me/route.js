import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { rows } = await query(
      'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
      [user.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (err) {
    console.error('me error:', err);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
