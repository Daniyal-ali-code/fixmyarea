import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const { rows } = await query(
      `SELECT
         r.*,
         c.name AS category_name, c.icon AS category_icon,
         u.name AS reporter_name,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       WHERE r.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const images = await query(
      'SELECT id, url FROM report_images WHERE report_id = $1 ORDER BY id',
      [id]
    );

    return NextResponse.json({ report: rows[0], images: images.rows });
  } catch (err) {
    console.error('getReport error:', err);
    return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 });
  }
}
