import { NextResponse } from 'next/server';
import { query, withTransaction } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { findDuplicates } from '@/lib/duplicate.service';
import { computePriority } from '@/lib/priority.service';
import { parseJsonBody, parsePagination, VALID_STATUSES } from '@/lib/http';
import { checkRateLimit } from '@/lib/rate-limit';

// Fresh-age priority score, equivalent to the stored priority_score
// (severity*10 + min(support,50)*2 + min(age_days,30)*0.5) but with the
// age component computed at query time so it never goes stale.
const FRESH_SCORE_SQL = `(
  r.severity * 10
  + LEAST(COALESCE(s.support_count, 0), 50) * 2
  + LEAST(EXTRACT(EPOCH FROM (NOW() - r.created_at)) / 86400, 30) * 0.5
)`;

const SUPPORT_COUNT_JOIN = `LEFT JOIN (
  SELECT report_id, COUNT(*)::int AS support_count
  FROM supports GROUP BY report_id
) s ON s.report_id = r.id`;

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryIdRaw = searchParams.get('category_id');
    const mine = searchParams.get('mine') === 'true';

    const { limit, offset, error: pageError } = parsePagination(searchParams);
    if (pageError) {
      return NextResponse.json({ error: pageError }, { status: 400 });
    }

    let category_id = null;
    if (categoryIdRaw !== null) {
      category_id = Number(categoryIdRaw);
      if (!Number.isInteger(category_id)) {
        return NextResponse.json({ error: 'category_id must be an integer' }, { status: 400 });
      }
    }

    const conditions = [];
    const params = [];

    // Unknown status values are ignored (treated as no filter).
    if (status && VALID_STATUSES.includes(status)) {
      params.push(status);
      conditions.push(`r.status = $${params.length}`);
    }
    if (category_id !== null) {
      params.push(category_id);
      conditions.push(`r.category_id = $${params.length}`);
    }

    if (mine) {
      const user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.json({ error: 'No token provided' }, { status: 401 });
      }
      params.push(user.id);
      conditions.push(`r.user_id = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [listResult, totalResult] = await Promise.all([
      query(
        `SELECT
           r.id, r.title, r.description, r.address, r.latitude, r.longitude,
           r.severity, r.status, r.priority_score, r.created_at,
           r.category_id, c.name AS category_name, c.icon AS category_icon,
           u.name AS reporter_name,
           COALESCE(s.support_count, 0) AS support_count
         FROM reports r
         JOIN categories c ON c.id = r.category_id
         JOIN users u      ON u.id = r.user_id
         ${SUPPORT_COUNT_JOIN}
         ${whereClause}
         ORDER BY ${FRESH_SCORE_SQL} DESC, r.created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(
        `SELECT COUNT(*)::int AS total FROM reports r ${whereClause}`,
        params
      ),
    ]);

    return NextResponse.json({ reports: listResult.rows, total: totalResult.rows[0].total });
  } catch (err) {
    console.error('listReports error:', err);
    return NextResponse.json({ error: 'Failed to list reports' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const limited = checkRateLimit(`report-create:${user.id}`, {
      limit: 20,
      windowMs: 15 * 60 * 1000,
    });
    if (limited) {
      return NextResponse.json(
        { error: 'Too many reports created, please try again later' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } }
      );
    }

    const { body, error } = await parseJsonBody(request);
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const { title, description, category_id, latitude, longitude, severity, address } = body;

    if (typeof title !== 'string' || title.trim().length === 0 || title.trim().length > 150) {
      return NextResponse.json(
        { error: 'Title must be a non-empty string of 150 characters or fewer' },
        { status: 400 }
      );
    }
    if (
      typeof description !== 'string' ||
      description.trim().length === 0 ||
      description.trim().length > 2000
    ) {
      return NextResponse.json(
        { error: 'Description must be a non-empty string of 2000 characters or fewer' },
        { status: 400 }
      );
    }
    if (address !== undefined && address !== null) {
      if (typeof address !== 'string' || address.length > 300) {
        return NextResponse.json(
          { error: 'Address must be a string of 300 characters or fewer' },
          { status: 400 }
        );
      }
    }
    if (!Number.isInteger(category_id)) {
      return NextResponse.json({ error: 'category_id must be an integer' }, { status: 400 });
    }
    if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
      return NextResponse.json({ error: 'Invalid latitude' }, { status: 400 });
    }
    if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
      return NextResponse.json({ error: 'Invalid longitude' }, { status: 400 });
    }
    const sev = severity ?? 2;
    if (!Number.isInteger(sev) || sev < 1 || sev > 5) {
      return NextResponse.json({ error: 'Severity must be an integer between 1 and 5' }, { status: 400 });
    }

    const catCheck = await query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (catCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid category_id' }, { status: 400 });
    }

    const force = new URL(request.url).searchParams.get('force') === 'true';

    // Duplicate check + insert in one transaction so a concurrent
    // identical report cannot slip between the check and the insert.
    const result = await withTransaction(async (client) => {
      const txQuery = (text, params) => client.query(text, params);
      const duplicates = await findDuplicates(
        { title, description, latitude, longitude, category_id },
        txQuery
      );
      if (duplicates.length > 0 && !force) {
        return { duplicates };
      }
      const duplicateOf = duplicates.length > 0 ? duplicates[0].id : null;
      const { rows } = await txQuery(
        `INSERT INTO reports
           (user_id, category_id, title, description, latitude, longitude, severity, address, duplicate_of)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [user.id, category_id, title, description, latitude, longitude, sev, address || null, duplicateOf]
      );
      return { report: rows[0] };
    });

    if (result.duplicates) {
      return NextResponse.json(
        {
          message: 'Similar reports found nearby. Support an existing one or resubmit with ?force=true',
          duplicates: result.duplicates,
        },
        { status: 409 }
      );
    }

    const report = result.report;
    try {
      const score = await computePriority(report.id);
      if (score !== null) report.priority_score = score;
    } catch (priorityErr) {
      // Best effort: the report is already saved; a failed recompute
      // must not turn this into a 500 (the client would retry and
      // create a duplicate).
      console.error('computePriority after create failed:', priorityErr);
    }

    return NextResponse.json({ report }, { status: 201 });
  } catch (err) {
    console.error('createReport error:', err);
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
  }
}
