import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';

const VALID_STATUSES = ['reported', 'under_review', 'in_progress', 'resolved'];

export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const { status } = await request.json();

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const existing = await query('SELECT status FROM reports WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const oldStatus = existing.rows[0].status;
    if (oldStatus === status) {
      return NextResponse.json({ error: `Report is already ${status}` }, { status: 400 });
    }

    const { rows } = await query(
      `UPDATE reports
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    await query(
      `INSERT INTO status_history (report_id, old_status, new_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [id, oldStatus, status, user.id]
    );

    return NextResponse.json({
      report: rows[0],
      old_status: oldStatus,
      new_status: status,
    });
  } catch (err) {
    console.error('admin.updateStatus error:', err);
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 });
  }
}
