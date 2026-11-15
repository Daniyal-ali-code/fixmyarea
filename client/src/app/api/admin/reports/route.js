import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { parsePagination } from '@/lib/http';

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const { limit, offset, error: pageError } = parsePagination(searchParams);
    if (pageError) {
      return NextResponse.json({ error: pageError }, { status: 400 });
    }

    const [listResult, totalResult] = await Promise.all([
      query(
        `SELECT
           r.id, r.title, r.description, r.address, r.latitude, r.longitude,
           r.severity, r.status, r.priority_score, r.created_at, r.updated_at,
           r.category_id, c.name AS category_name,
           u.id AS user_id, u.name AS reporter_name, u.email AS reporter_email,
           COALESCE(s.support_count, 0) AS support_count
         FROM reports r
         JOIN categories c ON c.id = r.category_id
         JOIN users u      ON u.id = r.user_id
         LEFT JOIN (
           SELECT report_id, COUNT(*)::int AS support_count
           FROM supports GROUP BY report_id
         ) s ON s.report_id = r.id
         ORDER BY r.created_at DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*)::int AS total FROM reports'),
    ]);
    return NextResponse.json({ reports: listResult.rows, total: totalResult.rows[0].total });
  } catch (err) {
    console.error('admin.listAllReports error:', err);
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 });
  }
}
