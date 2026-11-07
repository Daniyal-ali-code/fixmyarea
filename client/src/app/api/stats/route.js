import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET() {
  try {
    const byStatus = await query(
      `SELECT status, COUNT(*)::int AS count FROM reports GROUP BY status`
    );

    const byCategory = await query(
      `SELECT c.id, c.name, COUNT(r.id)::int AS count
       FROM categories c
       LEFT JOIN reports r ON r.category_id = c.id
       GROUP BY c.id, c.name
       ORDER BY count DESC`
    );

    const totals = await query(
      `SELECT
         COUNT(*)::int AS total,
         SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END)::int AS resolved
       FROM reports`
    );

    const perDay = await query(
      `SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*)::int AS count
       FROM reports
       WHERE created_at >= NOW() - INTERVAL '30 days'
       GROUP BY day
       ORDER BY day`
    );

    const topSupported = await query(
      `SELECT r.id, r.title, r.status, COUNT(s.user_id)::int AS support_count
       FROM reports r
       LEFT JOIN supports s ON s.report_id = r.id
       GROUP BY r.id, r.title, r.status
       ORDER BY support_count DESC
       LIMIT 5`
    );

    const { total, resolved } = totals.rows[0];

    return NextResponse.json({
      by_status: byStatus.rows,
      by_category: byCategory.rows,
      totals: {
        total_reports: total,
        resolved_reports: resolved,
        resolution_rate:
          total === 0 ? 0 : Number(((resolved / total) * 100).toFixed(1)),
      },
      reports_per_day: perDay.rows,
      top_supported: topSupported.rows,
    });
  } catch (err) {
    console.error('getStats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
