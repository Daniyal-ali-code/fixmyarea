import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { computePriority } from '@/lib/priority.service';

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { id } = await params;

    const exists = await query('SELECT id FROM reports WHERE id = $1', [id]);
    if (exists.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const existing = await query(
      'SELECT 1 FROM supports WHERE user_id = $1 AND report_id = $2',
      [user.id, id]
    );

    let supported;
    if (existing.rows.length > 0) {
      await query(
        'DELETE FROM supports WHERE user_id = $1 AND report_id = $2',
        [user.id, id]
      );
      supported = false;
    } else {
      await query('INSERT INTO supports (user_id, report_id) VALUES ($1, $2)', [
        user.id,
        id,
      ]);
      supported = true;
    }

    await computePriority(id);

    const count = await query(
      'SELECT COUNT(*)::int AS n FROM supports WHERE report_id = $1',
      [id]
    );

    return NextResponse.json({ supported, support_count: count.rows[0].n });
  } catch (err) {
    console.error('toggleSupport error:', err);
    return NextResponse.json({ error: 'Failed to toggle support' }, { status: 500 });
  }
}
