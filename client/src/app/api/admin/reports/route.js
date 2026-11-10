import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { rows } = await query(
      `SELECT
         r.id, r.title, r.description, r.address, r.latitude, r.longitude,
         r.severity, r.status, r.priority_score, r.created_at, r.updated_at,
         r.category_id, c.name AS category_name,
         u.id AS user_id, u.name AS reporter_name, u.email AS reporter_email,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       ORDER BY r.created_at DESC
       LIMIT 500`
    );
    return NextResponse.json({ reports: rows });
  } catch (err) {
    console.error('admin.listAllReports error:', err);
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 });
  }
}
