import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { parseIdParam } from '@/lib/http';

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const userId = parseIdParam(id);
    if (userId === null) {
      return NextResponse.json({ error: 'Invalid user id' }, { status: 400 });
    }

    // PUBLIC FIELDS ONLY. Never return email, password_hash, or role.
    const userRes = await query(
      `SELECT id, name, created_at FROM users WHERE id = $1`,
      [userId]
    );
    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const user = userRes.rows[0];

    const [statsRes, reportsRes] = await Promise.all([
      query(
        `SELECT
           (SELECT COUNT(*)::int FROM reports WHERE user_id = $1) AS total_reports,
           (SELECT COUNT(*)::int FROM reports WHERE user_id = $1 AND status = 'resolved') AS resolved_reports,
           (SELECT COUNT(*)::int FROM supports WHERE user_id = $1) AS total_supports_given
         `,
        [userId]
      ),
      query(
        `SELECT
           r.id, r.title, r.status, r.created_at,
           c.name AS category_name
         FROM reports r
         JOIN categories c ON c.id = r.category_id
         WHERE r.user_id = $1
         ORDER BY r.created_at DESC
         LIMIT 20`,
        [userId]
      ),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        memberSince: user.created_at,
      },
      stats: {
        totalReports: statsRes.rows[0].total_reports,
        resolvedReports: statsRes.rows[0].resolved_reports,
        totalSupportsGiven: statsRes.rows[0].total_supports_given,
      },
      reports: reportsRes.rows,
    });
  } catch (err) {
    console.error('getPublicUser error:', err);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}
