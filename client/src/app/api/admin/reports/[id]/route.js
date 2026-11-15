import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { parseIdParam } from '@/lib/http';
import { deleteByUrl } from '@/lib/storage';

export async function DELETE(request, { params }) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const reportId = parseIdParam(id);
    if (reportId === null) {
      return NextResponse.json({ error: 'Invalid report id' }, { status: 400 });
    }

    // Collect the report's file URLs first so they can be cleaned up.
    const files = await query(
      `SELECT resolution_image_url FROM reports WHERE id = $1
       UNION ALL
       SELECT url FROM report_images WHERE report_id = $1`,
      [reportId]
    );

    // DELETE ... RETURNING: rowCount 0 means the report was already
    // gone (e.g. a concurrent delete), so report 404, not success.
    const deleted = await query(
      'DELETE FROM reports WHERE id = $1 RETURNING id',
      [reportId]
    );
    if (deleted.rows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Best-effort cleanup of uploaded images (report_images rows are
    // removed by ON DELETE CASCADE). Handles Supabase Storage URLs
    // and legacy pre-migration /uploads/... files alike.
    for (const row of files.rows) {
      const url = row.resolution_image_url;
      if (!url) continue;
      await deleteByUrl(url);
    }

    return NextResponse.json({ deleted: true, id: reportId });
  } catch (err) {
    console.error('admin.deleteReport error:', err);
    return NextResponse.json({ error: 'Failed to delete report' }, { status: 500 });
  }
}
