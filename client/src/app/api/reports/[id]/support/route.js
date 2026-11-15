import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { computePriority } from '@/lib/priority.service';
import { parseIdParam } from '@/lib/http';
import { checkRateLimit } from '@/lib/rate-limit';

export async function GET(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const { id } = await params;
    const reportId = parseIdParam(id);
    if (reportId === null) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const { rows } = await query(
      'SELECT 1 FROM supports WHERE user_id = $1 AND report_id = $2',
      [user.id, reportId]
    );

    return NextResponse.json({ supported: rows.length > 0 });
  } catch (err) {
    console.error('getSupport error:', err);
    return NextResponse.json({ error: 'Failed to fetch support status' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const limited = checkRateLimit(`support:${user.id}`, {
      limit: 30,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) {
      return NextResponse.json(
        { error: 'Too many support toggles, please try again later' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const { id } = await params;
    const reportId = parseIdParam(id);
    if (reportId === null) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    const exists = await query('SELECT id, user_id FROM reports WHERE id = $1', [reportId]);
    if (exists.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    if (exists.rows[0].user_id === user.id) {
      return NextResponse.json(
        { error: 'You cannot support your own report' },
        { status: 403 }
      );
    }

    // Atomic toggle in a single transaction: try to insert; if the row
    // already exists the insert is a no-op and we delete instead.
    // `supported` is derived from which statement actually changed a row.
    const supported = await withTransaction(async (client) => {
      const inserted = await client.query(
        `INSERT INTO supports (user_id, report_id) VALUES ($1, $2)
         ON CONFLICT (user_id, report_id) DO NOTHING RETURNING 1`,
        [user.id, reportId]
      );
      if (inserted.rows.length > 0) return true;
      await client.query(
        'DELETE FROM supports WHERE user_id = $1 AND report_id = $2',
        [user.id, reportId]
      );
      return false;
    });

    try {
      await computePriority(reportId);
    } catch (priorityErr) {
      // Best effort: the toggle already committed; a failed recompute
      // must not turn this into a 500 (the client would retry and flip).
      console.error('computePriority after support toggle failed:', priorityErr);
    }

    const count = await query(
      'SELECT COUNT(*)::int AS n FROM supports WHERE report_id = $1',
      [reportId]
    );

    return NextResponse.json({ supported, support_count: count.rows[0].n });
  } catch (err) {
    console.error('toggleSupport error:', err);
    return NextResponse.json({ error: 'Failed to toggle support' }, { status: 500 });
  }
}
