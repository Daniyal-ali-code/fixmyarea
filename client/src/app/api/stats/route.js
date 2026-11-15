import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

const DAYS = 30;

export async function GET() {
  try {
    const [byStatus, byCategory, totals, perDay, topSupported] = await Promise.all([
      query(
        `SELECT status, COUNT(*)::int AS count FROM reports GROUP BY status`
      ),
      query(
        `SELECT c.id, c.name, COUNT(r.id)::int AS count
         FROM categories c
         LEFT JOIN reports r ON r.category_id = c.id
         GROUP BY c.id, c.name
         ORDER BY count DESC`
      ),
      query(
        `SELECT
           COUNT(*)::int AS total,
           COALESCE(SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END), 0)::int AS resolved
         FROM reports`
      ),
      query(
        `SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*)::int AS count
         FROM reports
         WHERE created_at >= NOW() - INTERVAL '30 days'
         GROUP BY day
         ORDER BY day`
      ),
      query(
        `SELECT r.id, r.title, r.status, COUNT(s.user_id)::int AS support_count
         FROM reports r
         LEFT JOIN supports s ON s.report_id = r.id
         GROUP BY r.id, r.title, r.status
         ORDER BY support_count DESC
         LIMIT 5`
      ),
    ]);

    const { total, resolved } = totals.rows[0];

    // Zero-fill the 30-day series so days with no reports still appear.
    const countsByDay = new Map(
      perDay.rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r.count])
    );
    const reportsPerDay = [];
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setUTCDate(d.getUTCDate() - i);
      const day = d.toISOString().slice(0, 10);
      reportsPerDay.push({ day, count: countsByDay.get(day) ?? 0 });
    }

    return NextResponse.json({
      by_status: byStatus.rows,
      by_category: byCategory.rows,
      totals: {
        total_reports: total,
        resolved_reports: resolved,
        resolution_rate:
          total === 0 ? 0 : Number(((resolved / total) * 100).toFixed(1)),
      },
      reports_per_day: reportsPerDay,
      top_supported: topSupported.rows,
    });
  } catch (err) {
    console.error('getStats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
