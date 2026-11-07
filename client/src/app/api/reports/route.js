import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { findDuplicates } from '@/lib/duplicate.service';
import { computePriority } from '@/lib/priority.service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category_id = searchParams.get('category_id');

    const conditions = [];
    const params = [];

    if (status) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    if (category_id) {
      params.push(category_id);
      conditions.push(`r.category_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await query(
      `SELECT
         r.id, r.title, r.description, r.latitude, r.longitude,
         r.severity, r.status, r.priority_score, r.created_at,
         r.category_id, c.name AS category_name, c.icon AS category_icon,
         u.name AS reporter_name,
         (SELECT COUNT(*)::int FROM supports s WHERE s.report_id = r.id) AS support_count
       FROM reports r
       JOIN categories c ON c.id = r.category_id
       JOIN users u      ON u.id = r.user_id
       ${whereClause}
       ORDER BY r.priority_score DESC, r.created_at DESC
       LIMIT 500`,
      params
    );

    return NextResponse.json({ reports: rows });
  } catch (err) {
    console.error('listReports error:', err);
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, category_id, latitude, longitude, severity } = body;

    if (!title || !description || !category_id || latitude == null || longitude == null) {
      return NextResponse.json(
        { error: 'title, description, category_id, latitude, longitude are required' },
        { status: 400 }
      );
    }
    if (title.length > 150) {
      return NextResponse.json({ error: 'Title must be 150 characters or fewer' }, { status: 400 });
    }
    if (latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 });
    }
    if (longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 });
    }

    const sev = severity ?? 2;
    if (sev < 1 || sev > 5) {
      return NextResponse.json({ error: 'Severity must be between 1 and 5' }, { status: 400 });
    }

    const catCheck = await query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (catCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid category_id' }, { status: 400 });
    }

    const force = new URL(request.url).searchParams.get('force') === 'true';
    if (!force) {
      const duplicates = await findDuplicates({
        title, description, latitude, longitude, category_id,
      });
      if (duplicates.length > 0) {
        return NextResponse.json(
          {
            message: 'Similar reports found nearby. Support an existing one or resubmit with ?force=true',
            duplicates,
          },
          { status: 409 }
        );
      }
    }

    const { rows } = await query(
      `INSERT INTO reports
         (user_id, category_id, title, description, latitude, longitude, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [user.id, category_id, title, description, latitude, longitude, sev]
    );

    const report = rows[0];
    const score = await computePriority(report.id);
    report.priority_score = score;

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error('createReport error:', err);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
